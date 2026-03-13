import { createPlayer, deletePlayer, getAllPlayer, getPlayersByTeam, updatePlayer } from "../controllers/player.controller";
import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router()

router.post('/create',authMiddleware, createPlayer);
router.get('/all',authMiddleware, getAllPlayer);
router.delete('/delete/:id', deletePlayer);
router.put('/update/:id', updatePlayer);
router.get("/team/:teamId", getPlayersByTeam);


export default router;