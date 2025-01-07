import express from 'express';
import * as messageController from '../controllers/messageController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all message routes
router.use(authenticateToken);

// Message routes
router.post('/channels/:channelId/messages', messageController.createMessage);
router.patch('/messages/:messageId', messageController.updateMessage);
router.delete('/messages/:messageId', messageController.deleteMessage);
router.get('/channels/:channelId/messages', messageController.getChannelMessages);

export default router; 