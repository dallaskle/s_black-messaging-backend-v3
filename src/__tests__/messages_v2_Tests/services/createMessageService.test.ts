import { createMessage, createMessageWithFile } from '../../../messages_v2/services/createMessageService';
import supabase from '../../../config/supabaseClient';
import { fileService } from '../../../files/services/fileService';
import AppError from '../../../types/AppError';
import { Message, File } from '../../../types/database';

// Mock supabase client
jest.mock('../../../config/supabaseClient', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  single: jest.fn(),
  eq: jest.fn().mockReturnThis(),
}));

// Mock file service
jest.mock('../../../services/fileService');

describe('createMessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should create a message successfully', async () => {
      // Arrange
      const mockMessage: Message = {
        id: 'msg-123',
        channel_id: 'channel-123',
        user_id: 'user-123',
        content: 'Test message',
        created_at: new Date().toISOString(),
        parent_message_id: null,
        updated_at: null,
      };

      (supabase.from('messages').insert(mockMessage).select().single as jest.Mock).mockImplementation(() => 
        Promise.resolve({
          data: mockMessage,
          error: null,
        })
      );

      // Act
      const result = await createMessage('channel-123', 'user-123', 'Test message');

      // Assert
      expect(result).toEqual(mockMessage);
      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(supabase.from('messages').insert).toHaveBeenCalledWith({
        channel_id: 'channel-123',
        user_id: 'user-123',
        content: 'Test message',
        parent_message_id: undefined,
      });
    });

    it('should create a thread message successfully', async () => {
      // Arrange
      const mockMessage: Message = {
        id: 'msg-123',
        channel_id: 'channel-123',
        user_id: 'user-123',
        content: 'Thread reply',
        parent_message_id: 'parent-123',
        created_at: new Date().toISOString(),
        updated_at: null,
      };

      (supabase.from('messages').insert(mockMessage).select().single as jest.Mock).mockImplementation(() => 
        Promise.resolve({
          data: mockMessage,
          error: null,
        })
      );

      // Act
      const result = await createMessage('channel-123', 'user-123', 'Thread reply', 'parent-123');

      // Assert
      expect(result).toEqual(mockMessage);
      expect(supabase.from('messages').insert).toHaveBeenCalledWith({
        channel_id: 'channel-123',
        user_id: 'user-123',
        content: 'Thread reply',
        parent_message_id: 'parent-123',
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      (supabase.from('messages').insert(null).select().single as jest.Mock).mockImplementation(() => 
        Promise.resolve({
          data: null,
          error: { message: 'Database error' },
        })
      );

      // Act & Assert
      await expect(createMessage('channel-123', 'user-123', 'Test message'))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('createMessageWithFile', () => {
    it('should create a message with file attachment', async () => {
      // Arrange
      const mockFile = {
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockUploadedFile: File = {
        id: 'file-123',
        channel_id: 'channel-123',
        user_id: 'user-123',
        file_url: 'http://example.com/test.jpg',
        file_name: 'test.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        uploaded_at: new Date().toISOString(),
      };

      const mockMessage: Message = {
        id: 'msg-123',
        channel_id: 'channel-123',
        user_id: 'user-123',
        content: 'Test message',
        created_at: new Date().toISOString(),
        parent_message_id: null,
        updated_at: null,
        files: [mockUploadedFile],
      };

      (fileService.uploadFile as jest.Mock).mockResolvedValue(mockUploadedFile);
      (supabase.from('messages').insert(mockMessage).select().single as jest.Mock).mockImplementation(() => 
        Promise.resolve({
          data: mockMessage,
          error: null,
        })
      );

      // Act
      const result = await createMessageWithFile(
        'channel-123',
        'user-123',
        'Test message',
        mockFile
      );

      // Assert
      expect(result).toEqual(mockMessage);
      expect(fileService.uploadFile).toHaveBeenCalledWith('channel-123', 'user-123', mockFile);
      expect(supabase.from('messages').insert).toHaveBeenCalledWith({
        channel_id: 'channel-123',
        user_id: 'user-123',
        content: 'Test message',
        parent_message_id: undefined,
      });
    });

    it('should handle file upload errors', async () => {
      // Arrange
      const mockFile = {
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      (fileService.uploadFile as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      // Act & Assert
      await expect(createMessageWithFile('channel-123', 'user-123', 'Test message', mockFile))
        .rejects
        .toThrow('Upload failed');
    });

    it('should create message without file when no file is provided', async () => {
      // Arrange
      const mockMessage: Message = {
        id: 'msg-123',
        channel_id: 'channel-123',
        user_id: 'user-123',
        content: 'Test message',
        created_at: new Date().toISOString(),
        parent_message_id: null,
        updated_at: null,
      };

      (supabase.from('messages').insert(mockMessage).select().single as jest.Mock).mockImplementation(() => 
        Promise.resolve({
          data: mockMessage,
          error: null,
        })
      );

      // Act
      const result = await createMessageWithFile('channel-123', 'user-123', 'Test message');

      // Assert
      expect(result).toEqual(mockMessage);
      expect(fileService.uploadFile).not.toHaveBeenCalled();
    });

    it('should handle message creation failure after successful file upload', async () => {
      // Arrange
      const mockFile = {
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockUploadedFile: File = {
        id: 'file-123',
        channel_id: 'channel-123',
        user_id: 'user-123',
        file_url: 'http://example.com/test.jpg',
        file_name: 'test.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        uploaded_at: new Date().toISOString(),
      };

      (fileService.uploadFile as jest.Mock).mockResolvedValue(mockUploadedFile);
      (supabase.from('messages').insert(mockUploadedFile).select().single as jest.Mock).mockImplementation(() => 
        Promise.resolve({
          data: null,
          error: { message: 'Database error' },
        })
      );
      (fileService.deleteFile as jest.Mock).mockResolvedValue(undefined);

      // Act & Assert
      await expect(createMessageWithFile('channel-123', 'user-123', 'Test message', mockFile))
        .rejects
        .toThrow('Database error');
      
      // Should attempt to clean up the uploaded file
      expect(fileService.deleteFile).toHaveBeenCalledWith(mockUploadedFile.id);
    });
  });
}); 