import { Request, Response } from 'express';
import * as workspaceService from '../services/workspaceServices';
import AppError from '../types/AppError';

export const createWorkspace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, workspace_url } = req.body;
    const userId = req.user?.id; // Assuming you have user info in request from auth middleware

    if (!userId) throw new AppError('Authentication required', 401);

    const workspace = await workspaceService.createWorkspace(
      name,
      userId,
      workspace_url
    );
    res.status(201).json(workspace);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const getUserWorkspaces = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Authentication required', 401);

    const workspaces = await workspaceService.getUserWorkspaces(userId);
    res.json(workspaces);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const getWorkspace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new AppError('Authentication required', 401);

    const workspace = await workspaceService.getWorkspaceById(workspaceId, userId);
    res.json(workspace);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const updateWorkspace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new AppError('Authentication required', 401);

    const workspace = await workspaceService.updateWorkspace(
      workspaceId,
      userId,
      req.body
    );
    res.json(workspace);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const deleteWorkspace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new AppError('Authentication required', 401);

    await workspaceService.deleteWorkspace(workspaceId, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const getWorkspaceMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new AppError('Authentication required', 401);

    const members = await workspaceService.getWorkspaceMembers(workspaceId, userId);
    res.json(members);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const addMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { userId, role } = req.body;
    const adminId = req.user?.id;
    if (!adminId) throw new AppError('Authentication required', 401);

    const member = await workspaceService.addWorkspaceMember(
      workspaceId,
      adminId,
      userId,
      role
    );
    res.status(201).json(member);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const updateMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, userId } = req.params;
    const adminId = req.user?.id;
    if (!adminId) throw new AppError('Authentication required', 401);

    const member = await workspaceService.updateWorkspaceMember(
      workspaceId,
      adminId,
      userId,
      req.body
    );
    res.json(member);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, userId } = req.params;
    const adminId = req.user?.id;
    if (!adminId) throw new AppError('Authentication required', 401);

    await workspaceService.removeWorkspaceMember(workspaceId, adminId, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}; 