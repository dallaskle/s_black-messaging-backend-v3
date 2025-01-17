import { aiService } from '../clones/services/ai.service';
import { CloneMessageService } from '../clones/services/cloneMessageService';
import { MentionService } from './mentionService';
import { Message, Mention } from '../types/database';
import supabase from '../config/supabaseClient';
import AppError from '../types/AppError';

export class MentionProcessorService {
    /**
     * Process a single mention
     */
    static async processMention(mention: Mention): Promise<void> {
        console.log('[MentionProcessor] Starting to process mention:', {
            mentionId: mention.id,
            messageId: mention.message_id,
            cloneId: mention.clone_id
        });

        try {
            // Get the original message that contains the mention
            const message = await this.getOriginalMessage(mention.message_id);
            if (!message) {
                throw new AppError('Original message not found', 404);
            }

            console.log('[MentionProcessor] Retrieved original message:', {
                messageId: message.id,
                content: message.content,
                channelId: message.channel_id,
                workspaceId: message.channels?.workspace_id
            });

            // Get the clone's base prompt
            const { data: clone } = await supabase
                .from('clones')
                .select('base_prompt, name')
                .eq('id', mention.clone_id)
                .single();

            if (!clone) {
                throw new AppError('Clone not found', 404);
            }

            console.log('[MentionProcessor] Retrieved clone:', {
                cloneId: mention.clone_id,
                cloneName: clone.name,
                hasBasePrompt: !!clone.base_prompt
            });

            // Prepare conversation context
            const context = await this.buildConversationContext(message);
            console.log('[MentionProcessor] Built conversation context:', {
                contextLength: context.length,
                messages: context.map(msg => ({ role: msg.role, contentLength: msg.content.length }))
            });

            console.log('[MentionProcessor] Calling AI service with:', {
                cloneId: mention.clone_id,
                workspaceId: message.channels?.workspace_id,
                channelId: message.channel_id,
                contextLength: context.length,
                basePromptLength: clone.base_prompt?.length,
                queryLength: message.content.length
            });

            // Send to AI service
            const aiResponse = await aiService.chat({
                messages: context,
                clone_id: mention.clone_id,
                //workspace_id: message.channels?.workspace_id,
                //channel_id: message.channel_id,
                base_prompt: clone.base_prompt,
                pinecone_index: 'clones', // TODO: Make this configurable
                query: message.content
            });

            console.log('[MentionProcessor] Received AI response:', {
                hasResponse: !!aiResponse?.response,
                responseLength: aiResponse?.response?.length,
                hasContext: !!aiResponse?.context
            });

            if (!aiResponse?.response) {
                console.warn('[MentionProcessor] Empty response from AI service');
                throw new AppError('No response from AI service', 500);
            }

            // Create clone message
            console.log('[MentionProcessor] Creating clone message');
            const cloneMessage = await CloneMessageService.createCloneMessage(
                message.channel_id,
                mention.clone_id,
                aiResponse.response,
                message.id
            );

            console.log('[MentionProcessor] Created clone message:', {
                cloneMessageId: cloneMessage.id,
                channelId: cloneMessage.channel_id,
                contentLength: cloneMessage.content.length
            });

            // Mark mention as responded
            try {
                await MentionService.updateMentionResponse(mention.id, cloneMessage.id);
                console.log('[MentionProcessor] Marked mention as responded:', {
                    mentionId: mention.id,
                    responseMessageId: cloneMessage.id
                });
            } catch (updateError) {
                console.error('[MentionProcessor] Error updating mention response:', {
                    mentionId: mention.id,
                    responseMessageId: cloneMessage.id,
                    error: updateError instanceof Error ? updateError.message : 'Unknown error'
                });
                throw updateError;
            }

        } catch (error) {
            console.error('[MentionProcessor] Error processing mention:', {
                mentionId: mention.id,
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack
                } : 'Unknown error'
            });
            try {
                await MentionService.updateMentionError(
                    mention.id,
                    error instanceof Error ? error.message : 'Unknown error'
                );
            } catch (updateError) {
                console.error('[MentionProcessor] Error updating mention error status:', {
                    mentionId: mention.id,
                    error: updateError instanceof Error ? updateError.message : 'Unknown error'
                });
            }
        }
    }

    /**
     * Process all unresponded mentions for a clone
     */
    static async processUnrespondedMentions(cloneId: string): Promise<void> {
        console.log('[MentionProcessor] Processing unresponded mentions for clone:', cloneId);
        const mentions = await MentionService.getUnrespondedMentions(cloneId);
        console.log('[MentionProcessor] Found unresponded mentions:', mentions.length);
        
        // Process mentions sequentially to maintain conversation order
        for (const mention of mentions) {
            await this.processMention(mention);
        }
    }

    /**
     * Get the original message that contains the mention
     */
    private static async getOriginalMessage(messageId: string): Promise<Message | null> {
        console.log('[MentionProcessor] Getting original message:', messageId);
        const { data: message, error } = await supabase
            .from('messages')
            .select(`
                *,
                channels (
                    workspace_id
                )
            `)
            .eq('id', messageId)
            .single();

        if (error) {
            console.error('[MentionProcessor] Error getting original message:', {
                messageId,
                error: error.message
            });
        }

        return message;
    }

    /**
     * Build conversation context for AI service
     */
    private static async buildConversationContext(message: Message): Promise<Array<{ role: string; content: string }>> {
        console.log('[MentionProcessor] Building conversation context for message:', message.id);
        const context: Array<{ role: string; content: string }> = [];

        // If this is a reply, get the parent message
        if (message.parent_message_id) {
            console.log('[MentionProcessor] Message is a reply, getting parent:', message.parent_message_id);
            const { data: parentMessage } = await supabase
                .from('messages')
                .select('*')
                .eq('id', message.parent_message_id)
                .single();

            if (parentMessage) {
                context.push({
                    role: 'user',
                    content: parentMessage.content
                });
                console.log('[MentionProcessor] Added parent message to context');
            }
        }

        // Add the current message
        context.push({
            role: 'user',
            content: message.content
        });
        console.log('[MentionProcessor] Added current message to context');

        return context;
    }
} 