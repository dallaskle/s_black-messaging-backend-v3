import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import * as directMessageService from '../../../channel/directMessage/directMessage.service';
import supabase from '../../../config/supabaseClient';
import AppError from '../../../types/AppError';
import { 
  MockSupabaseResponse, 
  createMockChannel, 
  mockSupabaseQuery 
} from '../../utils/testUtils';

jest.mock('../../../config/supabaseClient', () => ({
  from: jest.fn(),
}));

describe('DirectMessage Service', () => {
  const mockWorkspaceId = 'workspace-123';
  const mockUserId = 'user-123';
  const mockTargetUserId = 'target-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper functions using testUtils
  const mockWorkspaceMembers = (members: { user_id: string }[]): MockSupabaseResponse<any> => {
    const query = mockSupabaseQuery();
    query.single.mockResolvedValue({ data: members, error: null });
    
    (supabase.from as jest.Mock).mockReturnValueOnce({
      ...query,
      select: jest.fn().mockReturnValue(query),
      eq: jest.fn().mockReturnValue(query),
      in: jest.fn().mockReturnValue(query)
    });

    return { data: members, error: null };
  };

  const mockExistingChannel = (channel: ReturnType<typeof createMockChannel> | null) => {
    const query = mockSupabaseQuery();
    query.single.mockResolvedValue({ data: channel ? [channel] : [], error: null });
    
    (supabase.from as jest.Mock).mockReturnValueOnce({
      ...query,
      select: jest.fn().mockReturnValue(query),
      eq: jest.fn().mockReturnValue(query)
    });
  };

  const mockChannelCreation = (channelData: Partial<ReturnType<typeof createMockChannel>> | null) => {
    const query = mockSupabaseQuery();
    const channel = channelData ? createMockChannel(channelData) : null;
    query.single.mockResolvedValue({ data: channel, error: null });
    
    (supabase.from as jest.Mock).mockReturnValueOnce({
      ...query,
      insert: jest.fn().mockReturnValue(query),
      select: jest.fn().mockReturnValue(query)
    });
  };

  const mockChannelMembersCreation = () => {
    const query = mockSupabaseQuery();
    query.single.mockResolvedValue({ error: null });
    
    (supabase.from as jest.Mock).mockReturnValueOnce({
      ...query,
      insert: jest.fn().mockReturnValue(query),
      select: jest.fn().mockReturnValue(query)
    });
  };

  describe('createDMChannel', () => {
    it('should create a new DM channel when one does not exist', async () => {
      const mockChannel = createMockChannel({
        type: 'dm',
        is_private: true,
        name: `dm-${mockUserId}-${mockTargetUserId}`
      });
      
      mockWorkspaceMembers([
        { user_id: mockUserId }, 
        { user_id: mockTargetUserId }
      ]);
      mockExistingChannel(null);
      mockChannelCreation(mockChannel);
      mockChannelMembersCreation();

      const result = await directMessageService.createDMChannel(
        mockWorkspaceId,
        mockUserId,
        mockTargetUserId
      );

      expect(result).toEqual(mockChannel);
    });

    it('should return existing DM channel if one exists', async () => {
      const existingChannel = createMockChannel({
        type: 'dm',
        is_private: true,
        name: `dm-${mockUserId}-${mockTargetUserId}`,
        channel_members: [
          { user_id: mockUserId },
          { user_id: mockTargetUserId }
        ]
      });

      mockWorkspaceMembers([
        { user_id: mockUserId }, 
        { user_id: mockTargetUserId }
      ]);
      mockExistingChannel(existingChannel);

      const result = await directMessageService.createDMChannel(
        mockWorkspaceId,
        mockUserId,
        mockTargetUserId
      );

      expect(result).toEqual(existingChannel);
    });

    it('should throw error if users are not workspace members', async () => {
      mockWorkspaceMembers([{ user_id: mockUserId }]);

      await expect(
        directMessageService.createDMChannel(mockWorkspaceId, mockUserId, mockTargetUserId)
      ).rejects.toThrow('Both users must be workspace members');
    });

    it('should throw error if channel creation fails', async () => {
      mockWorkspaceMembers([
        { user_id: mockUserId }, 
        { user_id: mockTargetUserId }
      ]);
      mockExistingChannel(null);
      mockChannelCreation(null);

      await expect(
        directMessageService.createDMChannel(mockWorkspaceId, mockUserId, mockTargetUserId)
      ).rejects.toThrow('Failed to create DM channel');
    });
  });
});
