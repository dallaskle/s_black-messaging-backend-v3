import express from 'express';
import * as workspaceController from './controllers/workspaceController';
import * as memberController from './controllers/memberController';
import * as invitationController from './controllers/invitationController';
import { authenticateToken } from '../middleware/authMiddleWare/authenticateToken';
import { isWorkspaceAdmin } from '../middleware/authMiddleWare/isWorkspaceAdmin';
const router = express.Router();

// Apply authentication middleware to all workspace routes
router.use(authenticateToken);

// Public workspace routes (for workspace members)
router.post('/', workspaceController.createWorkspace);
router.get('/', workspaceController.getUserWorkspaces);
router.get('/:workspaceId', workspaceController.getWorkspacebyId);
router.get('/:workspaceId/members', memberController.getWorkspaceMembers);

// Admin-only workspace routes
router.patch('/:workspaceId', isWorkspaceAdmin, workspaceController.updateWorkspacebyId);
router.delete('/:workspaceId', isWorkspaceAdmin, workspaceController.deleteWorkspace);
router.post('/:workspaceId/members', isWorkspaceAdmin, memberController.addMember);
router.patch('/:workspaceId/members/:userId', isWorkspaceAdmin, memberController.updateMember);
router.delete('/:workspaceId/members/:userId', isWorkspaceAdmin, memberController.removeMember);

// Invitation routes
router.post(
  '/:workspaceId/invitations',
  isWorkspaceAdmin,
  invitationController.createInvitation
);

router.get(
  '/:workspaceId/invitations',
  isWorkspaceAdmin,
  invitationController.getInvitations
);

router.post(
  '/:workspaceId/invitations/accept',
  invitationController.acceptInvitation
);

router.delete(
  '/:workspaceId/invitations/:invitationId',
  isWorkspaceAdmin,
  invitationController.revokeInvitation
);

export default router; 