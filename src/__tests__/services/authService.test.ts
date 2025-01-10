import { registerUser } from '../../auth/authService';
import { createUser } from '../../services/userServices';
import supabase from '../../config/supabaseClient';
import AppError from '../../types/AppError';

// Mock dependencies
jest.mock('../../config/supabaseClient');
jest.mock('../../services/userServices');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    const validName = 'Test User';
    const validEmail = 'test@example.com';
    const validPassword = 'Test123!@#';

    it('should successfully register a new user', async () => {
      // Mock successful Supabase auth signup
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: {
          user: { id: 'test-id' }
        },
        error: null
      });

      // Mock successful user creation
      (createUser as jest.Mock).mockResolvedValue({
        id: 'test-id',
        name: validName,
        email: validEmail,
        created_at: new Date().toISOString()
      });

      const result = await registerUser(validName, validEmail, validPassword);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(result.name).toBe(validName);
      expect(result.email).toBe(validEmail);
    });

    it('should throw AppError for invalid name', async () => {
      await expect(registerUser('a', validEmail, validPassword))
        .rejects
        .toThrow(new AppError('Invalid name. Must be between 2 and 50 characters.', 400));
    });

    it('should throw AppError for invalid email', async () => {
      await expect(registerUser(validName, 'invalid-email', validPassword))
        .rejects
        .toThrow(new AppError('Invalid email format.', 400));
    });

    it('should throw AppError for invalid password', async () => {
      await expect(registerUser(validName, validEmail, 'weak'))
        .rejects
        .toThrow(new AppError('Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.', 400));
    });
  });
}); 