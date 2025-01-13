import { Request, Response } from 'express';

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        // Clear the refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/'
        });
        
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred during logout' });
    }
}; 