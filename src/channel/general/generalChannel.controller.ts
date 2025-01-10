import { Request, Response } from 'express';
import * as generalChannelService from '../../channel/general/generalChannel.service';
import AppError from '../../types/AppError';

export const createChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new AppError('Authentication required', 401);

    const channel = await generalChannelService.createChannel(
      workspaceId,
      userId,
      req.body
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

export const getWorkspaceChannels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new AppError('Authentication required', 401);

    const channels = await generalChannelService.getWorkspaceChannels(workspaceId, userId);
    res.json(channels);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const getChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new AppError('Authentication required', 401);

    const channel = await generalChannelService.getChannelById(channelId, userId);
    res.json(channel);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const updateChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new AppError('Authentication required', 401);

    const channel = await generalChannelService.updateChannel(channelId, userId, req.body);
    res.json(channel);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const deleteChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new AppError('Authentication required', 401);

    await generalChannelService.deleteChannel(channelId, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}; 