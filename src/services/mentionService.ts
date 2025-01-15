import supabase from '../config/supabaseClient';
import { Mention, MentionType } from '../types/database';

export class MentionService {
    /**
     * Create a new mention
     */
    static async createMention(
        messageId: string,
        cloneId: string,
        mentionType: MentionType
    ): Promise<Mention> {
        const { data: mention, error } = await supabase
            .from('mentions')
            .insert([
                {
                    message_id: messageId,
                    clone_id: cloneId,
                    mention_type: mentionType,
                    responded: false
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return mention;
    }

    /**
     * Update mention with response
     */
    static async updateMentionResponse(
        mentionId: string,
        responseMessageId: string
    ): Promise<Mention> {
        const { data: mention, error } = await supabase
            .from('mentions')
            .update({
                response_message_id: responseMessageId,
                responded: true,
                responded_at: new Date().toISOString()
            })
            .eq('id', mentionId)
            .select()
            .single();

        if (error) throw error;
        return mention;
    }

    /**
     * Update mention with error
     */
    static async updateMentionError(
        mentionId: string,
        errorMessage: string
    ): Promise<Mention> {
        const { data: mention, error } = await supabase
            .from('mentions')
            .update({ error: errorMessage })
            .eq('id', mentionId)
            .select()
            .single();

        if (error) throw error;
        return mention;
    }

    /**
     * Get all unresponded mentions for a clone
     */
    static async getUnrespondedMentions(cloneId: string): Promise<Mention[]> {
        const { data: mentions, error } = await supabase
            .from('mentions')
            .select('*')
            .eq('clone_id', cloneId)
            .eq('responded', false)
            .is('error', null)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return mentions || [];
    }

    /**
     * Get mention by ID
     */
    static async getMentionById(mentionId: string): Promise<Mention | null> {
        const { data: mention, error } = await supabase
            .from('mentions')
            .select('*')
            .eq('id', mentionId)
            .single();

        if (error) throw error;
        return mention;
    }

    /**
     * Get mentions for a message
     */
    static async getMentionsForMessage(messageId: string): Promise<Mention[]> {
        const { data: mentions, error } = await supabase
            .from('mentions')
            .select('*')
            .eq('message_id', messageId);

        if (error) throw error;
        return mentions || [];
    }

    /**
     * Delete mention
     */
    static async deleteMention(mentionId: string): Promise<void> {
        const { error } = await supabase
            .from('mentions')
            .delete()
            .eq('id', mentionId);

        if (error) throw error;
    }
} 