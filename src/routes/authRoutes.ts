import express from 'express';
import { register, login, resendConfirmation, refreshToken } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/resend-confirmation', resendConfirmation);
router.post('/refresh-token', refreshToken);

export default router;
