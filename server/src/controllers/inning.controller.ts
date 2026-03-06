import Match from "../model/match.model";
import Inning from "../model/inning.model";
import { Request, Response } from "express";

export const createInning = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const {
      inningNumber,
      battingTeam,
      bowlingTeam,
      striker,
      nonStriker,
      currentBowler,
    } = req.body;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "match not found..." });

    // if (inningNumber !== 1 && inningNumber !== 2) {
    //   return res.status(400).json({ message: "inning noot start..." });
    // }

    const inning = await new Inning({
      matchId,
      inningNumber,
      battingTeam,
      bowlingTeam,
      totalRuns: 0,
      totalWickets: 0,
      oversCompleted: 0,
      striker,
      nonStriker,
      currentBowler,
    });

    await inning.save();

    res.status(202).json({ message: "inning created", inning });
  } catch (error) {
    res.status(400).json({ message: "server error", error });
  }
};

export const updatScore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { totalRuns, totalWickets, oversCompleted } = req.body;

    const inning = await Inning.findById(id);
    if (!inning)
      return res.status(404).json({ message: "inning is not created..." });

    if (totalRuns !== undefined) inning.totalRuns = totalRuns;
    if (totalWickets != undefined) inning.totalWickets = totalWickets;
    if (oversCompleted != undefined) inning.oversCompleted = oversCompleted;

    await inning.save();
    res.json(inning);
  } catch (er) {
    res.status(400).json({ message: "server error", er });
  }
};

export const compleateInning = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resultType } = req.body;

    const inning = await Inning.findById(id);
    if (!inning)
      return res.status(404).json({ message: "inning is not created..." });

    inning.status = "completed";
    if (resultType) inning.resultType = resultType;

    if (inning.inningNumber == 1) {
      inning.target = inning.totalRuns + 1;
    }

    await inning.save();

    const match = await Match.findById(inning.matchId);
    if (match) {
      const score = {
        runs: inning.totalRuns,
        wickets: inning.totalWickets,
        overs: inning.oversCompleted,
      };

      if (inning.battingTeam.equals(match.teamA)) {
        match.teamAScore = score;
      } else {
        match.teamBScore = score;
      }

      await match.save();
    }

    res.status(202).json({ inning });
  } catch (error) {
    res.status(400).json({ message: "server error", error });
  }
};
