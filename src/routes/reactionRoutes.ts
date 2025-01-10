import express from 'express';
import * as reactionController from '../controllers/reactionController'
import { authenticateToken } from '../middleware/authMiddleWare/authenticateToken';

const router = express.Router();

router.use(authenticateToken);

router.post('/channels/:channelId/messages/:messageId/reactions', reactionController.addReaction);
router.delete('/channels/:channelId/messages/:messageId/reactions', reactionController.removeReaction);
router.get('/channels/:channelId/messages/:messageId/reactions', reactionController.getMessageReactions);
router.get('/channels/:channelId/messages/:messageId/reactions/count', reactionController.getReactionCounts);
router.get('/channels/:channelId/messages/reactions', reactionController.getChannelReactions);
router.get('/workspaces/:workspaceId/reactions/popular', reactionController.getPopularWorkspaceReactions);

export default router; 