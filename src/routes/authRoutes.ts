import express from 'express';
import { register, login, resendConfirmation } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/resend-confirmation', resendConfirmation);

export default router;
