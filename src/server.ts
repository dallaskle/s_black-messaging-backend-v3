import express from 'express';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import channelRoutes from './routes/channelRoutes';
import messageRoutes from './routes/messageRoutes';
import reactionRoutes from './routes/reactionRoutes';

export function createServer() {
  const app = express();
  
  // Middleware
  app.use(express.json());
  
  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api', channelRoutes);
  app.use('/api', messageRoutes);
  app.use('/api', reactionRoutes);

  // Protected route example
  app.get('/api/protected', (req, res) => {
    res.json({ message: 'Protected data' });
  });

  return app;
} 