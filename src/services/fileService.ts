import supabase, { serviceClient } from '../config/supabaseClient';
import { File } from '../types/database';
import { v4 as uuidv4 } from 'uuid';
const STORAGE_BUCKET = 's-black-messaging-files';
import AppError from '../types/AppError';

interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export const fileService = {
  async uploadFile(
    channelId: string,
    userId: string,
    file: MulterFile
  ): Promise<File> {
    const logContext = {
      channelId,
      userId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    };

    console.log('[File Upload] Starting process:', logContext);

    const fileId = uuidv4();
    const fileExt = file.originalname.split('.').pop();
    const filePath = `${channelId}/${fileId}.${fileExt}`;

    try {
      console.log('[File Upload] Uploading to storage:', { ...logContext, filePath });

      const { data: storageData, error: storageError } = await serviceClient
        .storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (storageError) {
        console.error('[File Upload] Storage upload failed:', { 
          ...logContext, 
          error: storageError 
        });
        throw new Error(`Storage error: ${storageError.message}`);
      }

      // Get the public URL for the file
      const { data: { publicUrl } } = serviceClient
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      console.log('[File Upload] Storage upload successful:', { fileId, publicUrl });

      // Store file record with the public URL
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

    } catch (error) {
      console.error('[File Upload] Unexpected error:', {
        ...logContext,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
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

  async verifyFileAccess(fileId: string, userId: string): Promise<void> {
    const { data: file } = await supabase
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

    if (!file) throw new AppError('File not found', 404);

    // Check channel membership
    const { data: membership } = await supabase
      .from('channel_members')
      .select('role')
      .eq('channel_id', file.channel_id)
      .eq('user_id', userId)
      .single();

    if (!membership && file.channels.is_private) {
      // For private channels, must be a member
      throw new AppError('Access denied', 403);
    }

    if (!membership) {
      // For public channels, check workspace membership
      const { data: workspaceMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', file.channels.workspace_id)
        .eq('user_id', userId)
        .single();

      if (!workspaceMember) throw new AppError('Access denied', 403);
    }
  },

  async deleteFile(fileId: string, userId?: string): Promise<void> {
    // If userId is provided, verify access
    if (userId) {
      await this.verifyFileAccess(fileId, userId);
    }

    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select()
      .eq('id', fileId)
      .single();

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    // Delete from storage
    const filePath = new URL(file.file_url).pathname.split('/').pop();
    const { error: storageError } = await serviceClient
      .storage
      .from(STORAGE_BUCKET)
      .remove([filePath!]);

    if (storageError) {
      throw new Error(`Storage error: ${storageError.message}`);
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }
  }
}; 