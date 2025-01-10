import { Request, Response } from 'express';
import { createMessage } from '../../../messages_v2/controllers/createMessageController';
import * as messageService from '../../../messages_v2/services/createMessageService';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import AppError from '../../../types/AppError';

// Mock the message service
jest.mock('../../../messages_v2/services/createMessageService');

describe('createMessageController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = createMockResponse();
  });

  it('should create a message with valid content', async () => {
    // Arrange
    const mockMessage = {
      id: 'msg-123',
      content: 'Test message',
      channel_id: 'channel-123',
      user_id: 'user-123',
      created_at: new Date().toISOString(),
    };

    mockReq = createMockRequest(
      { content: 'Test message' },
      { channelId: 'channel-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    (messageService.createMessageWithFile as jest.Mock).mockResolvedValue(mockMessage);

    // Act
    await createMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockMessage);
    expect(messageService.createMessageWithFile).toHaveBeenCalledWith(
      'channel-123',
      'user-123',
      'Test message',
      undefined,
      undefined
    );
  });

  it('should create a message with file attachment', async () => {
    // Arrange
    const mockFile = {
      filename: 'test.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
    } as Express.Multer.File;

    const mockMessage = {
      id: 'msg-123',
      content: '',
      channel_id: 'channel-123',
      user_id: 'user-123',
      created_at: new Date().toISOString(),
      files: [{ id: 'file-123', file_url: 'http://example.com/test.jpg' }],
    };

    mockReq = createMockRequest(
      { content: '' },
      { channelId: 'channel-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };
    mockReq.file = mockFile;

    (messageService.createMessageWithFile as jest.Mock).mockResolvedValue(mockMessage);

    // Act
    await createMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockMessage);
    expect(messageService.createMessageWithFile).toHaveBeenCalledWith(
      'channel-123',
      'user-123',
      '',
      mockFile,
      undefined
    );
  });

  it('should create a thread message', async () => {
    // Arrange
    const mockMessage = {
      id: 'msg-123',
      content: 'Thread reply',
      channel_id: 'channel-123',
      user_id: 'user-123',
      parent_message_id: 'parent-123',
      created_at: new Date().toISOString(),
    };

    mockReq = createMockRequest(
      { 
        content: 'Thread reply',
        parentMessageId: 'parent-123'
      },
      { channelId: 'channel-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    (messageService.createMessageWithFile as jest.Mock).mockResolvedValue(mockMessage);

    // Act
    await createMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockMessage);
    expect(messageService.createMessageWithFile).toHaveBeenCalledWith(
      'channel-123',
      'user-123',
      'Thread reply',
      undefined,
      'parent-123'
    );
  });

  it('should fail if no authentication', async () => {
    // Arrange
    mockReq = createMockRequest(
      { content: 'Test message' },
      { channelId: 'channel-123' },
      {}
    );

    // Act
    await createMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(messageService.createMessageWithFile).not.toHaveBeenCalled();
  });

  it('should fail if no content and no file', async () => {
    // Arrange
    mockReq = createMockRequest(
      { content: '' },
      { channelId: 'channel-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    // Act
    await createMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Message must contain content or file' });
    expect(messageService.createMessageWithFile).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    // Arrange
    mockReq = createMockRequest(
      { content: 'Test message' },
      { channelId: 'channel-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    const error = new AppError('Database error', 500);
    (messageService.createMessageWithFile as jest.Mock).mockRejectedValue(error);

    // Act
    await createMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Database error' });
  });

  it('should handle unknown errors', async () => {
    // Arrange
    mockReq = createMockRequest(
      { content: 'Test message' },
      { channelId: 'channel-123' },
      {}
    );
    mockReq.user = { id: 'user-123', email: 'test@example.com' };

    (messageService.createMessageWithFile as jest.Mock).mockRejectedValue(new Error('Unknown error'));

    // Act
    await createMessage(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'An unknown error occurred' });
  });
}); 