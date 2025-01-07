import { Request, Response } from 'express';
import * as reactionService from '../services/reactionServices'
import AppError from '../types/AppError';

export const addReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId, messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Authentication required', 401);
    if (!emoji) throw new AppError('Emoji is required', 400);

    const reaction = await reactionService.addReaction(channelId, messageId, userId, emoji);
    res.status(201).json(reaction);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const removeReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId, messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Authentication required', 401);
    if (!emoji) throw new AppError('Emoji is required', 400);

    await reactionService.removeReaction(channelId, messageId, userId, emoji);
    res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const getMessageReactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId, messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Authentication required', 401);

    const reactions = await reactionService.getMessageReactions(channelId, messageId, userId);
    res.json(reactions);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const getReactionCounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId, messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Authentication required', 401);

    const counts = await reactionService.getReactionCounts(channelId, messageId, userId);
    res.json(counts);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

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

export const getPopularWorkspaceReactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Authentication required', 401);

    const reactions = await reactionService.getPopularWorkspaceReactions(workspaceId, userId);
    res.json(reactions);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}; 