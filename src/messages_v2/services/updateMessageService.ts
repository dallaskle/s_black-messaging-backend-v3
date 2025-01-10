import supabase from '../../config/supabaseClient';
import { EnrichedMessage } from '../../types/database';
import AppError from '../../types/AppError';
import { enrichMessageWithDetails } from '../utils/messageEnricher';

export const updateMessage = async (
  messageId: string,
  userId: string,
  content: string
): Promise<EnrichedMessage> => {
  // Check if message exists and belongs to user
  const { data: message } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (!message) throw new AppError('Message not found', 404);
  if (message.user_id !== userId) throw new AppError('Access denied', 403);

  const { data: updatedMessage, error } = await supabase
    .from('messages')
    .update({ 
      content,
      updated_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .select(`
      *,
      channels!inner (
        workspace_id
      )
    `)
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!updatedMessage) throw new AppError('Failed to update message', 500);

  return enrichMessageWithDetails(updatedMessage, userId);
};
