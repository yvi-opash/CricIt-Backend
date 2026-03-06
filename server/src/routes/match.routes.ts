import express from 'express'
import { createMatch, finishMatch, matchDetail, matchToss, playingTeam, startMatch } from '../controllers/match.controller';
import { authMiddleware } from '../middleware/auth.middleware';


const router = express.Router();


router.post('/create',authMiddleware, createMatch);
router.post('/team/:matchId', playingTeam);
router.post('/toss/:matchId', matchToss);
router.post('/start/:matchId', startMatch);
router.post('/finish/:matchId', finishMatch);
router.get('/detail/:matchId', matchDetail);

export default router;