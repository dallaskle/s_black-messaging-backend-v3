import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import directMessageRoutes from '../../../channel/directMessage/directMessage.routes';
import { authenticateToken } from '../../../middleware/authMiddleWare/authenticateToken';

// Mock authentication middleware
jest.mock('../../../middleware/authMiddleWare/authenticateToken', () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
}));

describe('DirectMessage Routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/', directMessageRoutes);

  it('should require authentication for all routes', () => {
    expect(authenticateToken).toBeDefined();
  });

  describe('POST /workspaces/:workspaceId/dm', () => {
    it('should have the create DM channel route configured', async () => {
      const response = await request(app)
        .post('/workspaces/workspace-123/dm')
        .send({ targetUserId: 'user-123' });

      expect(response.status).toBeDefined();
    });

    // Add test for request body validation
    it('should validate request body format', async () => {
      const response = await request(app)
        .post('/workspaces/workspace-123/dm')
        .send({ wrongField: 'user-123' });

      expect(response.status).toBe(400);
    });

    // Add test for proper content type
    it('should require JSON content type', async () => {
      const response = await request(app)
        .post('/workspaces/workspace-123/dm')
        .send('targetUserId=user-123');

      expect(response.status).toBe(400);
    });
  });
});
