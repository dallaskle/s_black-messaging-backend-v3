import { Request, Response } from 'express';
import { fileServices } from '../services/fileServices';
import AppError from '../types/AppError';

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId, messageId } = req.body;
    const userId = req.user?.id;
    const file = req.file;

    if (!userId) throw new AppError('Authentication required', 401);
    if (!channelId) throw new AppError('Channel ID is required', 400);
    if (!messageId) throw new AppError('Message ID is required', 400);
    if (!file) throw new AppError('File is required', 400);

    const fileData = await fileServices.uploadFile(channelId, userId, messageId, file);
    res.status(201).json(fileData);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const getFileUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const url = await fileServices.getFileUrl(fileId);
    res.json({ url });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Authentication required', 401);

    await fileServices.deleteFile(fileId, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}; 