import express from 'express';
import * as directMessageController from './directMessage.controller';
import { authenticateToken } from '../../middleware/authMiddleWare/authenticateToken';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// DM routes
router.post('/workspaces/:workspaceId/dm', directMessageController.createDM);
router.post('/workspaces/:workspaceId/group-dm', directMessageController.createGroupDM);

export default router; 