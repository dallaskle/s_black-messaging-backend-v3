import express from 'express';
import userRoutes from './routes/userRoutes'
import workspaceRoutes from './routes/workspaceRoutes'

const app = express();

// Middleware
app.use(express.json()); // For parsing JSON
app.use(express.urlencoded({ extended: true })); // For parsing form data

// Routes
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);

export default app;
