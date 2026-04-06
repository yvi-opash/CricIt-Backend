import { Request, Response } from "express";
import PlayerHistory from "../model/PlayerHistory.model";



export const getMatchScorecard = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const data = await PlayerHistory.find({ matchId })
      .populate("playerId", "playername role");

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching scorecard", error });
  }
};



export const getPlayerHistory = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;

    const data = await PlayerHistory.find({ playerId })
      .populate("matchId", "teamA teamB venue matchDate")
      .populate("playerId", "playername")
      
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching player history", error });
  }
};