import { Request, Response } from 'express';
import * as channelService from '../services/channelServices'
import AppError from '../types/AppError';

export const createChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new AppError('Authentication required', 401);

    const channel = await channelService.createChannel(
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

    const channels = await channelService.getWorkspaceChannels(workspaceId, userId);
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

    const channel = await channelService.getChannelById(channelId, userId);
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

    const channel = await channelService.updateChannel(channelId, userId, req.body);
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

    await channelService.deleteChannel(channelId, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const addChannelMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    const { memberId } = req.body; // ID of the user to add
    const userId = req.user?.id;
    
    if (!userId) throw new AppError('Authentication required', 401);
    if (!memberId) throw new AppError('Member ID is required', 400);

    const channelMember = await channelService.addChannelMember(
      channelId,
      userId, // current user (must be admin)
      memberId // user to add
    );
    
    res.status(201).json(channelMember);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const createDMChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { targetUserId } = req.body; // ID of the user to DM with
    const userId = req.user?.id;
    
    if (!userId) throw new AppError('Authentication required', 401);
    if (!targetUserId) throw new AppError('Target user ID is required', 400);

    const channel = await channelService.createDMChannel(
      workspaceId,
      userId,
      targetUserId
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