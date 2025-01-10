import express from 'express';
import * as workspaceController from '../controllers/workspaceController';
import { authenticateToken } from '../middleware/authMiddleWare/authenticateToken';
import { isWorkspaceAdmin } from '../middleware/authMiddleWare/isWorkspaceAdmin';
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

// Invitation routes
router.post(
  '/:workspaceId/invitations',
  isWorkspaceAdmin,
  workspaceController.createInvitation
);

router.get(
  '/:workspaceId/invitations',
  isWorkspaceAdmin,
  workspaceController.getInvitations
);

router.post(
  '/:workspaceId/invitations/accept',
  workspaceController.acceptInvitation
);

router.delete(
  '/:workspaceId/invitations/:invitationId',
  isWorkspaceAdmin,
  workspaceController.revokeInvitation
);

export default router; 