import { refreshToken } from '../../../auth/controllers/refreshTokenController';
import * as authService from '../../../auth/services/tokenService';
import { createMockRequest, createMockResponse } from '../testUtils';
import AppError from '../../../types/AppError';

jest.mock('../../../auth/services/tokenService');

describe('refreshTokenController', () => {
    const validRefreshToken = 'valid-refresh-token';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully refresh tokens', async () => {
        const mockRequest = createMockRequest({}, {}, { refreshToken: validRefreshToken });
        const mockResponse = createMockResponse();

        const mockTokenData = {
            user: {
                id: 'test-id',
                email: 'test@example.com'
            },
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token'
        };

        (authService.refreshToken as jest.Mock).mockResolvedValue(mockTokenData);

        await refreshToken(mockRequest as any, mockResponse as any);

        expect(mockResponse.cookie).toHaveBeenCalledWith(
            'refreshToken',
            mockTokenData.refreshToken,
            expect.objectContaining({
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                path: '/'
            })
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
            user: mockTokenData.user,
            accessToken: mockTokenData.accessToken
        });
    });

    it('should handle missing refresh token', async () => {
        const mockRequest = createMockRequest({}, {}, {});
        const mockResponse = createMockResponse();

        await refreshToken(mockRequest as any, mockResponse as any);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ 
            message: 'No refresh token provided' 
        });
    });

    it('should handle invalid refresh token', async () => {
        const mockRequest = createMockRequest({}, {}, { refreshToken: 'invalid-token' });
        const mockResponse = createMockResponse();

        const error = new AppError('Invalid refresh token', 401);
        (authService.refreshToken as jest.Mock).mockRejectedValue(error);

        await refreshToken(mockRequest as any, mockResponse as any);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ 
            message: 'Invalid refresh token' 
        });
    });

    it('should handle unknown errors', async () => {
        const mockRequest = createMockRequest({}, {}, { refreshToken: validRefreshToken });
        const mockResponse = createMockResponse();

        const error = new Error('Unknown error');
        (authService.refreshToken as jest.Mock).mockRejectedValue(error);

        await refreshToken(mockRequest as any, mockResponse as any);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ 
            message: 'An unknown error occurred' 
        });
    });
}); 