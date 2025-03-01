import bcrypt from 'bcryptjs';
import { User } from '../../types/database';
import AppError from '../../types/AppError';
import supabase, { serviceClient } from '../../config/supabaseClient';

// Helper functions for validation
const validateName = (name: string): boolean => {
    console.log(name);
    return name.trim().length >= 2 && name.trim().length <= 50;
};

const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
    // Require at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return passwordRegex.test(password);
};

export const registerUser = async (name: string, email: string, password: string, autoVerify: boolean = true): Promise<{ user: User; session?: { access_token: string } }> => {
    console.log('A. Starting validation');
    
    // Validate input
    if (!validateName(name)) {
        console.log('B. Name validation failed');
        throw new AppError('Invalid name. Must be between 2 and 50 characters.', 400);
    }
    if (!validateEmail(email)) {
        console.log('C. Email validation failed');
        throw new AppError('Invalid email format.', 400);
    }
    if (!validatePassword(password)) {
        console.log('D. Password validation failed');
        throw new AppError(
            'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.',
            400
        );
    }
    
    console.log('E. Validation passed, proceeding with registration');
    try {
        // Register user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name
                },
                emailRedirectTo: `${process.env.FRONTEND_URL}/email-verification`
            }
        });

        console.log('F. Supabase Auth response:', authData, authError);
    
        if (authError) throw new AppError(authError.message, 400);
        if (!authData.user) throw new AppError('Failed to create user', 500);
    
        const userData: User = {
            id: authData.user.id,
            email: authData.user.email as string,
            name: name,
            created_at: new Date().toISOString(),
            clone_id: null
        };

        // Save user data to the users table using service client
        const { data: existingUser, error: userFetchError } = await serviceClient
            .from('users')
            .select('*')
            .eq('id', userData.id)
            .single();

        if (userFetchError && userFetchError.code !== 'PGRST116') {
            throw new AppError('Failed to fetch user data from the database', 500);
        }

        if (existingUser) {
            const { error: userError } = await serviceClient
                .from('users')
                .update(userData)
                .eq('id', userData.id);
        
            if (userError) {
                throw new AppError('Failed to save user data to the database', 500);
            }
        } else {
            // Insert new user if they don't exist
            const { error: insertError } = await serviceClient
                .from('users')
                .insert(userData);
            
            if (insertError) {
                throw new AppError('Failed to save user data to the database', 500);
            }
        }

        // If auto-verify is enabled, create a session
        if (autoVerify) {
            console.log('Attempting to auto-verify user:', userData.id);
            
            // Update user to be email confirmed using service client
            const { error: updateError } = await serviceClient.auth.admin.updateUserById(
                userData.id,
                { email_confirm: true }
            );

            if (updateError) {
                console.error('Auto-verify error:', updateError);
                throw new AppError('Failed to auto-verify user', 500);
            }

            console.log('User verified, creating session');

            // Sign in the user to get a session
            const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (sessionError) {
                console.error('Session creation error:', sessionError);
                throw new AppError('Failed to create session', 500);
            }

            console.log('Session created successfully');

            return {
                user: userData,
                session: {
                    access_token: sessionData.session?.access_token || ''
                }
            };
        }

        return { user: userData };
    
    } catch (error) {
        console.log('G. Error caught in service:', error);
        if (error instanceof AppError) throw error;
        throw new AppError('Error creating user', 500);
    }
}; 