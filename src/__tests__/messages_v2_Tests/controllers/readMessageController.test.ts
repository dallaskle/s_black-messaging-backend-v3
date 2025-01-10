import { Request, Response } from 'express';
import { getChannelMessages, getThreadMessages } from '../../../messages_v2/controllers/readMessageController';
import * as messageService from '../../../messages_v2/services/readMessageService';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import AppError from '../../../types/AppError';

// Mock the message service
jest.mock('../../../messages_v2/services/readMessageService');

describe('readMessageController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = createMockResponse();
  });

  describe('getChannelMessages', () => {
    it('should get channel messages successfully', async () => {
      // Arrange
      const mockMessages = [
        {
          id: 'msg-1',
          content: 'Test message 1',
          channel_id: 'channel-123',
          user_id: 'user-123',
          created_at: new Date().toISOString(),
          files: [],
          name: 'Test User',
          reactions: {},
          userReactions: []
        }
      ];

      mockReq = createMockRequest(
        {},
        { channelId: 'channel-123' },
        {}
      );
      mockReq.user = { id: 'user-123', email: 'test@example.com' };
      mockReq.query = { limit: '50' };

      (messageService.getChannelMessages as jest.Mock).mockResolvedValue(mockMessages);

      // Act
      await getChannelMessages(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(mockMessages);
      expect(messageService.getChannelMessages).toHaveBeenCalledWith(
        'channel-123',
        'user-123',
        50,
        undefined
      );
    });

    it('should handle pagination parameters', async () => {
      // Arrange
      mockReq = createMockRequest(
        {},
        { channelId: 'channel-123' },
        {}
      );
      mockReq.user = { id: 'user-123', email: 'test@example.com' };
      mockReq.query = { 
        limit: '20',
        before: '2024-01-01T00:00:00Z'
      };

      (messageService.getChannelMessages as jest.Mock).mockResolvedValue([]);

      // Act
      await getChannelMessages(mockReq as Request, mockRes as Response);

      // Assert
      expect(messageService.getChannelMessages).toHaveBeenCalledWith(
        'channel-123',
        'user-123',
        20,
        '2024-01-01T00:00:00Z'
      );
    });

    it('should fail without authentication', async () => {
      // Arrange
      mockReq = createMockRequest(
        {},
        { channelId: 'channel-123' },
        {}
      );

      // Act
      await getChannelMessages(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    });

    it('should handle access denied error', async () => {
      // Arrange
      mockReq = createMockRequest(
        {},
        { channelId: 'channel-123' },
        {}
      );
      mockReq.user = { id: 'user-123', email: 'test@example.com' };

      const error = new AppError('Access denied', 403);
      (messageService.getChannelMessages as jest.Mock).mockRejectedValue(error);

      // Act
      await getChannelMessages(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });
  });

  describe('getThreadMessages', () => {
    it('should get thread messages successfully', async () => {
      // Arrange
      const mockMessages = [
        {
          id: 'msg-2',
          content: 'Thread reply',
          channel_id: 'channel-123',
          user_id: 'user-123',
          parent_message_id: 'msg-1',
          created_at: new Date().toISOString(),
          name: 'Test User',
          reactions: {},
          userReactions: []
        }
      ];

      mockReq = createMockRequest(
        {},
        { messageId: 'msg-1' },
        {}
      );
      mockReq.user = { id: 'user-123', email: 'test@example.com' };
      mockReq.query = { limit: '50' };

      (messageService.getThreadMessages as jest.Mock).mockResolvedValue(mockMessages);

      // Act
      await getThreadMessages(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(mockMessages);
      expect(messageService.getThreadMessages).toHaveBeenCalledWith(
        'msg-1',
        'user-123',
        50,
        undefined
      );
    });

    it('should handle thread pagination', async () => {
      // Arrange
      mockReq = createMockRequest(
        {},
        { messageId: 'msg-1' },
        {}
      );
      mockReq.user = { id: 'user-123', email: 'test@example.com' };
      mockReq.query = {
        limit: '20',
        before: '2024-01-01T00:00:00Z'
      };

      (messageService.getThreadMessages as jest.Mock).mockResolvedValue([]);

      // Act
      await getThreadMessages(mockReq as Request, mockRes as Response);

      // Assert
      expect(messageService.getThreadMessages).toHaveBeenCalledWith(
        'msg-1',
        'user-123',
        20,
        '2024-01-01T00:00:00Z'
      );
    });

    it('should handle non-existent parent message', async () => {
      // Arrange
      mockReq = createMockRequest(
        {},
        { messageId: 'msg-1' },
        {}
      );
      mockReq.user = { id: 'user-123', email: 'test@example.com' };

      const error = new AppError('Message not found', 404);
      (messageService.getThreadMessages as jest.Mock).mockRejectedValue(error);

      // Act
      await getThreadMessages(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Message not found' });
    });

    it('should handle unknown errors', async () => {
      // Arrange
      mockReq = createMockRequest(
        {},
        { messageId: 'msg-1' },
        {}
      );
      mockReq.user = { id: 'user-123', email: 'test@example.com' };

      (messageService.getThreadMessages as jest.Mock).mockRejectedValue(new Error('Unknown error'));

      // Act
      await getThreadMessages(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'An unknown error occurred' });
    });
  });
}); 