import { createPlayer, deletePlayer, getAllPlayer, getPlayersByTeam, updatePlayer } from "../controllers/player.controller";
import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { getMatchScorecard, getPlayerHistory } from "../controllers/playerHistory.controller";

const router = express.Router()

router.post('/create',authMiddleware, createPlayer);
router.get('/all',authMiddleware, getAllPlayer);
router.delete('/delete/:id', deletePlayer);
router.put('/update/:id', updatePlayer);
router.get("/team/:teamId", getPlayersByTeam);
router.get("/history/match/:matchId", getMatchScorecard);
router.get("/history/player/:playerId", getPlayerHistory);


export default router;