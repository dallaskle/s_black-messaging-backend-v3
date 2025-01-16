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
        try {
            // Get the original message that contains the mention
            const message = await this.getOriginalMessage(mention.message_id);
            if (!message) {
                throw new AppError('Original message not found', 404);
            }

            // Get the clone's base prompt
            const { data: clone } = await supabase
                .from('clones')
                .select('base_prompt')
                .eq('id', mention.clone_id)
                .single();

            if (!clone) {
                throw new AppError('Clone not found', 404);
            }

            // Prepare conversation context
            const context = await this.buildConversationContext(message);

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

            if (!aiResponse?.response) {
                throw new AppError('No response from AI service', 500);
            }

            // Create clone message
            const cloneMessage = await CloneMessageService.createCloneMessage(
                message.channel_id,
                mention.clone_id,
                aiResponse.response,
                message.id
            );

            // Mark mention as responded
            await MentionService.updateMentionResponse(mention.id, cloneMessage.id);

        } catch (error) {
            console.error('Error processing mention:', error);
            await MentionService.updateMentionError(
                mention.id,
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    /**
     * Process all unresponded mentions for a clone
     */
    static async processUnrespondedMentions(cloneId: string): Promise<void> {
        const mentions = await MentionService.getUnrespondedMentions(cloneId);
        
        // Process mentions sequentially to maintain conversation order
        for (const mention of mentions) {
            await this.processMention(mention);
        }
    }

    /**
     * Get the original message that contains the mention
     */
    private static async getOriginalMessage(messageId: string): Promise<Message | null> {
        const { data: message } = await supabase
            .from('messages')
            .select(`
                *,
                channels (
                    workspace_id
                )
            `)
            .eq('id', messageId)
            .single();

        return message;
    }

    /**
     * Build conversation context for AI service
     */
    private static async buildConversationContext(message: Message): Promise<Array<{ role: string; content: string }>> {
        const context: Array<{ role: string; content: string }> = [];

        // If this is a reply, get the parent message
        if (message.parent_message_id) {
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
            }
        }

        // Add the current message
        context.push({
            role: 'user',
            content: message.content
        });

        return context;
    }
} 