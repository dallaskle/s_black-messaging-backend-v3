import { Request, Response, NextFunction } from 'express';
import { fileService } from '../services/fileService';
import multer from 'multer';

// Define types for file upload request
interface FileUploadRequest extends Request {
  file?: Express.Multer.File;
  params: {
    channelId: string;
    fileId?: string;
  };
  user?: {
    id: string;
    email: string;
  };
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

export const fileController = {
  uploadMiddleware: upload.single('file'),

  async uploadFile(req: FileUploadRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { channelId } = req.params;
      const file = await fileService.uploadFile(channelId, req.user.id, req.file);

      res.status(201).json({
        url: file.file_url,
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteFile(req: FileUploadRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileId } = req.params;
      if (!fileId) {
        res.status(400).json({ error: 'File ID is required' });
        return;
      }
      await fileService.deleteFile(fileId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}; 