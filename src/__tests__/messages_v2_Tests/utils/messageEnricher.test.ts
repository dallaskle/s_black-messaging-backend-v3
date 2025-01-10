import { enrichMessageWithDetails } from '../../../messages_v2/utils/messageEnricher';
import supabase from '../../../config/supabaseClient';
import { Message } from '../../../types/database';

// Mock supabase client
jest.mock('../../../config/supabaseClient', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
}));

describe('messageEnricher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should enrich message with user details and reactions', async () => {
    // Arrange
    const mockMessage: Message = {
      id: 'msg-123',
      channel_id: 'channel-123',
      user_id: 'user-123',
      content: 'Test message',
      created_at: new Date().toISOString(),
      parent_message_id: null,
      updated_at: null,
      channels: {
        workspace_id: 'workspace-123'
      },
      raw_reactions: [
        { emoji: '👍', user_id: 'user-123' },
        { emoji: '👍', user_id: 'user-456' },
        { emoji: '❤️', user_id: 'user-123' }
      ]
    };

    const mockWorkspaceMember = {
      display_name: 'Display Name'
    };

    const mockUser = {
      name: 'User Name'
    };

    (supabase.from('workspace_members').select('display_name')
      .eq('workspace_id', 'workspace-123')
      .eq('user_id', 'user-123')
      .single as jest.Mock)
      .mockImplementation(() => Promise.resolve({
        data: mockWorkspaceMember,
        error: null,
      }));

    (supabase.from('users').select('name')
      .eq('id', 'user-123')
      .single as jest.Mock)
      .mockImplementation(() => Promise.resolve({
        data: mockUser,
        error: null,
      }));

    // Act
    const result = await enrichMessageWithDetails(mockMessage, 'user-123');

    // Assert
    expect(result.name).toBe('Display Name');
    expect(result.reactions).toEqual({
      '👍': 2,
      '❤️': 1
    });
    expect(result.userReactions).toEqual(['👍', '❤️']);
  });

  it('should fallback to user name if no display name', async () => {
    // Arrange
    const mockMessage: Message = {
      id: 'msg-123',
      channel_id: 'channel-123',
      user_id: 'user-123',
      content: 'Test message',
      created_at: new Date().toISOString(),
      parent_message_id: null,
      updated_at: null,
      channels: {
        workspace_id: 'workspace-123'
      },
      raw_reactions: []
    };

    (supabase.from('workspace_members').select('display_name')
      .eq('workspace_id', 'workspace-123')
      .eq('user_id', 'user-123')
      .single as jest.Mock)
      .mockImplementation(() => Promise.resolve({
        data: null,
        error: null,
      }));

    (supabase.from('users').select('name')
      .eq('id', 'user-123')
      .single as jest.Mock)
      .mockImplementation(() => Promise.resolve({
        data: { name: 'User Name' },
        error: null,
      }));

    // Act
    const result = await enrichMessageWithDetails(mockMessage, 'user-123');

    // Assert
    expect(result.name).toBe('User Name');
  });

  it('should handle database errors gracefully', async () => {
    // Arrange
    const mockMessage: Message = {
      id: 'msg-123',
      channel_id: 'channel-123',
      user_id: 'user-123',
      content: 'Test message',
      created_at: new Date().toISOString(),
      parent_message_id: null,
      updated_at: null,
      channels: {
        workspace_id: 'workspace-123'
      },
      raw_reactions: []
    };

    (supabase.from('workspace_members').select('display_name')
      .eq('workspace_id', 'workspace-123')
      .eq('user_id', 'user-123')
      .single as jest.Mock)
      .mockImplementation(() => Promise.resolve({
        data: null,
        error: { message: 'Database error' },
      }));

    (supabase.from('users').select('name')
      .eq('id', 'user-123')
      .single as jest.Mock)
      .mockImplementation(() => Promise.resolve({
        data: null,
        error: { message: 'Database error' },
      }));

    // Act
    const result = await enrichMessageWithDetails(mockMessage, 'user-123');

    // Assert
    expect(result.name).toBe('Unknown');
    expect(result.reactions).toEqual({});
    expect(result.userReactions).toEqual([]);
  });
}); 