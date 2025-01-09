import supabase from '../config/supabaseClient';
import AppError from '../types/AppError';
import { File } from '../types/database';

const BUCKET_NAME = 's-black-messaging-files';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit

export const fileServices = {
  async uploadFile(
    channelId: string,
    userId: string,
    messageId: string,
    file: Express.Multer.File
  ): Promise<File> {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError('File size exceeds limit (100MB)', 400);
    }

    try {
      // Upload to Supabase Storage
      const filePath = `${channelId}/${messageId}/${file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) throw new AppError(uploadError.message, 400);
      if (!uploadData) throw new AppError('Failed to upload file', 500);

      // Create signed URL
      const { data: urlData } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days expiry

      if (!urlData?.signedUrl) throw new AppError('Failed to generate URL', 500);

      // Save file metadata to database
      const { data: fileData, error: dbError } = await supabase
        .from('files')
        .insert({
          channel_id: channelId,
          user_id: userId,
          message_id: messageId,
          file_url: urlData.signedUrl,
          file_name: file.originalname,
          file_type: file.mimetype,
          file_size: file.size
        })
        .select()
        .single();

      if (dbError) throw new AppError(dbError.message, 400);
      if (!fileData) throw new AppError('Failed to save file metadata', 500);

      return fileData;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to process file upload', 500);
    }
  },

  async getFileUrl(fileId: string): Promise<string> {
    const { data: file, error: dbError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (dbError) throw new AppError(dbError.message, 400);
    if (!file) throw new AppError('File not found', 404);

    // Generate a fresh signed URL
    const filePath = `${file.channel_id}/${file.message_id}/${file.file_name}`;
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry for download links

    if (!urlData?.signedUrl) throw new AppError('Failed to generate download URL', 500);

    return urlData.signedUrl;
  },

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const { data: file, error: dbError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (dbError) throw new AppError(dbError.message, 400);
    if (!file) throw new AppError('File not found', 404);
    if (file.user_id !== userId) throw new AppError('Unauthorized', 403);

    // Delete from storage
    const filePath = `${file.channel_id}/${file.message_id}/${file.file_name}`;
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (storageError) throw new AppError(storageError.message, 500);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (deleteError) throw new AppError(deleteError.message, 500);
  }
}; 