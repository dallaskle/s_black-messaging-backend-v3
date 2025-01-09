import { createClient } from '@supabase/supabase-js';
import supabase from '../config/supabaseClient';
import { File } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_BUCKET = process.env.SUPABASE_FILE_STORAGE_TABLE || 'files';

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
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  },

  async deleteFile(fileId: string): Promise<void> {
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