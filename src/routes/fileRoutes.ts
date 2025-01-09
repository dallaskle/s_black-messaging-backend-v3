import express from 'express';
import { fileController } from '../controllers/fileController';
import { authenticateToken } from '../middleware/auth';
import { fileService } from '../services/fileService';
import { NextFunction, Request, Response } from 'express';
import AppError from '../types/AppError';

const router = express.Router();

// Add file access middleware
const checkFileAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) throw new AppError('Authentication required', 401);
    
    await fileService.verifyFileAccess(fileId, userId);
    next();
  } catch (error) {
    next(error);
  }
};

router.post(
  '/channels/:channelId/files',
  authenticateToken,
  fileController.uploadMiddleware,
  fileController.uploadFile
);

router.delete(
  '/channels/:channelId/files/:fileId',
  authenticateToken,
  checkFileAccess,
  fileController.deleteFile
);

export default router; 