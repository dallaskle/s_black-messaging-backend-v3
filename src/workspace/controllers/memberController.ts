import { Request, Response } from 'express';
import * as memberService from '../services/memberService';
import AppError from '../../types/AppError';

export const getWorkspaceMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new AppError('Authentication required', 401);

    const members = await memberService.getWorkspaceMembers(workspaceId, userId);
    res.json(members);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const addMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { userId, role } = req.body;
    const adminId = req.user?.id;
    if (!adminId) throw new AppError('Authentication required', 401);

    const member = await memberService.addWorkspaceMember(
      workspaceId,
      adminId,
      userId,
      role
    );
    res.status(201).json(member);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const updateMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, userId } = req.params;
    const adminId = req.user?.id;
    if (!adminId) throw new AppError('Authentication required', 401);

    const member = await memberService.updateWorkspaceMember(
      workspaceId,
      adminId,
      userId,
      req.body
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

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, userId } = req.params;
    const adminId = req.user?.id;
    if (!adminId) throw new AppError('Authentication required', 401);

    await memberService.removeWorkspaceMember(workspaceId, adminId, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}; 