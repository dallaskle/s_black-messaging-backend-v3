import { getChannelMessages, getThreadMessages } from '../../../messages_v2/services/readMessageService';
import supabase from '../../../config/supabaseClient';
import { getSignedUrl } from '../../../messages_v2/utils/fileUrlSigner';
import { Message, File, Channel } from '../../../types/database';
import AppError from '../../../types/AppError';

// Mock dependencies
jest.mock('../../../config/supabaseClient', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
}));

jest.mock('../../../messages_v2/utils/fileUrlSigner');

describe('readMessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getChannelMessages', () => {
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

    const mockMessage: Message & { files?: File[] } = {
      id: 'msg-123',
      channel_id: 'channel-123',
      user_id: 'user-123',
      content: 'Test message',
      created_at: new Date().toISOString(),
      parent_message_id: null,
      updated_at: null,
      files: [mockFile],
      channels: {
        workspace_id: 'workspace-123'
      },
      users: {
        name: 'Test User'
      },
      raw_reactions: []
    };

    it('should get channel messages for member', async () => {
      // Arrange
      const mockMembership = { role: 'member' };
      (supabase.from('channel_members').select('role').eq('user_id', 'user-123').eq('channel_id', 'channel-123').single as unknown as jest.Mock)
        .mockImplementation(() => Promise.resolve({
          data: mockMembership,
          error: null,
        }));

      (supabase.from('messages').select('*').eq('channel_id', 'channel-123').order('created_at', { ascending: false }).limit(50) as unknown as jest.Mock)
        .mockImplementation(() => Promise.resolve({
          data: [mockMessage],
          error: null,
        }));

      (getSignedUrl as jest.Mock).mockResolvedValue('http://example.com/signed-url');

      // Act
      const result = await getChannelMessages('channel-123', 'user-123', 50);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].files?.[0]?.file_url).toBe('http://example.com/signed-url');
      expect(getSignedUrl).toHaveBeenCalled();
    });

    it('should get channel messages for workspace member in public channel', async () => {
      // Arrange
      const mockChannel: Channel = {
        id: 'channel-123',
        workspace_id: 'workspace-123',
        name: 'test-channel',
        is_private: false,
        type: 'channel',
        topic: null,
        description: null,
        created_by: 'user-123',
        created_at: new Date().toISOString(),
      };

      (supabase.from('channel_members').select('role').eq('user_id', 'user-123').eq('channel_id', 'channel-123').single as unknown as jest.Mock)
        .mockImplementation(() => Promise.resolve({
          data: null,
          error: null,
        }));

      (supabase.from('channels').select('*').eq('id', 'channel-123').single as unknown as jest.Mock)
        .mockImplementation(() => Promise.resolve({
          data: mockChannel,
          error: null,
        }));

      (supabase.from('workspace_members').select('id').eq('workspace_id', 'workspace-123').eq('user_id', 'user-123').single as unknown as jest.Mock)
        .mockImplementation(() => Promise.resolve({
          data: { id: 'member-123' },
          error: null,
        }));

      (supabase.from('messages').select('*').eq('channel_id', 'channel-123').order('created_at', { ascending: false }).limit(50) as unknown as jest.Mock)
        .mockImplementation(() => Promise.resolve({
          data: [mockMessage],
          error: null,
        }));

      // Act
      const result = await getChannelMessages('channel-123', 'user-123', 50);

      // Assert
      expect(result).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      // Arrange
      const mockMembership = { role: 'member' };
      (supabase.from('channel_members').select('role').eq('user_id', 'user-123').eq('channel_id', 'channel-123').single as unknown as jest.Mock)
        .mockImplementation(() => Promise.resolve({
          data: mockMembership,
          error: null,
        }));

      const queryBuilder = supabase.from('messages')
        .select('*')
        .eq('channel_id', 'channel-123')
        .lt('created_at', '2024-01-01T00:00:00Z')
        .order('created_at', { ascending: false })
        .limit(20);

      (queryBuilder as unknown as jest.Mock).mockImplementation(() => Promise.resolve({
        data: [mockMessage],
        error: null,
      }));

      // Act
      const result = await getChannelMessages(
        'channel-123',
        'user-123',
        20,
        '2024-01-01T00:00:00Z'
      );

      // Assert
      expect(queryBuilder).toHaveBeenCalled();
    });

    it('should deny access to private channel for non-members', async () => {
      // Arrange
      const mockChannel: Channel = {
        id: 'channel-123',
        workspace_id: 'workspace-123',
        name: 'test-channel',
        is_private: true,
        type: 'channel',
        topic: null,
        description: null,
        created_by: 'user-123',
        created_at: new Date().toISOString(),
      };

      (supabase.from('channel_members').select('role').eq('user_id', 'user-123').eq('channel_id', 'channel-123').single as unknown as jest.Mock)
        .mockImplementation(() => Promise.resolve({
          data: null,
          error: null,
        }));

      (supabase.from('channels').select('*').eq('id', 'channel-123').single as unknown as jest.Mock)
        .mockImplementation(() => Promise.resolve({
          data: mockChannel,
          error: null,
        }));

      // Act & Assert
      await expect(getChannelMessages('channel-123', 'user-123', 50))
        .rejects
        .toThrow('Access denied');
    });

    it('should handle database errors', async () => {
      // Arrange
      (supabase.from('channel_members').select('role').eq('user_id', 'user-123').eq('channel_id', 'channel-123').single as unknown as jest.Mock)
        .mockImplementation(() => Promise.resolve({
          data: null,
          error: { message: 'Database error' },
        }));

      // Act & Assert
      await expect(getChannelMessages('channel-123', 'user-123', 50))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getThreadMessages', () => {
    const mockParentMessage: Message = {
      id: 'parent-123',
      channel_id: 'channel-123',
      user_id: 'user-123',
      content: 'Parent message',
      created_at: new Date().toISOString(),
      parent_message_id: null,
      updated_at: null,
    };

    const mockThreadMessage: Message = {
      id: 'reply-123',
      channel_id: 'channel-123',
      user_id: 'user-456',
      content: 'Thread reply',
      created_at: new Date().toISOString(),
      parent_message_id: 'parent-123',
      updated_at: null,
      users: {
        name: 'Reply User'
      }
    };

    it('should get thread messages successfully', async () => {
      // Arrange
      (supabase.from('messages').select('*').eq('id', 'parent-123').single as unknown as jest.Mock)
        .mockImplementation(() => Promise.resolve({
          data: mockParentMessage,
          error: null,
        }));

      (supabase.from('channel_members').select('role').eq('user_id', 'user-123').eq('channel_id', 'channel-123').single as unknown as jest.Mock)
        .mockImplementation(() => Promise.resolve({
          data: { role: 'member' },
          error: null,
        }));

      (supabase.from('messages').select('*').eq('parent_message_id', 'parent-123').order('created_at', { ascending: true }).limit(50) as unknown as jest.Mock)
        .mockImplementation(() => Promise.resolve({
          data: [mockThreadMessage],
          error: null,
        }));

      // Act
      const result = await getThreadMessages('parent-123', 'user-123', 50);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].parent_message_id).toBe('parent-123');
    });

    // Continue with more thread message tests...
  });
}); 