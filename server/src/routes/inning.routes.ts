import express from 'express'
import { compleateInning, createInning, updatScore } from '../controllers/inning.controller';

const router = express.Router();

router.post('/create/:matchId', createInning);
router.post('/updatescore/:id', updatScore);
router.post('/compleate/:id', compleateInning);

export default router; 