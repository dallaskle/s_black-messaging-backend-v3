import { Request, Response } from 'express';
import * as messageService from '../services/messageServices';
import AppError from '../types/AppError';

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