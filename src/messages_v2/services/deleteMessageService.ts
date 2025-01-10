import supabase from '../../config/supabaseClient';
import AppError from '../../types/AppError';
import { fileService } from '../../files/services/fileService';

export const deleteMessage = async (
  messageId: string,
  userId: string
): Promise<void> => {
  // Check if message exists and belongs to user
  const { data: message } = await supabase
    .from('messages')
    .select(`
      *,
      files:message_files!left (
        file:files (
          id
        )
      )
    `)
    .eq('id', messageId)
    .single();

  if (!message) throw new AppError('Message not found', 404);
  if (message.user_id !== userId) throw new AppError('Access denied', 403);

  // Delete associated files
  if (message.files) {
    for (const fileRelation of message.files) {
      await fileService.deleteFile(fileRelation.file.id);
    }
  }

  // The message_files records will be automatically deleted due to CASCADE
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) throw new AppError(error.message, 400);
};
