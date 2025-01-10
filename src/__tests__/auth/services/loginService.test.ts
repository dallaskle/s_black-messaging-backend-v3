import { loginUser } from '../../../auth/services/loginService';
import supabase from '../../../config/supabaseClient';
import AppError from '../../../types/AppError';

jest.mock('../../../config/supabaseClient');

describe('loginService', () => {
    const validCredentials = {
        email: 'test@example.com',
        password: 'Test123!@#'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully login a user', async () => {
        const mockSession = {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Date.now() + 3600000
        };

        const mockUser = {
            id: 'test-id',
            email: validCredentials.email,
            name: 'Test User'
        };

        (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
            data: {
                user: mockUser,
                session: mockSession
            },
            error: null
        });

        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
                })
            })
        });

        const result = await loginUser(validCredentials.email, validCredentials.password);

        expect(result).toEqual({
            user: mockUser,
            session: {
                access_token: mockSession.access_token,
                refresh_token: mockSession.refresh_token,
                expires_at: mockSession.expires_at
            }
        });
    });

    it('should handle invalid credentials', async () => {
        (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Invalid credentials' }
        });

        await expect(loginUser(validCredentials.email, 'wrong-password'))
            .rejects
            .toThrow(new AppError('Invalid credentials', 401));
    });

    it('should handle missing user profile', async () => {
        (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
            data: {
                user: { id: 'test-id' },
                session: { access_token: 'token' }
            },
            error: null
        });

        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                })
            })
        });

        await expect(loginUser(validCredentials.email, validCredentials.password))
            .rejects
            .toThrow(new AppError('User profile not found', 404));
    });
}); 