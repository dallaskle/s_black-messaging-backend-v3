import { Request, Response } from 'express';
import { deleteMessage } from '../../../messages_v2/controllers/deleteMessageController';
import * as messageService from '../../../messages_v2/services/deleteMessageService';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import AppError from '../../../types/AppError';

// Mock the message service
jest.mock('../../../messages_v2/services/deleteMessageService');

describe('deleteMessageController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = createMockResponse();
  });

  it('should delete message successfully', async () => {
    // Arrange
    mockReq = createMockRequest(
      {},
      { messageId: 'msg-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    (messageService.deleteMessage as jest.Mock).mockResolvedValue(undefined);

    // Act
    await deleteMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.send).toHaveBeenCalled();
    expect(messageService.deleteMessage).toHaveBeenCalledWith('msg-123', 'user-123');
  });

  it('should fail without authentication', async () => {
    // Arrange
    mockReq = createMockRequest(
      {},
      { messageId: 'msg-123' },
      {}
    );

    // Act
    await deleteMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(messageService.deleteMessage).not.toHaveBeenCalled();
  });

  it('should handle non-existent message error', async () => {
    // Arrange
    mockReq = createMockRequest(
      {},
      { messageId: 'msg-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    const error = new AppError('Message not found', 404);
    (messageService.deleteMessage as jest.Mock).mockRejectedValue(error);

    // Act
    await deleteMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Message not found' });
  });

  it('should handle unauthorized deletion error', async () => {
    // Arrange
    mockReq = createMockRequest(
      {},
      { messageId: 'msg-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    const error = new AppError('Access denied', 403);
    (messageService.deleteMessage as jest.Mock).mockRejectedValue(error);

    // Act
    await deleteMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access denied' });
  });

  it('should handle unknown errors', async () => {
    // Arrange
    mockReq = createMockRequest(
      {},
      { messageId: 'msg-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    (messageService.deleteMessage as jest.Mock).mockRejectedValue(new Error('Unknown error'));

    // Act
    await deleteMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'An unknown error occurred' });
  });
}); 