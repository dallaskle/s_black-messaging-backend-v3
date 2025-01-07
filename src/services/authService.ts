import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../types/database';
import AppError from '../types/AppError';
import { createUser } from './userServices';
import supabase from '../config/supabaseClient';

//email confirmation link example: url/#access_token=eyJhbGciOiJIUzI1NiIsImtpZCI6IkVZYnZ6cTBXVUpDSmhDWkMiLCJ0eXAiOiJKV1QifQ
export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
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
        password
      });

      console.log('F. Supabase Auth response:', authData, authError);
  
      if (authError) throw new AppError(authError.message, 400);
      if (!authData.user) throw new AppError('Failed to create user', 500);
  
      
      const userData: User = {
          id: authData.user.id,
          email: authData.user.email as string,
          name: name,
          created_at: new Date().toISOString(), // Assuming created_at is a string in ISO format
      };

      // Save user data to the users table
      const { error: userError } = await supabase
          .from('users')
          .insert([userData]);

      if (userError) {
          throw new AppError('Failed to save user data to the database', 500);
      }

      return userData;
  
    } catch (error) {
      console.log('G. Error caught in service:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error creating user', 500);
    }
  };
  
  export const loginUser = async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
  
      if (authError) {
        throw new AppError('Invalid credentials', 401);
      }
  
      if (!authData.user) {
        throw new AppError('User not found', 404);
      }
  
      // Get user profile from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
  
      if (userError || !userData) {
        throw new AppError('User profile not found', 404);
      }
  
      return {
        user: userData,
        session: authData.session
      };
  
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error during login', 500);
    }
  };

  // Resend confirmation email -- Needs to wait 60 seconds before resending
  export const resendConfirmationEmail = async (email: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: 'fake_password_to_resend',
    });
  
    if (error) {
      if (error.status === 400 && error.message === 'User already registered') {
        console.log('Confirmation email resent. Please check your inbox.');
      } else {
        console.error('Error resending confirmation email:', error.message);
      }
    } else {
      console.log('Confirmation email resent successfully.');
    }
  };
  

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

// Create a JWT token for a user
  const createToken = (userId: string) => {
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
          accessToken: data.session.access_token
      };
  } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid refresh token', 401);
  }
};
  