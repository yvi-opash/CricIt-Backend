import Match, { MatchStatus, TossDecision } from "../model/match.model";
import Inning from "../model/inning.model";
import { Request, Response } from "express";
// import PlayerStats from "../model/PlayerStats";

export const startInning = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { striker, nonStriker, currentBowler } = req.body;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "match not found..." });

    if (
      match.status !== MatchStatus.TOSS &&
      match.status !== MatchStatus.INNINGS_BREAK
    ) {
      return res.status(400).json({
        message: "Matchnot start inning ..",
      });
    }

    const innings = await Inning.find({ matchId }).sort({
      inningNumber: 1,
    });

    
    let inningNumber: number;
    let battingTeam: any; 
    let bowlingTeam: any;

    // FIRST INNING
    if (innings.length === 0) {
      inningNumber = 1;

      const opponent =
        match.tossWinner?.toString() === match.teamA._id.toString()
          ? match.teamB._id
          : match.teamA._id;

      if (match.tossDecision === TossDecision.BAT) {
        battingTeam = match.tossWinner;
        bowlingTeam = opponent;
      } else {
        battingTeam = opponent;
        bowlingTeam = match.tossWinner;
      }
    } else if (innings.length === 1) {
      const firstInning = innings[0];

      if (firstInning.status !== "completed") {
        return res.status(400).json({
          message: "First inning not compleat",
        });
      }

      inningNumber = 2;
      battingTeam = firstInning.bowlingTeam;
      bowlingTeam = firstInning.battingTeam;
    } else {
      return res.status(400).json({
        message: "Both innings already completed",
      });
    }

    if (!striker || !nonStriker || !currentBowler) {
      return res.status(400).json({
        message: "Opening batsmen and bowler required",
      });
    }

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
      ballsInCurrentOver: 0,
      status: "ongoing",
      totalOvers : match.totalOverInMatch,
    });

    await inning.save();

    

    match.status = MatchStatus.LIVE;
    await match.save();

    return res.status(201).json({
      message: `Inning ${inningNumber} started`,
      inning,
    });
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

export const getInningById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const inning = await Inning.findById(id)
      .populate("striker", "playername")
      .populate("nonStriker", "playername")
      .populate("currentBowler", "playername");
      
    if (!inning) {
      return res.status(404).json({ message: "Inning not found" });
    }

    res.status(200).json(inning);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const changeBowler = async (req: Request, res: Response) => {
  try {
    const { inningId } = req.params;
    const { bowlerId } = req.body;

    const inning = await Inning.findById(inningId);
    if (!inning) return res.status(404).json({ message: "Inning not found" });

    inning.previousBowler = inning.currentBowler;
    inning.currentBowler = bowlerId;

    await inning.save();

    res.json({ message: "Bowler Changed", inning });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getInningsByMatchId = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const innings = await Inning.find({ matchId });

    res.status(200).json(innings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


export const startSecondInning = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const firstInning = await Inning.findOne({
      matchId,
      inningNumber: 1,
    });

    if (!firstInning || firstInning.status !== "completed") {
      return res.status(400).json({ message: "First inning not completed" });
    }

    const exist = await Inning.findOne({
      matchId,
      inningNumber: 2,
    });

    if (exist) {
      return res.status(400).json({ message: "Second inning already started" });
    }

    const match = await Match.findById(matchId);

    let battingTeam;
    let bowlingTeam;

    if (firstInning.battingTeam.equals(match!.teamA)) {
      battingTeam = match!.teamB;
      bowlingTeam = match!.teamA;
    } else {
      battingTeam = match!.teamA;
      bowlingTeam = match!.teamB;
    }

    const inning = await Inning.create({
      matchId,
      inningNumber: 2,
      battingTeam,
      bowlingTeam,
      totalRuns: 0,
      totalWickets: 0,
      oversCompleted: 0,
      ballsInCurrentOver: 0,
      target: firstInning.totalRuns + 1,
      status: "ongoing",
      totalOvers : match?.totalOverInMatch,
    });


    res.status(200).json(inning);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};


export const setOpeningPlayers = async (req: Request, res: Response) => {
  try {
    const { inningId } = req.params;
    const { striker, nonStriker, currentBowler } = req.body;

    const inning = await Inning.findById(inningId);
    if (!inning) {
      return res.status(404).json({ message: "Inning not found" });
    }

    inning.striker = striker;
    inning.nonStriker = nonStriker;
    inning.currentBowler = currentBowler;

    await inning.save();

    res.status(200).json({ inning });

  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};