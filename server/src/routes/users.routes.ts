import express from 'express';
import { registercontroller, logincontroller, logoutcontroller, getLoginUser } from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', registercontroller);
router.post('/login', logincontroller);
router.post('/logout', logoutcontroller);

router.get('/profile', authMiddleware, getLoginUser);

export default router;
