import express from "express";
import {
  generateAiCommentary,
  generatePlayerOfTheMatch,
} from "../controllers/ai.controller";

const router = express.Router();

router.post("/commentary", generateAiCommentary);
router.get("/player-of-match/:matchId", generatePlayerOfTheMatch);

export default router;
