import { Request, Response } from 'express';
import * as reactionService from '../services/channelReactionService';
import AppError from '../../types/AppError';

export const getChannelReactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Authentication required', 401);

    const reactions = await reactionService.getChannelReactions(channelId, userId);
    res.json(reactions);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}; 