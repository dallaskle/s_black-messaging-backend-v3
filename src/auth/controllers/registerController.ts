import { Request, Response } from 'express';
import * as authService from '../services/registerService';
import AppError from '../../types/AppError';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('1. Controller received request with body:', req.body);
        const { name, email, password } = req.body;
        console.log('2. Attempting to register user with:', { name, email });
        const newUser = await authService.registerUser(name, email, password);
        console.log('3. Registration successful:', newUser);
        res.status(201).json(newUser);
    } catch (error) {
        console.log('4. Error caught in controller:', error);
        if (error instanceof AppError) {
            console.log('5. AppError detected, sending status:', error.statusCode);
            res.status(error.statusCode).json({ message: error.message });
        } else {
            console.log('6. Unknown error, sending 500');
            res.status(500).json({ message: 'An unknown error occurred' });
        }
    }
}; 