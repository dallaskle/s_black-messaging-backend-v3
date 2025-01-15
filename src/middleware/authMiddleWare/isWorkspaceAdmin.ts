import { Request, Response, NextFunction } from 'express';
import AppError from '../../types/AppError';
import supabase from '../../config/supabaseClient';

export const isWorkspaceAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const { workspaceId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { data: membership, error } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (error || !membership || membership.role !== 'admin') {
      throw new AppError('Admin access required', 403);
    }

    next();
  } catch (error) {
    console.error('[isWorkspaceAdmin] Error:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};
