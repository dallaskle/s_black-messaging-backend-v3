import { Request, Response } from 'express';
import * as invitationService from '../services/invitationService';
import AppError from '../../types/AppError';

export const createInvitation = async (req: Request, res: Response): Promise<void> => {
  try {

    const { workspaceId } = req.params;
    const { email, role = 'member', singleUse = true, expiresIn } = req.body;
    const adminId = req.user?.id;

    if (!adminId) throw new AppError('Authentication required', 401);

    const invitation = await invitationService.createWorkspaceInvitation(
      workspaceId,
      adminId,
      email,
      role,
      expiresIn,
      singleUse
    );

    res.status(201).json(invitation);
  } catch (error) {
    console.error('[createInvitation] Error:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const getInvitations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) throw new AppError('Authentication required', 401);

    const invitations = await invitationService.getWorkspaceInvitations(
      workspaceId,
      adminId
    );

    res.json(invitations);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const acceptInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { token } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Authentication required', 401);

    const member = await invitationService.acceptWorkspaceInvitation(
      workspaceId,
      token,
      userId
    );

    res.json(member);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const revokeInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, invitationId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) throw new AppError('Authentication required', 401);

    await invitationService.revokeWorkspaceInvitation(
      workspaceId,
      invitationId,
      adminId
    );

    res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}; 