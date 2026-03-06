import express from 'express';
import { registercontroller, logincontroller } from '../controllers/users.controller';

const router = express.Router();

router.post('/register', registercontroller);
router.post('/login', logincontroller);

export default router;
