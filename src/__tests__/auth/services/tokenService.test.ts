import { createToken, refreshToken } from '../../../auth/services/tokenService';
import supabase from '../../../config/supabaseClient';
import jwt from 'jsonwebtoken';
import AppError from '../../../types/AppError';

jest.mock('../../../config/supabaseClient');
jest.mock('jsonwebtoken');

// Tests the token service's:
// 1. JWT token creation with correct payload
// 2. Token refresh operations with Supabase
// 3. Invalid/expired token handling
// 4. Missing session and user profile scenarios
describe('tokenService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    describe('createToken', () => {
        it('should create a JWT token with correct payload', () => {
            const userId = 'test-user-id';
            const expectedPayload = {
                user: { id: userId }
            };

            createToken(userId);

            expect(jwt.sign).toHaveBeenCalledWith(
                expectedPayload,
                process.env.JWT_SECRET
            );
        });
    });

    describe('refreshToken', () => {
        const mockToken = 'valid-refresh-token';
        const mockUser = {
            id: 'test-id',
            email: 'test@example.com',
            name: 'Test User'
        };
        const mockSession = {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token'
        };

        it('should successfully refresh tokens', async () => {
            (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
                data: {
                    session: mockSession,
                    user: { id: mockUser.id }
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

            const result = await refreshToken(mockToken);

            expect(result).toEqual({
                user: mockUser,
                accessToken: mockSession.access_token,
                refreshToken: mockSession.refresh_token
            });
        });

        it('should handle invalid refresh token', async () => {
            (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
                data: { session: null },
                error: { message: 'Invalid refresh token' }
            });

            await expect(refreshToken(mockToken))
                .rejects
                .toThrow(new AppError('Invalid refresh token', 401));
        });

        it('should handle missing session', async () => {
            (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
                data: { session: null },
                error: null
            });

            await expect(refreshToken(mockToken))
                .rejects
                .toThrow(new AppError('Session not found', 404));
        });

        it('should handle missing user profile', async () => {
            (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
                data: {
                    session: mockSession,
                    user: { id: 'test-id' }
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

            await expect(refreshToken(mockToken))
                .rejects
                .toThrow(new AppError('User profile not found', 404));
        });
    });
}); 