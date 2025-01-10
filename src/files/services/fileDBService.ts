import supabase from '../../config/supabaseClient';
import { File } from '../../types/database';
import AppError from '../../types/AppError';

export const fileDBService = {
  async createFileRecord(
    fileId: string,
    channelId: string,
    userId: string,
    file: Express.Multer.File,
    publicUrl: string
  ): Promise<File> {
    const logContext = {
      fileId,
      channelId,
      userId,
      fileName: file.originalname
    };

    console.log('[File Upload] Creating database record:', logContext);

    const { data, error } = await supabase
      .from('files')
      .insert({
        id: fileId,
        channel_id: channelId,
        user_id: userId,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        file_url: publicUrl
      })
      .select()
      .single();

    if (error) {
      console.error('[File Upload] Database record creation failed:', { 
        ...logContext, 
        error 
      });
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[File Upload] Successfully created file record:', { 
      ...logContext, 
      fileId: data.id 
    });

    return {
      ...data,
      file_id: data.id
    };
  },

  async linkFilesToMessage(
    messageId: string,
    fileIds: string[]
  ): Promise<void> {
    console.log('[File Linking] Starting process:', { messageId, fileIds });

    try {
      const { error } = await supabase
        .from('message_files')
        .insert(
          fileIds.map(fileId => ({
            message_id: messageId,
            file_id: fileId
          }))
        );

      if (error) {
        console.error('[File Linking] Failed:', { messageId, fileIds, error });
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('[File Linking] Completed successfully:', { messageId, fileIds });

    } catch (error) {
      console.error('[File Linking] Unexpected error:', {
        messageId,
        fileIds,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getFileById(fileId: string): Promise<File> {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        channels!inner (
          workspace_id,
          is_private
        )
      `)
      .eq('id', fileId)
      .single();

    if (error || !data) {
      throw new AppError('File not found', 404);
    }

    return data;
  },

  async deleteFileRecord(fileId: string): Promise<void> {
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}; 