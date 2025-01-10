import AppError from '../../types/AppError';
import supabase from '../../config/supabaseClient';

export const loginUser = async (email: string, password: string) => {
    try {
        console.log('A. Attempting Supabase auth login');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error('B. Supabase auth error:', authError);
            throw new AppError(authError.message, 401);
        }

        if (!authData.user || !authData.session) {
            console.error('C. No user data or session returned from Supabase');
            throw new AppError('Authentication failed', 401);
        }

        console.log('D. Auth successful, fetching user profile');
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (userError || !userData) {
            console.error('E. User profile error:', userError);
            throw new AppError('User profile not found', 404);
        }

        console.log('F. Login successful, returning session data');
        return {
            user: userData,
            session: {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
                expires_at: authData.session.expires_at
            }
        };

    } catch (error) {
        console.error('G. Login service error:', error);
        if (error instanceof AppError) throw error;
        throw new AppError('Error during login', 500);
    }
}; 