import { createClient } from '@supabase/supabase-js';
import supabase from '../config/supabaseClient';
import { File } from '../types/database';
import { v4 as uuidv4 } from 'uuid';
const STORAGE_BUCKET = process.env.SUPABASE_FILE_STORAGE_TABLE || 'files';
import AppError from '../types/AppError';

interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

// Create a service role client for storage operations
const serviceClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key instead
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const fileService = {
  async uploadFile(
    channelId: string,
    userId: string,
    file: MulterFile
  ): Promise<File> {
    const fileId = uuidv4();
    const fileExt = file.originalname.split('.').pop();
    const filePath = `${channelId}/${fileId}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await serviceClient
      .storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (storageError) {
      throw new Error(`Storage error: ${storageError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = serviceClient
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    // Create database record
    const { data, error } = await supabase
      .from('files')
      .insert({
        id: fileId,
        channel_id: channelId,
        user_id: userId,
        file_url: publicUrl,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      ...data,
      file_id: data.id
    };
  },

  async linkFilesToMessage(
    messageId: string,
    fileIds: string[]
  ): Promise<void> {
    console.log('linking files to message');
    console.log('fileIds', fileIds);
    const { error } = await supabase
      .from('message_files')
      .insert(
        fileIds.map(fileId => ({
          message_id: messageId,
          file_id: fileId
        }))
      );

    if (error) {
      throw new Error(`Database error: ${error.message}`);
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