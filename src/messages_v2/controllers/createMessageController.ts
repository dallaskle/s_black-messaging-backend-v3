import { Request, Response } from 'express';
import * as messageService from '../services/createMessageService';
import AppError from '../../types/AppError';

interface CreateMessageBody {
  content: string;
  parentMessageId?: string;
}

export const createMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    const { content, parentMessageId } = req.body as CreateMessageBody;
    const userId = req.user?.id;
    const file = req.file;

    if (!userId) throw new AppError('Authentication required', 401);
    if (!content && !file) {
      throw new AppError('Message must contain content or file', 400);
    }

    const message = await messageService.createMessageWithFile(
      channelId,
      userId,
      content || '',
      file,
      parentMessageId
    );

    res.status(201).json(message);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}; 