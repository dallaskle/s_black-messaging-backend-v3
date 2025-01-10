import { Request, Response } from 'express';
import * as directMessageService from '../../channel/directMessage/directMessage.service';
import AppError from '../../types/AppError';

export const createDMChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { targetUserId } = req.body;
    const userId = req.user?.id;
    
    if (!userId) throw new AppError('Authentication required', 401);
    if (!targetUserId) throw new AppError('Target user ID is required', 400);

    const channel = await directMessageService.createDMChannel(
      workspaceId,
      userId,
      targetUserId
    );
    res.status(201).json(channel);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}; 