import { Request, Response } from 'express';
import * as authService from '../services/authService';
import AppError from '../types/AppError';

const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

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

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            res.status(401).json({ message: 'No refresh token provided' });
            return;
        }

        const { user, accessToken, refreshToken: newRefreshToken } = 
            await authService.refreshToken(refreshToken);

        // Set new refresh token in cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_EXPIRY,
            path: '/'
        });

        res.status(200).json({ user, accessToken });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'An unknown error occurred' });
        }
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        // Clear the refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });
        
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred during logout' });
    }
};