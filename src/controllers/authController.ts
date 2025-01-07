import { Request, Response } from 'express';
import * as authService from '../services/authService';
import AppError from '../types/AppError';

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

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const sessionData = await authService.loginUser(email, password);
        res.status(200).json(sessionData);
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'An unknown error occurred' });
        }
    }
};

export const resendConfirmation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        
        if (!email) {
            res.status(400).json({ message: 'Email is required' });
            return;
        }

        await authService.resendConfirmationEmail(email);
        res.status(200).json({ message: 'Confirmation email has been resent' });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'An unknown error occurred' });
        }
    }
};