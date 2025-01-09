import express from 'express';
import userRoutes from './routes/userRoutes'
import workspaceRoutes from './routes/workspaceRoutes'
import fileRoutes from './routes/fileRoutes'

const app = express();

// Middleware
app.use(express.json()); // For parsing JSON
app.use(express.urlencoded({ extended: true })); // For parsing form data

export default app;
