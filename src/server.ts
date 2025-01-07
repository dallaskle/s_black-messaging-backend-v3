import express from 'express';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';

export function createServer() {
  const app = express();
  
  // Middleware
  app.use(express.json());
  
  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/users', userRoutes);

  // Protected route example
  app.get('/api/protected', (req, res) => {
    res.json({ message: 'Protected data' });
  });

  return app;
} 