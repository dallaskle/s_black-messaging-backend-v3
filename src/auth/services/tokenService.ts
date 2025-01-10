import jwt from 'jsonwebtoken';
import AppError from '../../types/AppError';
import supabase from '../../config/supabaseClient';

// Create a JWT token for a user
export const createToken = (userId: string) => {
    const payload = {
        user: {
            id: userId
        }
    };

    return jwt.sign(
        payload,
        process.env.JWT_SECRET as string
    );
};

export const refreshToken = async (token: string) => {
    try {
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: token
        });

        if (error) throw new AppError('Invalid refresh token', 401);
        if (!data.session) throw new AppError('Session not found', 404);

        // Get user profile from our users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user?.id)
            .single();

        if (userError || !userData) {
            throw new AppError('User profile not found', 404);
        }

        return {
            user: userData,
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token
        };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Invalid refresh token', 401);
    }
}; 