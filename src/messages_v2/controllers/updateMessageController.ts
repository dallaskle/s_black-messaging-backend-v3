import { Request, Response } from 'express';
import * as messageService from '../services/updateMessageService';
import AppError from '../../types/AppError';

export const updateMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Authentication required', 401);
    if (!content) throw new AppError('Message content is required', 400);

    const message = await messageService.updateMessage(messageId, userId, content);
    res.json(message);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}; 