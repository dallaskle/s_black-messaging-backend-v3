import { Request, Response } from 'express';
import * as messageService from '../services/readMessageService';
import AppError from '../../types/AppError';

export const getChannelMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    const { limit, before } = req.query;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Authentication required', 401);

    const messages = await messageService.getChannelMessages(
      channelId,
      userId,
      limit ? parseInt(limit as string) : undefined,
      before as string | undefined
    );

    console.log('Sending messages to frontend:', messages.map(m => ({
      id: m.id,
      filesCount: m.files?.length
    })));

    res.json(messages);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const getThreadMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { limit, before } = req.query;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Authentication required', 401);

    const messages = await messageService.getThreadMessages(
      messageId,
      userId,
      limit ? parseInt(limit as string) : undefined,
      before as string | undefined
    );

    const transformedMessages = messages.map(message => {
      const files = message.files?.map((fileRelation: any) => fileRelation.file) || [];
      return {
        ...message,
        files
      };
    });

    res.json(transformedMessages);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}; 