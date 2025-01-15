import supabase from '../config/supabaseClient';
import { Clone, MentionType } from '../types/database';
import AppError from '../types/AppError';

interface ParsedMention {
    cloneName: string;
    cloneId: string;
    mentionType: MentionType;
    originalText: string;
}

export class MentionParserService {
    private static readonly MENTION_REGEX = /@(\w+)(?:\[id:([^\]]+)\])?/g;

    /**
     * Parse message content for mentions and validate clones
     */
    static async parseMessageMentions(
        content: string,
        workspaceId: string
    ): Promise<ParsedMention[]> {
        const mentions: ParsedMention[] = [];
        const mentionMatches = Array.from(content.matchAll(this.MENTION_REGEX));

        for (const match of mentionMatches) {
            const [originalText, cloneName, existingCloneId] = match;
            
            try {
                // If clone ID is already in the mention, validate it exists
                if (existingCloneId) {
                    const clone = await this.validateExistingClone(existingCloneId, workspaceId);
                    mentions.push({
                        cloneName,
                        cloneId: existingCloneId,
                        mentionType: this.determineMentionType(clone, workspaceId),
                        originalText
                    });
                    continue;
                }

                // Find clone by name
                const clone = await this.findCloneByName(cloneName, workspaceId);
                if (clone) {
                    mentions.push({
                        cloneName,
                        cloneId: clone.id,
                        mentionType: this.determineMentionType(clone, workspaceId),
                        originalText
                    });
                }
            } catch (error) {
                console.error(`Error processing mention for clone ${cloneName}:`, error);
                // Continue processing other mentions even if one fails
            }
        }

        return mentions;
    }

    /**
     * Format message content with clone IDs for storage
     */
    static formatMessageWithCloneIds(
        content: string,
        mentions: ParsedMention[]
    ): string {
        let formattedContent = content;
        for (const mention of mentions) {
            formattedContent = formattedContent.replace(
                mention.originalText,
                `@${mention.cloneName}[id:${mention.cloneId}]`
            );
        }
        return formattedContent;
    }

    private static async validateExistingClone(
        cloneId: string,
        workspaceId: string
    ): Promise<Clone> {
        const { data: clone, error } = await supabase
            .from('clones')
            .select('*')
            .eq('id', cloneId)
            .single();

        if (error || !clone) {
            throw new AppError('Clone not found', 404);
        }

        if (!this.isCloneAccessible(clone, workspaceId)) {
            throw new AppError('Clone not accessible in this workspace', 403);
        }

        return clone;
    }

    private static async findCloneByName(
        name: string,
        workspaceId: string
    ): Promise<Clone | null> {
        // First try to find a workspace-specific clone
        const { data: workspaceClone, error: workspaceError } = await supabase
            .from('clones')
            .select('*')
            .eq('name', name)
            .eq('workspace_id', workspaceId)
            .single();

        if (workspaceClone) return workspaceClone;

        // If no workspace clone found, look for a global clone
        const { data: globalClone, error: globalError } = await supabase
            .from('clones')
            .select('*')
            .eq('name', name)
            .eq('visibility', 'global')
            .is('workspace_id', null)
            .single();

        return globalClone || null;
    }

    private static isCloneAccessible(clone: Clone, workspaceId: string): boolean {
        return (
            clone.visibility === 'global' ||
            (clone.visibility === 'private' && clone.workspace_id === workspaceId)
        );
    }

    private static determineMentionType(
        clone: Clone,
        workspaceId: string
    ): MentionType {
        return clone.workspace_id === workspaceId ? 'WORKSPACE' : 'GLOBAL';
    }
} 