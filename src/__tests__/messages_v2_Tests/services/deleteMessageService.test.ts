import { deleteMessage } from '../../../messages_v2/services/deleteMessageService';
import supabase from '../../../config/supabaseClient';
import { fileService } from '../../../services/fileService';
import AppError from '../../../types/AppError';
import { Message, File } from '../../../types/database';

// Mock supabase client
jest.mock('../../../config/supabaseClient', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  single: jest.fn(),
  eq: jest.fn().mockReturnThis(),
}));

// Mock file service
jest.mock('../../../services/fileService');

describe('deleteMessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete message successfully', async () => {
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

    (supabase.from('messages').select().single as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        data: mockMessage,
        error: null,
      })
    );

    (supabase.from('messages').delete().eq as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        error: null,
      })
    );

    // Act
    await deleteMessage('msg-123', 'user-123');

    // Assert
    expect(supabase.from).toHaveBeenCalledWith('messages');
    expect(supabase.from('messages').delete).toHaveBeenCalled();
    expect(supabase.from('messages').delete().eq).toHaveBeenCalledWith('id', 'msg-123');
  });

  it('should delete message and associated files', async () => {
    // Arrange
    const mockFile: File = {
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
      files: [mockFile],
    };

    (supabase.from('messages').select().single as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        data: mockMessage,
        error: null,
      })
    );

    (supabase.from('messages').delete().eq as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        error: null,
      })
    );

    (fileService.deleteFile as jest.Mock).mockResolvedValue(undefined);

    // Act
    await deleteMessage('msg-123', 'user-123');

    // Assert
    expect(fileService.deleteFile).toHaveBeenCalledWith(mockFile.id);
    expect(supabase.from('messages').delete).toHaveBeenCalled();
  });

  it('should throw error if message not found', async () => {
    // Arrange
    (supabase.from('messages').select().single as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        data: null,
        error: null,
      })
    );

    // Act & Assert
    await expect(deleteMessage('msg-123', 'user-123'))
      .rejects
      .toThrow('Message not found');
  });

  it('should throw error if user is not message owner', async () => {
    // Arrange
    const mockMessage: Message = {
      id: 'msg-123',
      channel_id: 'channel-123',
      user_id: 'other-user',
      content: 'Test message',
      created_at: new Date().toISOString(),
      parent_message_id: null,
      updated_at: null,
    };

    (supabase.from('messages').select().single as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        data: mockMessage,
        error: null,
      })
    );

    // Act & Assert
    await expect(deleteMessage('msg-123', 'user-123'))
      .rejects
      .toThrow('Access denied');
  });

  it('should handle database errors during message fetch', async () => {
    // Arrange
    (supabase.from('messages').select().single as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        data: null,
        error: { message: 'Database error' },
      })
    );

    // Act & Assert
    await expect(deleteMessage('msg-123', 'user-123'))
      .rejects
      .toThrow('Database error');
  });

  it('should handle database errors during message deletion', async () => {
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

    (supabase.from('messages').select().single as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        data: mockMessage,
        error: null,
      })
    );

    (supabase.from('messages').delete().eq as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        error: { message: 'Delete failed' },
      })
    );

    // Act & Assert
    await expect(deleteMessage('msg-123', 'user-123'))
      .rejects
      .toThrow('Delete failed');
  });

  it('should handle file deletion errors', async () => {
    // Arrange
    const mockFile: File = {
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
      files: [mockFile],
    };

    (supabase.from('messages').select().single as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        data: mockMessage,
        error: null,
      })
    );

    (fileService.deleteFile as jest.Mock).mockRejectedValue(new Error('File deletion failed'));

    // Act & Assert
    await expect(deleteMessage('msg-123', 'user-123'))
      .rejects
      .toThrow('File deletion failed');
  });
}); 