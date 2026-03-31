import express from 'express'
import { createMatch,  EndMatch,  getAllMatch, getLiveMatches, matchDetail, matchToss, playingTeam } from '../controllers/match.controller';
import { authMiddleware } from '../middleware/auth.middleware';


const router = express.Router();


router.post('/create',authMiddleware, createMatch);
router.post('/team/:matchId', playingTeam);
router.post('/toss/:matchId', matchToss);
// router.post('/start/:matchId', startMatch);
router.post('/end/:matchId', EndMatch);
router.get('/detail/:matchId', matchDetail);
router.get('/all',  getAllMatch);
router.get('/live', getLiveMatches);


export default router;