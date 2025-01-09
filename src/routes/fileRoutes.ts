import express from 'express';
import { fileController } from '../controllers/fileController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post(
  '/channels/:channelId/files',
  authenticateToken,
  fileController.uploadMiddleware,
  fileController.uploadFile
);

router.delete(
  '/channels/:channelId/files/:fileId',
  authenticateToken,
  fileController.deleteFile
);

export default router; 