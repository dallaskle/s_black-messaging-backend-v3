import { login } from '../../../auth/controllers/loginController';
import * as authService from '../../../auth/services/loginService';
import { createMockRequest, createMockResponse } from '../testUtils';
import AppError from '../../../types/AppError';

jest.mock('../../../auth/services/loginService');

describe('loginController', () => {
    const validCredentials = {
        email: 'test@example.com',
        password: 'Test123!@#'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully login a user', async () => {
        const mockRequest = createMockRequest({ ...validCredentials });
        const mockResponse = createMockResponse();

        const mockSessionData = {
            user: {
                id: 'test-id',
                email: validCredentials.email,
                name: 'Test User'
            },
            session: {
                access_token: 'mock-access-token',
                refresh_token: 'mock-refresh-token',
                expires_at: Date.now() + 3600000
            }
        };

        (authService.loginUser as jest.Mock).mockResolvedValue(mockSessionData);

        await login(mockRequest as any, mockResponse as any);

        expect(mockResponse.cookie).toHaveBeenCalledWith(
            'refreshToken',
            mockSessionData.session.refresh_token,
            expect.objectContaining({
                httpOnly: true,
                secure: false, // because NODE_ENV is not 'production' in tests
                sameSite: 'strict',
                path: '/'
            })
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
            user: mockSessionData.user,
            session: {
                access_token: mockSessionData.session.access_token
            }
        });
    });

    it('should handle authentication errors', async () => {
        const mockRequest = createMockRequest({ ...validCredentials });
        const mockResponse = createMockResponse();

        const error = new AppError('Invalid credentials', 401);
        (authService.loginUser as jest.Mock).mockRejectedValue(error);

        await login(mockRequest as any, mockResponse as any);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should handle unknown errors', async () => {
        const mockRequest = createMockRequest({ ...validCredentials });
        const mockResponse = createMockResponse();

        const error = new Error('Unknown error');
        (authService.loginUser as jest.Mock).mockRejectedValue(error);

        await login(mockRequest as any, mockResponse as any);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'An unknown error occurred' });
    });
}); 