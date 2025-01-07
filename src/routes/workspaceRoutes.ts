import express from 'express';
import * as workspaceController from '../controllers/workspaceController';
import { authenticateToken, isWorkspaceAdmin } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all workspace routes
router.use(authenticateToken);

// Public workspace routes (for workspace members)
router.post('/', workspaceController.createWorkspace);
router.get('/', workspaceController.getUserWorkspaces);
router.get('/:workspaceId', workspaceController.getWorkspace);
router.get('/:workspaceId/members', workspaceController.getWorkspaceMembers);

// Admin-only workspace routes
router.patch('/:workspaceId', isWorkspaceAdmin, workspaceController.updateWorkspace);
router.delete('/:workspaceId', isWorkspaceAdmin, workspaceController.deleteWorkspace);
router.post('/:workspaceId/members', isWorkspaceAdmin, workspaceController.addMember);
router.patch('/:workspaceId/members/:userId', isWorkspaceAdmin, workspaceController.updateMember);
router.delete('/:workspaceId/members/:userId', isWorkspaceAdmin, workspaceController.removeMember);

export default router; 