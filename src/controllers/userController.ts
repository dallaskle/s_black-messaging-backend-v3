import { Request, Response } from 'express';
import { getUserById, createUser } from '../services/userServices';
import AppError from '../types/AppError';

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const addUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const newUser = await createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};
