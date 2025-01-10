import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './auth/authRoutes';
import userRoutes from './routes/userRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import channelRoutes from './routes/channelRoutes';
import messageRoutes from './routes/messageRoutes';
import reactionRoutes from './routes/reactionRoutes';
import fileRoutes from './routes/fileRoutes';
export function createServer() {
  const app = express();
  
  // Updated CORS Middleware with credentials
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.use(express.json());
  
  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api', channelRoutes);
  app.use('/api', messageRoutes);
  app.use('/api', reactionRoutes);
  app.use('/api', fileRoutes);

  // Protected route example
  app.get('/api/protected', (req, res) => {
    res.json({ message: 'Protected data' });
  });

  return app;
} 