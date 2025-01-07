import { getUserById, createUser } from '../../services/userServices';
import supabase from '../../config/supabaseClient';

jest.mock('../../config/supabaseClient');

describe('userServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user data when found', async () => {
      const mockUser = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
          })
        })
      });

      const result = await getUserById('test-id');
      expect(result).toEqual(mockUser);
    });

    it('should throw error when user not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'User not found' }
            })
          })
        })
      });

      await expect(getUserById('non-existent-id')).rejects.toThrow('User not found');
    });
  });

  describe('createUser', () => {
    it('should create and return new user', async () => {
      const newUser = {
        name: 'New User',
        email: 'new@example.com'
      };

      const mockCreatedUser = {
        id: 'new-id',
        ...newUser,
        created_at: new Date().toISOString()
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockCreatedUser, error: null })
        })
      });

      const result = await createUser(newUser);
      expect(result).toEqual(mockCreatedUser);
    });

    it('should throw error when creation fails', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Creation failed' }
          })
        })
      });

      await expect(createUser({})).rejects.toThrow('Creation failed');
    });
  });
}); 