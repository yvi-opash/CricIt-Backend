import express from 'express';
import { registercontroller, logincontroller, logoutcontroller } from '../controllers/users.controller';

const router = express.Router();

router.post('/register', registercontroller);
router.post('/login', logincontroller);
router.post('/logout', logoutcontroller);

export default router;
