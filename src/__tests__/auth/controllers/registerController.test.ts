import { register } from '../../../auth/controllers/registerController';
import * as authService from '../../../auth/services/registerService';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import AppError from '../../../types/AppError';

jest.mock('../../../auth/services/registerService');

// Tests the register controller's:
// 1. Successful user registration with valid data
// 2. Validation error handling (400) for invalid input
// 3. Unknown error handling (500) during registration process
describe('registerController', () => {
    const validUserData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123!@#'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Spy on console methods
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should successfully register a new user', async () => {
        const mockRequest = createMockRequest({ ...validUserData });
        const mockResponse = createMockResponse();

        const mockRegisteredUser = {
            id: 'test-id',
            name: validUserData.name,
            email: validUserData.email,
            created_at: new Date().toISOString()
        };

        (authService.registerUser as jest.Mock).mockResolvedValue(mockRegisteredUser);

        await register(mockRequest as any, mockResponse as any);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(mockRegisteredUser);
        expect(console.log).toHaveBeenCalledWith('3. Registration successful:', mockRegisteredUser);
    });

    it('should handle validation errors', async () => {
        const mockRequest = createMockRequest({ ...validUserData, name: 'a' });
        const mockResponse = createMockResponse();

        const error = new AppError('Invalid name', 400);
        (authService.registerUser as jest.Mock).mockRejectedValue(error);

        await register(mockRequest as any, mockResponse as any);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid name' });
        expect(console.log).toHaveBeenCalledWith('4. Error caught in controller:', error);
    });

    it('should handle unknown errors', async () => {
        const mockRequest = createMockRequest({ ...validUserData });
        const mockResponse = createMockResponse();

        const error = new Error('Unknown error');
        (authService.registerUser as jest.Mock).mockRejectedValue(error);

        await register(mockRequest as any, mockResponse as any);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'An unknown error occurred' });
        expect(console.log).toHaveBeenCalledWith('6. Unknown error, sending 500');
    });
}); 