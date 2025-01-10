import { File } from '../../types/database';
import { fileStorageService } from './fileStorageService';
import { fileDBService } from './fileDBService';
import { fileAccessService } from './fileAccessService';

export const fileService = {
  async uploadFile(
    channelId: string,
    userId: string,
    file: Express.Multer.File
  ): Promise<File> {
    try {
      // Upload to storage
      const { fileId, publicUrl } = await fileStorageService.uploadFile(channelId, file);

      // Create database record
      return await fileDBService.createFileRecord(
        fileId,
        channelId,
        userId,
        file,
        publicUrl
      );
    } catch (error) {
      console.error('[File Upload] Error:', {
        channelId,
        userId,
        fileName: file.originalname,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async linkFilesToMessage(messageId: string, fileIds: string[]): Promise<void> {
    return fileDBService.linkFilesToMessage(messageId, fileIds);
  },

  async verifyFileAccess(fileId: string, userId: string): Promise<void> {
    return fileAccessService.verifyFileAccess(fileId, userId);
  },

  async deleteFile(fileId: string, userId?: string): Promise<void> {
    // If userId is provided, verify access
    if (userId) {
      await fileAccessService.verifyFileAccess(fileId, userId);
    }

    const file = await fileDBService.getFileById(fileId);
    
    // Delete from storage
    const filePath = new URL(file.file_url).pathname.split('/').pop()!;
    await fileStorageService.deleteFile(filePath);

    // Delete database record
    await fileDBService.deleteFileRecord(fileId);

    console.log('[File Delete] Starting process:', { fileId, userId });
    try {
      // ... existing code ...
    } catch (error) {
      console.error('[File Delete] Error:', {
        fileId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}; 