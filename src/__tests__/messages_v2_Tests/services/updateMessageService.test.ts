import { updateMessage } from '../../../messages_v2/services/updateMessageService';
import supabase from '../../../config/supabaseClient';
import { Message } from '../../../types/database';
import AppError from '../../../types/AppError';

// Mock supabase client
jest.mock('../../../config/supabaseClient', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
}));

describe('updateMessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update message successfully', async () => {
    // Arrange
    const mockMessage: Message = {
      id: 'msg-123',
      channel_id: 'channel-123',
      user_id: 'user-123',
      content: 'Original content',
      created_at: new Date().toISOString(),
      parent_message_id: null,
      updated_at: null,
    };

    const updatedMessage: Message = {
      ...mockMessage,
      content: 'Updated content',
      updated_at: new Date().toISOString(),
      channels: {
        workspace_id: 'workspace-123'
      }
    };

    (supabase.from('messages').select('*').eq('id', 'msg-123').single as jest.Mock)
      .mockImplementation(() => Promise.resolve({
        data: mockMessage,
        error: null,
      }));

    (supabase.from('messages').update(updatedMessage).eq('id', 'msg-123').select('*').single as jest.Mock)
      .mockImplementation(() => Promise.resolve({
        data: updatedMessage,
        error: null,
      }));

    // Act
    const result = await updateMessage('msg-123', 'user-123', 'Updated content');

    // Assert
    expect(result).toEqual(updatedMessage);
    expect(supabase.from('messages').update).toHaveBeenCalledWith({
      content: 'Updated content',
      updated_at: expect.any(String)
    });
  });

  it('should throw error if message not found', async () => {
    // Arrange
    (supabase.from('messages').select('*').eq('id', 'msg-123').single as jest.Mock)
      .mockImplementation(() => Promise.resolve({
        data: null,
        error: null,
      }));

    // Act & Assert
    await expect(updateMessage('msg-123', 'user-123', 'Updated content'))
      .rejects
      .toThrow('Message not found');
  });

  it('should throw error if user is not message owner', async () => {
    // Arrange
    const mockMessage: Message = {
      id: 'msg-123',
      channel_id: 'channel-123',
      user_id: 'other-user',
      content: 'Original content',
      created_at: new Date().toISOString(),
      parent_message_id: null,
      updated_at: null,
    };

    (supabase.from('messages').select('*').eq('id', 'msg-123').single as jest.Mock)
      .mockImplementation(() => Promise.resolve({
        data: mockMessage,
        error: null,
      }));

    // Act & Assert
    await expect(updateMessage('msg-123', 'user-123', 'Updated content'))
      .rejects
      .toThrow('Access denied');
  });

  it('should handle database error during message fetch', async () => {
    // Arrange
    (supabase.from('messages').select('*').eq('id', 'msg-123').single as jest.Mock)
      .mockImplementation(() => Promise.resolve({
        data: null,
        error: { message: 'Database error' },
      }));

    // Act & Assert
    await expect(updateMessage('msg-123', 'user-123', 'Updated content'))
      .rejects
      .toThrow('Database error');
  });

  it('should handle database error during message update', async () => {
    // Arrange
    const mockMessage: Message = {
      id: 'msg-123',
      channel_id: 'channel-123',
      user_id: 'user-123',
      content: 'Original content',
      created_at: new Date().toISOString(),
      parent_message_id: null,
      updated_at: null,
    };

    (supabase.from('messages').select('*').eq('id', 'msg-123').single as jest.Mock)
      .mockImplementation(() => Promise.resolve({
        data: mockMessage,
        error: null,
      }));

    (supabase.from('messages').update(mockMessage).eq('id', 'msg-123').select('*').single as jest.Mock)
      .mockImplementation(() => Promise.resolve({
        data: null,
        error: { message: 'Update failed' },
      }));

    // Act & Assert
    await expect(updateMessage('msg-123', 'user-123', 'Updated content'))
      .rejects
      .toThrow('Update failed');
  });
}); 