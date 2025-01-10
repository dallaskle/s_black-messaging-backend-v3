import { Request, Response } from 'express';
import * as messageService from '../services/deleteMessageService';
import AppError from '../../types/AppError';

export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Authentication required', 401);

    await messageService.deleteMessage(messageId, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}; 