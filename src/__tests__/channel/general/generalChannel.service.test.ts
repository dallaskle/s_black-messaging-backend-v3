import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import * as generalChannelService from '../../../channel/general/generalChannel.service';
import supabase from '../../../config/supabaseClient';
import AppError from '../../../types/AppError';
import { 
  MockSupabaseResponse, 
  createMockChannel, 
  mockSupabaseQuery 
} from '../../utils/testUtils';
import { MockSupabaseQuery } from '../../utils/testUtils';
import { Channel, ChannelMember } from '../../../types/database';

jest.mock('../../../config/supabaseClient', () => ({
  from: jest.fn(),
}));

describe('General Channel Service', () => {
  const mockWorkspaceId = 'workspace-123';
  const mockUserId = 'user-123';
  const mockChannelId = 'channel-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper functions
  const mockWorkspaceMembership = (membership: any | null): void => {
    const query = mockSupabaseQuery();
    query.single.mockResolvedValue({ data: membership, error: null });
    
    (supabase.from as jest.Mock).mockReturnValueOnce({
      ...query,
      select: jest.fn().mockReturnValue(query),
      eq: jest.fn().mockReturnValue(query)
    });
  };

  const mockChannelOperation = (channel: ReturnType<typeof createMockChannel> | null, operation: 'select' | 'insert' | 'update' | 'delete' = 'select'): void => {
    const query = mockSupabaseQuery();
    query.single.mockResolvedValue({ data: channel, error: null });
    
    (supabase.from as jest.Mock).mockReturnValueOnce({
      ...query,
      [operation]: jest.fn().mockReturnValue(query),
      select: jest.fn().mockReturnValue(query),
      eq: jest.fn().mockReturnValue(query)
    });
  };

  // Helper function for mocking channel member operations specifically
  const mockChannelMemberOperation = (member: Partial<ChannelMember> | null): void => {
    const query = mockSupabaseQuery();
    query.single.mockResolvedValue({ data: member, error: null });
    
    (supabase.from as jest.Mock).mockReturnValueOnce({
      ...query,
      select: jest.fn().mockReturnValue(query),
      eq: jest.fn().mockReturnValue(query)
    });
  };

  describe('createChannel', () => {
    it('should successfully create a public channel', async () => {
      const mockChannel = createMockChannel({ is_private: false });
      
      mockWorkspaceMembership({ role: 'member' });
      mockChannelOperation(mockChannel, 'insert');

      const result = await generalChannelService.createChannel(
        mockWorkspaceId,
        mockUserId,
        { name: 'test-channel' }
      );

      expect(result).toEqual(mockChannel);
      expect(supabase.from).toHaveBeenCalledWith('workspace_members');
      expect(supabase.from).toHaveBeenCalledWith('channels');
    });

    it('should successfully create a private channel and add creator as admin', async () => {
      const mockChannel = createMockChannel({ is_private: true });
      
      mockWorkspaceMembership({ role: 'member' });
      mockChannelOperation(mockChannel, 'insert');
      mockChannelOperation(null, 'insert'); // For channel member creation

      const result = await generalChannelService.createChannel(
        mockWorkspaceId,
        mockUserId,
        { name: 'test-channel', is_private: true }
      );

      expect(result).toEqual(mockChannel);
      expect(supabase.from).toHaveBeenCalledWith('channel_members');
    });

    it('should fail when user is not workspace member', async () => {
      mockWorkspaceMembership(null);

      await expect(
        generalChannelService.createChannel(mockWorkspaceId, mockUserId, {})
      ).rejects.toThrow('Access denied');
    });
  });

  /*
  describe('getWorkspaceChannels', () => {
    it('should return all accessible channels', async () => {
      const mockPublicChannel = createMockChannel({ is_private: false });
      const mockPrivateChannel = createMockChannel({ is_private: true });
      
      mockWorkspaceMembership({ role: 'member' });

      const publicQuery = mockSupabaseQuery();
      publicQuery.mockResolvedValue({ data: [mockPublicChannel], error: null });
      
      const privateQuery = mockSupabaseQuery();
      privateQuery.mockResolvedValue({ data: [mockPrivateChannel], error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          ...publicQuery,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis()
        })
        .mockReturnValueOnce({
          ...privateQuery,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis()
        });

      const result = await generalChannelService.getWorkspaceChannels(
        mockWorkspaceId,
        mockUserId
      );

      expect(result).toEqual([mockPublicChannel, mockPrivateChannel]);
    });

    it('should fail when user is not workspace member', async () => {
      mockWorkspaceMembership(null);

      await expect(
        generalChannelService.getWorkspaceChannels(mockWorkspaceId, mockUserId)
      ).rejects.toThrow('Access denied');
    });
  });*/

  describe('getChannelById', () => {
    it('should return public channel for workspace member', async () => {
      const mockChannel = createMockChannel({ is_private: false });
      
      mockChannelOperation(mockChannel);
      mockWorkspaceMembership({ role: 'member' });

      const result = await generalChannelService.getChannelById(
        mockChannelId,
        mockUserId
      );

      expect(result).toEqual(mockChannel);
    });

    it('should return private channel for channel member', async () => {
      const mockChannel = createMockChannel({ is_private: true });
      
      mockChannelOperation(mockChannel);
      mockChannelMemberOperation({ role: 'member' });

      const result = await generalChannelService.getChannelById(
        mockChannelId,
        mockUserId
      );

      expect(result).toEqual(mockChannel);
    });

    it('should fail when channel does not exist', async () => {
      mockChannelOperation(null);

      await expect(
        generalChannelService.getChannelById(mockChannelId, mockUserId)
      ).rejects.toThrow('Channel not found');
    });
  });

  describe('updateChannel', () => {
    it('should update public channel as workspace admin', async () => {
      const mockChannel = createMockChannel({ is_private: false });
      const updatedChannel = { ...mockChannel, name: 'updated-name' };
      
      mockChannelOperation(mockChannel);
      mockWorkspaceMembership({ role: 'admin' });
      mockChannelOperation(updatedChannel, 'update');

      const result = await generalChannelService.updateChannel(
        mockChannelId,
        mockUserId,
        { name: 'updated-name' }
      );

      expect(result.name).toBe('updated-name');
    });

    it('should fail when user lacks permissions', async () => {
      const mockChannel = createMockChannel({ is_private: false });
      
      mockChannelOperation(mockChannel);
      mockWorkspaceMembership({ role: 'member' });

      await expect(
        generalChannelService.updateChannel(mockChannelId, mockUserId, {})
      ).rejects.toThrow('Access denied');
    });
  });

  describe('deleteChannel', () => {
    it('should delete channel when user has permission', async () => {
      const mockChannel = createMockChannel({ is_private: false });
      
      mockChannelOperation(mockChannel);
      mockWorkspaceMembership({ role: 'admin' });
      mockChannelOperation(null, 'delete');

      await expect(
        generalChannelService.deleteChannel(mockChannelId, mockUserId)
      ).resolves.not.toThrow();
    });

    it('should fail when channel does not exist', async () => {
      mockChannelOperation(null);

      await expect(
        generalChannelService.deleteChannel(mockChannelId, mockUserId)
      ).rejects.toThrow('Channel not found');
    });
  });
});
