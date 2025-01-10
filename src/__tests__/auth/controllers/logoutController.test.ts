import { logout } from '../../../auth/controllers/logoutController';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';

// Tests the logout controller's:
// 1. Successful logout - verifies refresh token cookie clearing
// 2. Error handling during cookie clearing operations
describe('logoutController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully logout user', async () => {
        const mockRequest = createMockRequest();
        const mockResponse = createMockResponse();

        await logout(mockRequest as any, mockResponse as any);

        expect(mockResponse.clearCookie).toHaveBeenCalledWith(
            'refreshToken',
            expect.objectContaining({
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                path: '/'
            })
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({ 
            message: 'Logged out successfully' 
        });
    });

    it('should handle errors during logout', async () => {
        const mockRequest = createMockRequest();
        const mockResponse = createMockResponse();

        // Simulate an error during cookie clearing
        (mockResponse.clearCookie as jest.Mock).mockImplementation(() => {
            throw new Error('Cookie error');
        });

        await logout(mockRequest as any, mockResponse as any);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ 
            message: 'An error occurred during logout' 
        });
    });
}); 