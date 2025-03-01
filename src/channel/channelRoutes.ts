import express from 'express';
import * as channelController from './channelController';
import { authenticateToken } from '../middleware/authMiddleWare/authenticateToken';

const router = express.Router();

// Apply authentication middleware to all channel routes
router.use(authenticateToken);

// Channel routes
router.post('/workspaces/:workspaceId/channels', channelController.createChannel);
router.post('/workspaces/:workspaceId/dm', channelController.createDMChannel);
router.get('/workspaces/:workspaceId/channels', channelController.getWorkspaceChannels);
router.get('/channels/:channelId', channelController.getChannel);
router.patch('/channels/:channelId', channelController.updateChannel);
router.delete('/channels/:channelId', channelController.deleteChannel);
router.post('/channels/:channelId/members', channelController.addChannelMember);

export default router; 