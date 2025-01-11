import { RequestHandler } from 'express';
import * as directMessageService from './directMessage.service';
import AppError from '../../types/AppError';

interface DMParams {
  workspaceId: string;
}

interface DMBody {
  targetUserId: string;
}

interface GroupDMBody {
  targetUserIds: string[];
}

export const createDM: RequestHandler<DMParams, any, DMBody> = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { targetUserId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!targetUserId) {
      res.status(400).json({ message: 'Target user ID is required' });
      return;
    }

    const channel = await directMessageService.createDM(workspaceId, userId, targetUserId);
    res.status(201).json(channel);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Failed to create DM:', error);
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
  }
};

export const createGroupDM: RequestHandler<DMParams, any, GroupDMBody> = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { targetUserIds } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
      res.status(400).json({ message: 'At least one target user is required' });
      return;
    }

    const channel = await directMessageService.createGroupDM(workspaceId, userId, targetUserIds);
    res.status(201).json(channel);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Failed to create group DM:', error);
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
  }
}; 