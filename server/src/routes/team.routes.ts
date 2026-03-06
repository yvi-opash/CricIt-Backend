import { createTeam, deleteTeam, getAllTeams } from "../controllers/team.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import express from 'express';

const router = express.Router();

router.post('/create', authMiddleware, createTeam);
router.get('/all', getAllTeams);
router.delete('/delete/:id', authMiddleware, deleteTeam);

export default router;