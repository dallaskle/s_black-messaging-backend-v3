import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../../../auth/authRoutes';
import * as controllers from '../../../auth/controllers';

jest.mock('../../../auth/controllers');

// Tests the auth routes configuration:
// 1. POST /register - user registration endpoint
// 2. POST /login - user login endpoint
// 3. POST /resend-confirmation - email confirmation resend
// 4. POST /refresh-token - token refresh endpoint
// 5. POST /logout - user logout endpoint
describe('Auth Routes', () => {
    let app: express.Application;

    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());
        app.use(cookieParser());
        app.use('/auth', authRoutes);
    });

    describe('POST /auth/register', () => {
        it('should route to register controller', async () => {
            const mockData = { name: 'Test', email: 'test@example.com', password: 'Test123!@#' };
            (controllers.register as jest.Mock).mockImplementation((req, res) => {
                res.status(201).json({ message: 'Registered' });
            });

            await request(app)
                .post('/auth/register')
                .send(mockData)
                .expect(201);

            expect(controllers.register).toHaveBeenCalled();
        });
    });

    describe('POST /auth/login', () => {
        it('should route to login controller', async () => {
            const mockData = { email: 'test@example.com', password: 'Test123!@#' };
            (controllers.login as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({ token: 'test-token' });
            });

            await request(app)
                .post('/auth/login')
                .send(mockData)
                .expect(200);

            expect(controllers.login).toHaveBeenCalled();
        });
    });

    describe('POST /auth/resend-confirmation', () => {
        it('should route to resendConfirmation controller', async () => {
            const mockData = { email: 'test@example.com' };
            (controllers.resendConfirmation as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({ message: 'Email sent' });
            });

            await request(app)
                .post('/auth/resend-confirmation')
                .send(mockData)
                .expect(200);

            expect(controllers.resendConfirmation).toHaveBeenCalled();
        });
    });

    describe('POST /auth/refresh-token', () => {
        it('should route to refreshToken controller', async () => {
            (controllers.refreshToken as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({ token: 'new-token' });
            });

            await request(app)
                .post('/auth/refresh-token')
                .expect(200);

            expect(controllers.refreshToken).toHaveBeenCalled();
        });
    });

    describe('POST /auth/logout', () => {
        it('should route to logout controller', async () => {
            (controllers.logout as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({ message: 'Logged out' });
            });

            await request(app)
                .post('/auth/logout')
                .expect(200);

            expect(controllers.logout).toHaveBeenCalled();
        });
    });
}); 