import { registerUser } from '../../../auth/services/registerService';
import supabase from '../../../config/supabaseClient';
import AppError from '../../../types/AppError';

jest.mock('../../../config/supabaseClient');

// Tests the register service's:
// 1. Input validation (name, email, password requirements)
// 2. Successful user creation in Supabase
// 3. Error handling for auth failures
// 4. Error handling for database operations
describe('registerService', () => {
    const validUserData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123!@#'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('input validation', () => {
        it('should throw error for invalid name', async () => {
            await expect(registerUser('a', validUserData.email, validUserData.password))
                .rejects
                .toThrow(new AppError('Invalid name. Must be between 2 and 50 characters.', 400));
        });

        it('should throw error for invalid email', async () => {
            await expect(registerUser(validUserData.name, 'invalid-email', validUserData.password))
                .rejects
                .toThrow(new AppError('Invalid email format.', 400));
        });

        it('should throw error for weak password', async () => {
            await expect(registerUser(validUserData.name, validUserData.email, 'weak'))
                .rejects
                .toThrow(new AppError('Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.', 400));
        });
    });

    describe('user registration', () => {
        it('should successfully register a new user', async () => {
            const mockUser = {
                id: 'test-id',
                email: validUserData.email,
            };

            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
                error: null
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
                    })
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null })
                })
            });

            const result = await registerUser(
                validUserData.name,
                validUserData.email,
                validUserData.password
            );

            expect(result).toEqual(expect.objectContaining({
                id: mockUser.id,
                email: mockUser.email,
                name: validUserData.name
            }));
        });

        it('should handle Supabase auth error', async () => {
            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: { user: null },
                error: { message: 'Auth error' }
            });

            await expect(registerUser(
                validUserData.name,
                validUserData.email,
                validUserData.password
            )).rejects.toThrow(new AppError('Auth error', 400));
        });

        it('should handle database error', async () => {
            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: { user: { id: 'test-id', email: validUserData.email } },
                error: null
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ 
                            data: null, 
                            error: { message: 'Database error', code: 'OTHER' } 
                        })
                    })
                })
            });

            await expect(registerUser(
                validUserData.name,
                validUserData.email,
                validUserData.password
            )).rejects.toThrow(new AppError('Failed to fetch user data from the database', 500));
        });
    });
}); 