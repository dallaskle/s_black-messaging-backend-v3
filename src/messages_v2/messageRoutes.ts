import express from 'express';
import { createMessage } from './controllers/createMessageController';
import { getChannelMessages, getThreadMessages } from './controllers/readMessageController';
import { updateMessage } from './controllers/updateMessageController';
import { deleteMessage } from './controllers/deleteMessageController';
import { authenticateToken } from '../middleware/authMiddleWare/authenticateToken';
import { upload } from '../middleware/upload';

const router = express.Router();

// Apply authentication middleware to all message routes
router.use(authenticateToken);

// Message routes
router.post(
  '/channels/:channelId/messages',
  upload.single('file'),
  createMessage
);
router.patch('/messages/:messageId', updateMessage);
router.delete('/messages/:messageId', deleteMessage);
router.get('/channels/:channelId/messages', getChannelMessages);
router.get('/messages/:messageId/thread', getThreadMessages);

export default router;
