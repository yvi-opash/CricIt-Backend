import express from 'express'
import { compleateInning, createInning, getInningById, updatScore } from '../controllers/inning.controller';

const router = express.Router();

router.post('/create/:matchId', createInning);
router.post('/updatescore/:id', updatScore);
router.post('/compleate/:id', compleateInning);
router.get('/:id', getInningById);

export default router; 