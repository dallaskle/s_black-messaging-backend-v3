import supabase from '../../config/supabaseClient';
import { CloneMessage, MessageStatus } from '../../types/database';
import AppError from '../../types/AppError';
import { fileService } from '../../files/services/fileService';

export class CloneMessageService {
    /**
     * Create a new clone message
     */
    static async createCloneMessage(
        channelId: string,
        cloneId: string,
        content: string,
        parentMessageId?: string,
        fileIds?: string[]
    ): Promise<CloneMessage> {
        // Create the message
        const { data: message, error } = await supabase
            .from('clone_messages')
            .insert([
                {
                    channel_id: channelId,
                    clone_id: cloneId,
                    content,
                    parent_message_id: parentMessageId,
                    status: MessageStatus.Active
                }
            ])
            .select(`
                *,
                channels!inner (
                    workspace_id
                ),
                clones!inner (
                    name
                )
            `)
            .single();

        if (error) throw new AppError(error.message, 500);
        if (!message) throw new AppError('Failed to create clone message', 500);

        // If there are files, link them to the message
        if (fileIds && fileIds.length > 0) {
            const fileLinks = fileIds.map(fileId => ({
                clone_message_id: message.id,
                file_id: fileId
            }));

            const { error: linkError } = await supabase
                .from('clone_message_files')
                .insert(fileLinks);

            if (linkError) throw new AppError(linkError.message, 500);
        }

        return message;
    }

    /**
     * Update a clone message
     */
    static async updateCloneMessage(
        messageId: string,
        content: string
    ): Promise<CloneMessage> {
        const { data: message, error } = await supabase
            .from('clone_messages')
            .update({
                content,
                updated_at: new Date().toISOString(),
                status: MessageStatus.Edited
            })
            .eq('id', messageId)
            .select(`
                *,
                channels!inner (
                    workspace_id
                ),
                clones!inner (
                    name
                )
            `)
            .single();

        if (error) throw new AppError(error.message, 400);
        if (!message) throw new AppError('Message not found', 404);

        return message;
    }

    /**
     * Delete a clone message
     */
    static async deleteCloneMessage(messageId: string): Promise<void> {
        // Get message with its files
        const { data: message } = await supabase
            .from('clone_messages')
            .select(`
                *,
                files:clone_message_files!left (
                    file:files (
                        id
                    )
                )
            `)
            .eq('id', messageId)
            .single();

        if (!message) throw new AppError('Message not found', 404);

        // Delete associated files
        if (message.files) {
            for (const fileRelation of message.files) {
                await fileService.deleteFile(fileRelation.file.id);
            }
        }

        // Delete the message (clone_message_files will be deleted via CASCADE)
        const { error } = await supabase
            .from('clone_messages')
            .delete()
            .eq('id', messageId);

        if (error) throw new AppError(error.message, 400);
    }
} 