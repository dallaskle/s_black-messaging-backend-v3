import request from 'supertest';
import express from 'express';
import userRoutes from '../../routes/userRoutes';
import * as userController from '../../controllers/userController';

jest.mock('../../controllers/userController');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/me', () => {
    it('should route to getUser controller', async () => {
      const mockUser = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com'
      };

      // Mock the controller implementation
      (userController.getUser as jest.Mock).mockImplementation((req, res) => {
        res.json(mockUser);
      });

      const response = await request(app).get('/api/users/me');

      expect(response.status).toBe(200);
      expect(userController.getUser).toHaveBeenCalled();
      expect(response.body).toEqual(mockUser);
    });
  });
}); 