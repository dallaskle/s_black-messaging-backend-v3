import { Request, Response } from 'express';
import * as authService from '../services/confirmationService';
import AppError from '../../types/AppError';

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