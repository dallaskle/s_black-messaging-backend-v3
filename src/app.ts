import express from 'express';
import cors from 'cors';

const app = express();

// CORS configuration
app.use(cors({
  origin: 'https://s-black-message-frontend-v3.onrender.com',
  credentials: true
}));

// Middleware
app.use(express.json()); // For parsing JSON
app.use(express.urlencoded({ extended: true })); // For parsing form data

export default app;
