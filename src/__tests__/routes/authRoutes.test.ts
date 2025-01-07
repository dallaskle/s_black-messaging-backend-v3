import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/authRoutes';
import * as authController from '../../controllers/authController';

jest.mock('../../controllers/authController');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const validUserData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test123!@#'
    };

    it('should route to register controller', async () => {
      // Mock the controller implementation
      (authController.register as jest.Mock).mockImplementation((req, res) => {
        res.status(201).json({ message: 'User registered' });
      });

      const response = await request(app)
        .post('/auth/register')
        .send(validUserData);

      expect(response.status).toBe(201);
      expect(authController.register).toHaveBeenCalled();
    });
  });

  describe('POST /auth/login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'Test123!@#'
    };

    it('should route to login controller', async () => {
      // Mock the controller implementation
      (authController.login as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ token: 'mock-token' });
      });

      const response = await request(app)
        .post('/auth/login')
        .send(validCredentials);

      expect(response.status).toBe(200);
      expect(authController.login).toHaveBeenCalled();
    });
  });
}); 