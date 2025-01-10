import { Request, Response } from 'express';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import * as generalChannelService from '../../../channel/general/generalChannel.service';
import * as generalChannelController from '../../../channel/general/generalChannel.controller';
import AppError from '../../../types/AppError';
import { Channel } from '../../../types/database';
import { createMockChannel } from '../../utils/testUtils';

jest.mock('../../../channel/general/generalChannel.service');
/*
describe('General Channel Controller', () => {
  const mockWorkspaceId = 'workspace-123';
  const mockChannelId = 'channel-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createChannel', () => {
    it('should create channel successfully', async () => {
      const mockRequest = createMockRequest(
        { name: 'test-channel' },
        { workspaceId: mockWorkspaceId }
      ) as Request & { user?: { id: string } };

      const mockResponse = createMockResponse() as Response;
      const mockChannel: Channel = {
        id: mockChannelId,
        name: 'test-channel',
        workspace_id: mockWorkspaceId,
        is_private: false,
        type: 'channel',
        topic: null,
        description: null,
        created_by: mockUserId,
        created_at: expect.any(String)
      };

      jest.spyOn(generalChannelService, 'createChannel').mockResolvedValueOnce(mockChannel);

      await generalChannelController.createChannel(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockChannel);
      expect(generalChannelService.createChannel).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockUserId,
        { name: 'test-channel' }
      );
    });

    it('should handle unauthorized request', async () => {
      const mockRequest = createMockRequest(
        { name: 'test-channel' },
        { workspaceId: mockWorkspaceId }
      ) as Request;
      const mockResponse = createMockResponse() as Response;

      await generalChannelController.createChannel(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    });

    it('should handle service errors', async () => {
      const mockRequest = createMockRequest(
        { name: 'test-channel' },
        { workspaceId: mockWorkspaceId }
      ) as Request;
      mockRequest.user = { id: mockUserId };

      const mockResponse = createMockResponse() as Response;
      const mockError = new AppError('Access denied', 403);

      jest.spyOn(generalChannelService, 'createChannel').mockRejectedValueOnce(mockError);

      await generalChannelController.createChannel(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });
  });

  describe('getWorkspaceChannels', () => {
    it('should get channels successfully', async () => {
      const mockRequest = createMockRequest(
        {},
        { workspaceId: mockWorkspaceId }
      ) as Request & { user?: { id: string } };

      const mockResponse = createMockResponse() as Response;
      const mockChannels: Channel[] = [createMockChannel()];

      jest.spyOn(generalChannelService, 'getWorkspaceChannels').mockResolvedValueOnce(mockChannels);

      await generalChannelController.getWorkspaceChannels(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(mockChannels);
      expect(generalChannelService.getWorkspaceChannels).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockUserId
      );
    });

    it('should handle unauthorized request', async () => {
      const mockRequest = createMockRequest(
        {},
        { workspaceId: mockWorkspaceId }
      ) as Request;
      const mockResponse = createMockResponse() as Response;

      await generalChannelController.getWorkspaceChannels(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    });
  });

  describe('getChannel', () => {
    it('should get channel successfully', async () => {
      const mockRequest = createMockRequest(
        {},
        { channelId: mockChannelId }
      ) as Request;
      mockRequest.user = { id: mockUserId };

      const mockResponse = createMockResponse() as Response;
      const mockChannel = { id: mockChannelId, name: 'test-channel' };

      jest.spyOn(generalChannelService, 'getChannelById').mockResolvedValueOnce(mockChannel);

      await generalChannelController.getChannel(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(mockChannel);
      expect(generalChannelService.getChannelById).toHaveBeenCalledWith(
        mockChannelId,
        mockUserId
      );
    });

    it('should handle not found error', async () => {
      const mockRequest = createMockRequest(
        {},
        { channelId: mockChannelId }
      ) as Request;
      mockRequest.user = { id: mockUserId };

      const mockResponse = createMockResponse() as Response;
      const mockError = new AppError('Channel not found', 404);

      jest.spyOn(generalChannelService, 'getChannelById').mockRejectedValueOnce(mockError);

      await generalChannelController.getChannel(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Channel not found' });
    });
  });

  describe('updateChannel', () => {
    it('should update channel successfully', async () => {
      const mockRequest = createMockRequest(
        { name: 'updated-channel' },
        { channelId: mockChannelId }
      ) as Request;
      mockRequest.user = { id: mockUserId };

      const mockResponse = createMockResponse() as Response;
      const mockChannel = { id: mockChannelId, name: 'updated-channel' };

      jest.spyOn(generalChannelService, 'updateChannel').mockResolvedValueOnce(mockChannel);

      await generalChannelController.updateChannel(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(mockChannel);
      expect(generalChannelService.updateChannel).toHaveBeenCalledWith(
        mockChannelId,
        mockUserId,
        { name: 'updated-channel' }
      );
    });

    it('should handle permission error', async () => {
      const mockRequest = createMockRequest(
        { name: 'updated-channel' },
        { channelId: mockChannelId }
      ) as Request;
      mockRequest.user = { id: mockUserId };

      const mockResponse = createMockResponse() as Response;
      const mockError = new AppError('Access denied', 403);

      jest.spyOn(generalChannelService, 'updateChannel').mockRejectedValueOnce(mockError);

      await generalChannelController.updateChannel(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });
  });

  describe('deleteChannel', () => {
    it('should delete channel successfully', async () => {
      const mockRequest = createMockRequest(
        {},
        { channelId: mockChannelId }
      ) as Request;
      mockRequest.user = { id: mockUserId };

      const mockResponse = createMockResponse() as Response;

      jest.spyOn(generalChannelService, 'deleteChannel').mockResolvedValueOnce();

      await generalChannelController.deleteChannel(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(generalChannelService.deleteChannel).toHaveBeenCalledWith(
        mockChannelId,
        mockUserId
      );
    });

    it('should handle deletion error', async () => {
      const mockRequest = createMockRequest(
        {},
        { channelId: mockChannelId }
      ) as Request;
      mockRequest.user = { id: mockUserId };

      const mockResponse = createMockResponse() as Response;
      const mockError = new AppError('Channel not found', 404);

      jest.spyOn(generalChannelService, 'deleteChannel').mockRejectedValueOnce(mockError);

      await generalChannelController.deleteChannel(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Channel not found' });
    });
  });
});
*/