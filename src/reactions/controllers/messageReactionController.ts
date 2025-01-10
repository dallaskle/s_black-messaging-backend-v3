import { Request, Response } from 'express';
import * as reactionService from '../services/messageReactionService';
import AppError from '../../types/AppError';
import supabase from '../../config/supabaseClient';

export const addReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId, messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Authentication required', 401);
    if (!emoji) throw new AppError('Emoji is required', 400);
    
    // Validate message exists
    const { data: message } = await supabase
      .from('messages')
      .select('id')
      .eq('id', messageId)
      .eq('channel_id', channelId)
      .single();

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    const reaction = await reactionService.addReaction(channelId, messageId, userId, emoji);
    res.status(201).json(reaction);
  } catch (error) {
    console.error('Error in addReaction:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ 
        message: 'An unknown error occurred', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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