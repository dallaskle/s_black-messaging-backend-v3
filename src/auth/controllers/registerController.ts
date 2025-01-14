import { Request, Response } from 'express';
import * as authService from '../services/registerService';
import AppError from '../../types/AppError';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, autoVerify = true } = req.body;
        const result = await authService.registerUser(name, email, password, autoVerify);
        res.status(201).json(result);
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'An unknown error occurred' });
        }
    }
}; 