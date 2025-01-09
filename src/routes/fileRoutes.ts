import express from 'express';
import multer from 'multer';
import * as fileController from '../controllers/fileController'
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

router.post('/files/upload', upload.single('file'), fileController.uploadFile);
router.get('/files/:fileId/url', fileController.getFileUrl);
router.delete('/files/:fileId', fileController.deleteFile);

export default router; 