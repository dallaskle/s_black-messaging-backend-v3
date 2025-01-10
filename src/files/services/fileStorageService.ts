import { serviceClient } from '../../config/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_BUCKET = 's-black-messaging-files';

interface StorageUploadResult {
  fileId: string;
  publicUrl: string;
  filePath: string;
}

export const fileStorageService = {
  async uploadFile(
    channelId: string,
    file: Express.Multer.File
  ): Promise<StorageUploadResult> {
    const logContext = {
      channelId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    };

    console.log('[File Upload] Uploading to storage:', { ...logContext });

    const fileId = uuidv4();
    const fileExt = file.originalname.split('.').pop();
    const filePath = `${channelId}/${fileId}.${fileExt}`;

    const { error: storageError } = await serviceClient
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

    const { data: { publicUrl } } = serviceClient
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    console.log('[File Upload] Storage upload successful:', { fileId, publicUrl });

    return { fileId, publicUrl, filePath };
  },

  async deleteFile(filePath: string): Promise<void> {
    const { error: storageError } = await serviceClient
      .storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (storageError) {
      throw new Error(`Storage error: ${storageError.message}`);
    }
  }
}; 