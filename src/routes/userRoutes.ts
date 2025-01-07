import express from 'express';
import { getUser, addUser } from '../controllers/userController';

const router = express.Router();

// GET /api/users/:id - Get user by ID
router.get('/me', getUser);

export default router;
