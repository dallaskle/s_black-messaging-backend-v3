import express from 'express';
import * as generalChannelController from './generalChannel.controller';
import { authenticateToken } from '../../middleware/authMiddleWare/authenticateToken';

const router = express.Router();

router.use(authenticateToken);

router.post('/workspaces/:workspaceId/channels', generalChannelController.createChannel);
router.get('/workspaces/:workspaceId/channels', generalChannelController.getWorkspaceChannels);
router.get('/channels/:channelId', generalChannelController.getChannel);
router.patch('/channels/:channelId', generalChannelController.updateChannel);
router.delete('/channels/:channelId', generalChannelController.deleteChannel);

export default router; 