import { Request, Response } from 'express';
import * as authService from '../services/loginService';
import AppError from '../../types/AppError';

const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const sessionData = await authService.loginUser(email, password);

        // Set refresh token in HttpOnly cookie
        res.cookie('refreshToken', sessionData.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_EXPIRY,
            path: '/'
        });

        // Only send access token and user data in response
        res.status(200).json({
            user: sessionData.user,
            session: {
                access_token: sessionData.session.access_token
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'An unknown error occurred' });
        }
    }
}; 