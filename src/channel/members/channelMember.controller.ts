import { Request, Response } from 'express';
import * as channelMemberService from '../../channel/members/channelMember.service';
import AppError from '../../types/AppError';

export const addChannelMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    const { memberId } = req.body;
    const userId = req.user?.id;
    
    if (!userId) throw new AppError('Authentication required', 401);
    if (!memberId) throw new AppError('Member ID is required', 400);

    const channelMember = await channelMemberService.addChannelMember(
      channelId,
      userId,
      memberId
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