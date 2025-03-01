import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './auth/authRoutes';
import workspaceRoutes from './workspace/workspaceRoutes';
import channelRoutes from './channel/index';
import messageRoutes from './routes/messageRoutes';
import messageV2Routes from './messages_v2/messageRoutes';
import reactionRoutes from './reactions/reactionRoutes';
import fileRoutes from './files/fileRoutes';
import cloneRoutes from './clones/routes/clone.routes';
import aiRoutes from './clones/routes/ai.routes';

export function createServer() {
  const app = express();
  
  // Updated CORS Middleware with credentials
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-API-Key'],
    exposedHeaders: ['Set-Cookie', 'Authorization'],
  }));
  
  // Add preflight handling
  app.options('*', cors());
  
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.use(express.json());
  
  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api', channelRoutes);
  app.use('/api', messageRoutes);
  app.use('/api/v2', messageV2Routes);
  app.use('/api', reactionRoutes);
  app.use('/api', fileRoutes);
  app.use('/api', cloneRoutes);
  app.use('/api', aiRoutes);
  // Protected route example
  app.get('/api/protected', (req, res) => {
    res.json({ message: 'Protected data' });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  return app;
} 