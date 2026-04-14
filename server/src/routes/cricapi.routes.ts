import { Router } from "express";
import { getCricMatches } from "../controllers/cricapi.controller";

const router = Router();

router.get("/matches", getCricMatches);

export default router;
