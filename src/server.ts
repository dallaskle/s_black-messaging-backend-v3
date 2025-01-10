import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './auth/authRoutes';
import workspaceRoutes from './workspace/workspaceRoutes';
import channelRoutes from './channel/index';
import messageRoutes from './routes/messageRoutes';
import messageV2Routes from './messages_v2/messageRoutes';
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
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api', channelRoutes);
  app.use('/api', messageRoutes);
  app.use('/api/v2', messageV2Routes); //SEE: V2
  app.use('/api', reactionRoutes);
  app.use('/api', fileRoutes);
  // Protected route example
  app.get('/api/protected', (req, res) => {
    res.json({ message: 'Protected data' });
  });

  return app;
} 