import { Request, Response } from "express";
import playerHistory from "../model/playerHistory.model";



export const getMatchScorecard = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const data = await playerHistory.find({ matchId })
      .populate("playerId", "playername role");

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching scorecard", error });
  }
};



export const getPlayerHistory = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;

    const data = await playerHistory.find({ playerId })
      .populate("matchId", "teamA teamB venue matchDate")
      .populate("playerId", "playername")
      
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching player history", error });
  }
};