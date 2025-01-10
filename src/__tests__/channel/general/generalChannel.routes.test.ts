import request from 'supertest';
import express from 'express';
import generalChannelRoutes from '../../../channel/general/generalChannel.routes';
import { authenticateToken } from '../../../middleware/authMiddleWare/authenticateToken';
import * as generalChannelController from '../../../channel/general/generalChannel.controller';

jest.mock('../../../middleware/authMiddleWare/authenticateToken');
jest.mock('../../../channel/general/generalChannel.controller');

describe('General Channel Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(generalChannelRoutes);
    (authenticateToken as jest.Mock).mockImplementation((req, res, next) => next());
  });

  describe('POST /workspaces/:workspaceId/channels', () => {
    it('should create channel', async () => {
      const mockChannel = { id: 'channel-123', name: 'test-channel' };
      (generalChannelController.createChannel as jest.Mock).mockImplementation(
        (req, res) => res.status(201).json(mockChannel)
      );

      const response = await request(app)
        .post('/workspaces/workspace-123/channels')
        .send({ name: 'test-channel' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockChannel);
    });
  });

  describe('GET /workspaces/:workspaceId/channels', () => {
    it('should get workspace channels', async () => {
      const mockChannels = [{ id: 'channel-123', name: 'test-channel' }];
      (generalChannelController.getWorkspaceChannels as jest.Mock).mockImplementation(
        (req, res) => res.json(mockChannels)
      );

      const response = await request(app)
        .get('/workspaces/workspace-123/channels');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockChannels);
    });
  });

  describe('GET /channels/:channelId', () => {
    it('should get channel by id', async () => {
      const mockChannel = { id: 'channel-123', name: 'test-channel' };
      (generalChannelController.getChannel as jest.Mock).mockImplementation(
        (req, res) => res.json(mockChannel)
      );

      const response = await request(app)
        .get('/channels/channel-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockChannel);
    });
  });

  describe('PATCH /channels/:channelId', () => {
    it('should update channel', async () => {
      const mockChannel = { id: 'channel-123', name: 'updated-channel' };
      (generalChannelController.updateChannel as jest.Mock).mockImplementation(
        (req, res) => res.json(mockChannel)
      );

      const response = await request(app)
        .patch('/channels/channel-123')
        .send({ name: 'updated-channel' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockChannel);
    });
  });

  describe('DELETE /channels/:channelId', () => {
    it('should delete channel', async () => {
      (generalChannelController.deleteChannel as jest.Mock).mockImplementation(
        (req, res) => res.status(204).send()
      );

      const response = await request(app)
        .delete('/channels/channel-123');

      expect(response.status).toBe(204);
    });
  });
});
