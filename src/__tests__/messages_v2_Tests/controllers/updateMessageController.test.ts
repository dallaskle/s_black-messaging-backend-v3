import { Request, Response } from 'express';
import { updateMessage } from '../../../messages_v2/controllers/updateMessageController';
import * as messageService from '../../../messages_v2/services/updateMessageService';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import AppError from '../../../types/AppError';

// Mock the message service
jest.mock('../../../messages_v2/services/updateMessageService');

describe('updateMessageController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = createMockResponse();
  });

  it('should update message successfully', async () => {
    // Arrange
    const mockMessage = {
      id: 'msg-123',
      content: 'Updated content',
      channel_id: 'channel-123',
      user_id: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      name: 'Test User',
      reactions: {},
      userReactions: []
    };

    mockReq = createMockRequest(
      { content: 'Updated content' },
      { messageId: 'msg-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    (messageService.updateMessage as jest.Mock).mockResolvedValue(mockMessage);

    // Act
    await updateMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.json).toHaveBeenCalledWith(mockMessage);
    expect(messageService.updateMessage).toHaveBeenCalledWith(
      'msg-123',
      'user-123',
      'Updated content'
    );
  });

  it('should fail without authentication', async () => {
    // Arrange
    mockReq = createMockRequest(
      { content: 'Updated content' },
      { messageId: 'msg-123' },
      {}
    );

    // Act
    await updateMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(messageService.updateMessage).not.toHaveBeenCalled();
  });

  it('should fail without content', async () => {
    // Arrange
    mockReq = createMockRequest(
      { content: '' },
      { messageId: 'msg-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    // Act
    await updateMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Message content is required' });
    expect(messageService.updateMessage).not.toHaveBeenCalled();
  });

  it('should handle non-existent message error', async () => {
    // Arrange
    mockReq = createMockRequest(
      { content: 'Updated content' },
      { messageId: 'msg-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    const error = new AppError('Message not found', 404);
    (messageService.updateMessage as jest.Mock).mockRejectedValue(error);

    // Act
    await updateMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Message not found' });
  });

  it('should handle unauthorized update error', async () => {
    // Arrange
    mockReq = createMockRequest(
      { content: 'Updated content' },
      { messageId: 'msg-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    const error = new AppError('Access denied', 403);
    (messageService.updateMessage as jest.Mock).mockRejectedValue(error);

    // Act
    await updateMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access denied' });
  });

  it('should handle unknown errors', async () => {
    // Arrange
    mockReq = createMockRequest(
      { content: 'Updated content' },
      { messageId: 'msg-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    (messageService.updateMessage as jest.Mock).mockRejectedValue(new Error('Unknown error'));

    // Act
    await updateMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'An unknown error occurred' });
  });
}); 