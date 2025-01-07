import { Request, Response } from 'express';
import { getUser, addUser } from '../../controllers/userController';
import * as userServices from '../../services/userServices';
import AppError from '../../types/AppError';

jest.mock('../../services/userServices');

describe('userController', () => {
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

  describe('getUser', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com'
      };

      mockRequest = {
        params: { id: 'test-id' }
      };

      (userServices.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await getUser(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(mockUser);
    });

    it('should handle AppError appropriately', async () => {
      mockRequest = {
        params: { id: 'invalid-id' }
      };

      const error = new AppError('User not found', 404);
      (userServices.getUserById as jest.Mock).mockRejectedValue(error);

      await getUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('addUser', () => {
    it('should create and return new user', async () => {
      const newUser = {
        name: 'New User',
        email: 'new@example.com'
      };

      mockRequest = {
        body: newUser
      };

      (userServices.createUser as jest.Mock).mockResolvedValue({
        id: 'new-id',
        ...newUser
      });

      await addUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining(newUser));
    });

    it('should handle errors appropriately', async () => {
      mockRequest = {
        body: {}
      };

      (userServices.createUser as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      await addUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: 'An unknown error occurred' });
    });
  });
}); 