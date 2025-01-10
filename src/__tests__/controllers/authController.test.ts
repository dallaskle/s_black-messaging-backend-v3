import { Request, Response } from 'express';
import { register, login } from '../../auth/authController';
import * as authService from '../../auth/authService';
import AppError from '../../types/AppError';

jest.mock('../../services/authService');

describe('authController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validUserData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test123!@#'
    };

    it('should successfully register a new user', async () => {
      mockRequest = {
        body: validUserData
      };

      const mockRegisteredUser = {
        id: 'test-id',
        name: validUserData.name,
        email: validUserData.email,
        created_at: new Date().toISOString()
      };

      (authService.registerUser as jest.Mock).mockResolvedValue(mockRegisteredUser);

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockRegisteredUser);
    });

    it('should handle validation errors', async () => {
      mockRequest = {
        body: { ...validUserData, name: 'a' }
      };

      const error = new AppError('Invalid name', 400);
      (authService.registerUser as jest.Mock).mockRejectedValue(error);

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid name' });
    });

    it('should handle unknown errors', async () => {
      mockRequest = {
        body: validUserData
      };

      (authService.registerUser as jest.Mock).mockRejectedValue(new Error('Unknown error'));

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: 'An unknown error occurred' });
    });
  });

  describe('login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'Test123!@#'
    };

    it('should successfully login a user', async () => {
      mockRequest = {
        body: validCredentials
      };

      const mockSessionData = {
        user: {
          id: 'test-id',
          email: validCredentials.email
        },
        session: {
          access_token: 'mock-token'
        }
      };

      (authService.loginUser as jest.Mock).mockResolvedValue(mockSessionData);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockSessionData);
    });

    it('should handle invalid credentials', async () => {
      mockRequest = {
        body: validCredentials
      };

      const error = new AppError('Invalid credentials', 401);
      (authService.loginUser as jest.Mock).mockRejectedValue(error);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should handle unknown errors', async () => {
      mockRequest = {
        body: validCredentials
      };

      (authService.loginUser as jest.Mock).mockRejectedValue(new Error('Unknown error'));

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: 'An unknown error occurred' });
    });
  });
}); 