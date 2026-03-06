import { createPlayer, deletePlayer, getAllPlayer, updatePlayer } from "../controllers/player.controller";
import express from "express";

const router = express.Router()

router.post('/createplayer', createPlayer);
router.get('/allplayer', getAllPlayer);
router.delete('/deleteplayer/:id', deletePlayer);
router.put('/updateplayer/:id', updatePlayer);


export default router;