import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticateToken } from '../../middleware/authMiddleWare/authenticateToken';

const router = Router();

// Message search endpoint
router.post('/ai/message-search', authenticateToken, (req, res) => aiController.messageSearch(req, res));

export default router;
