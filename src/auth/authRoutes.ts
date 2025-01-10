import express from 'express';
import {
    register,
    login,
    resendConfirmation,
    refreshToken,
    logout
} from './controllers';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/resend-confirmation', resendConfirmation);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

export default router;
