import express from 'express';
import * as messageReactionController from './controllers/messageReactionController';
import * as channelReactionController from './controllers/channelReactionController';
import * as workspaceReactionController from './controllers/workspaceReactionController';
import { authenticateToken } from '../middleware/authMiddleWare/authenticateToken';

const router = express.Router();

router.use(authenticateToken);

// Message-level reaction routes
router.post('/channels/:channelId/messages/:messageId/reactions', messageReactionController.addReaction);
router.delete('/channels/:channelId/messages/:messageId/reactions', messageReactionController.removeReaction);
router.get('/channels/:channelId/messages/:messageId/reactions', messageReactionController.getMessageReactions);
router.get('/channels/:channelId/messages/:messageId/reactions/count', messageReactionController.getReactionCounts);

// Channel-level reaction routes
router.get('/channels/:channelId/messages/reactions', channelReactionController.getChannelReactions);

// Workspace-level reaction routes
router.get('/workspaces/:workspaceId/reactions/popular', workspaceReactionController.getPopularWorkspaceReactions);

export default router; 