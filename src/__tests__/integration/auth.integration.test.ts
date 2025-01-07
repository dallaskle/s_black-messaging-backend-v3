import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/authRoutes';
import * as authService from '../../services/authService';
import { createServer } from '../../server';

// Mock the auth service
jest.mock('../../services/authService');

describe('Authentication Flow Integration', () => {
  let app: express.Application;
  
  beforeAll(() => {
    app = createServer();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Registration and Login Flow', () => {
    const testUser = {
      name: 'Integration Test User',
      email: 'integration@test.com',
      password: 'TestPass123!'
    };

    const mockRegisteredUser = {
      id: 'test-user-id',
      name: testUser.name,
      email: testUser.email,
      created_at: new Date().toISOString()
    };

    const mockLoginResponse = {
      user: {
        id: 'test-user-id',
        email: testUser.email
      },
      session: {
        access_token: 'mock-jwt-token'
      }
    };

    it('should successfully register and then login a user', async () => {
      // Mock registration
      (authService.registerUser as jest.Mock).mockResolvedValueOnce(mockRegisteredUser);
      
      // Test registration
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(registerResponse.body).toEqual(mockRegisteredUser);

      // Mock login
      (authService.loginUser as jest.Mock).mockResolvedValueOnce(mockLoginResponse);

      // Test login with registered credentials
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(loginResponse.body).toEqual(mockLoginResponse);
      expect(loginResponse.body.session.access_token).toBeDefined();
    });

    it('should handle registration with existing email', async () => {
      // Mock registration failure
      (authService.registerUser as jest.Mock).mockRejectedValueOnce(
        new Error('User with this email already exists')
      );

      const response = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(500);

      expect(response.body).toEqual({
        message: 'An unknown error occurred'
      });
    });

    it('should handle login with invalid credentials', async () => {
      // Mock login failure
      (authService.loginUser as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'wrong@email.com',
          password: 'WrongPass123!'
        })
        .expect(500);

      expect(response.body).toEqual({
        message: 'An unknown error occurred'
      });
    });

    it('should validate registration input', async () => {
      const invalidUser = {
        name: 'a', // too short
        email: 'invalid-email',
        password: 'weak'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should maintain session across requests', async () => {
      // Mock successful registration
      (authService.registerUser as jest.Mock).mockResolvedValueOnce(mockRegisteredUser);
      
      // Register
      await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      // Mock successful login
      (authService.loginUser as jest.Mock).mockResolvedValueOnce(mockLoginResponse);
      
      // Login and get token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      const token = loginResponse.body.session.access_token;

      // Mock protected route response
      const mockProtectedData = { message: 'Protected data' };
      
      // Test accessing protected route with token
      const protectedResponse = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(protectedResponse.body).toEqual(mockProtectedData);
    });
  });
}); 