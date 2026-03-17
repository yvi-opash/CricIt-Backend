import express from 'express'
import { addBall, getBallsByOver, getCommentary, getCurrentScore, undoLastBall } from '../controllers/ball.controller'


const router = express.Router()

// router.post("/addBall/:matchId/:Id" , addBall);
// router.get("/Ballsbyover/:inningsId", getBallsByOver);
// router.get("/CurrentScore/:id", getCurrentScore);
// router.delete('/undoBall/:inningsId', undoLastBall);
// router.get('/commentry/:inningsId', getCommentary);


router.post("/add/:matchId/:inningId", addBall);
router.delete("/undo/:inningId", undoLastBall);
router.get("/score/:inningId", getCurrentScore);
router.get("/overs/:inningId", getBallsByOver);
router.get("/commentary/:inningId", getCommentary);

export default router