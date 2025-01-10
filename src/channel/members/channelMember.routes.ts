import express from 'express';
import * as channelMemberController from './channelMember.controller';
import { authenticateToken } from '../../middleware/authMiddleWare/authenticateToken';

const router = express.Router();

router.use(authenticateToken);

router.post('/channels/:channelId/members', channelMemberController.addChannelMember);

export default router; 