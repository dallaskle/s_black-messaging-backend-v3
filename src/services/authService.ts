import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../types/database';
import AppError from '../types/AppError';
import { createUser } from './userServices';
import supabase from '../config/supabaseClient';

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
    // Validate input
    if (!validateName(name)) {
      throw new AppError('Invalid name. Must be between 2 and 50 characters.', 400);
    }
    if (!validateEmail(email)) {
      throw new AppError('Invalid email format.', 400);
    }
    if (!validatePassword(password)) {
      throw new AppError(
        'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.',
        400
      );
    }
  
    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });
  
      if (authError) throw new AppError(authError.message, 400);
      if (!authData.user) throw new AppError('Failed to create user', 500);
  
      // Create user profile in our users table
      const userData: Partial<User> = {
        id: authData.user.id,
        email,
        name
      };
  
      const newUser = await createUser(userData);
      return newUser;
  
    } catch (error) {
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
  