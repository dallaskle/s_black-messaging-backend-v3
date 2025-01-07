import express from 'express';
import userRoutes from './routes/userRoutes'

const app = express();

// Middleware
app.use(express.json()); // For parsing JSON
app.use(express.urlencoded({ extended: true })); // For parsing form data

// Routes
app.use('/api/users', userRoutes);

export default app;
