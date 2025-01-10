import express from 'express';
import * as directMessageController from './directMessage.controller';
import { authenticateToken } from '../../middleware/authMiddleWare/authenticateToken';

const router = express.Router();

router.use(authenticateToken);

router.post('/workspaces/:workspaceId/dm', directMessageController.createDMChannel);

export default router; 