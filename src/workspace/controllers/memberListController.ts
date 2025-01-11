import { Request, Response } from 'express';
import * as memberListService from '../services/memberListService';
import AppError from '../../types/AppError';

export const getWorkspaceMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) throw new AppError('Authentication required', 401);

    const members = await memberListService.getWorkspaceMembersList(workspaceId, userId);
    res.json(members);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const getChannelMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) throw new AppError('Authentication required', 401);

    const members = await memberListService.getChannelMembersList(channelId, userId);
    res.json(members);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}; 