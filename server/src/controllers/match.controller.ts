import Match, { MatchStatus } from "../model/match.model";
import Team from "../model/team.model";
import Inning from "../model/inning.model";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { request } from "https";

export const createMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { teamA, teamB } = req.body;
    const createdBy = req.user?.id;

    if (!createdBy) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!teamA || !teamB) {
      return res
        .status(400)
        .json({ message: "teamA and teamB are required..." });
    }

    const teamAExist = await Team.findById(teamA);
    const teamBExist = await Team.findById(teamB);

    if (!teamAExist || !teamBExist) {
      return res.status(404).json({ message: "team not found..." });
    }
    if (teamA === teamB) {
      return res.status(400).json({ message: "teams must be different.." });
    }

    const match = new Match({
      teamA,
      teamB,
      status: MatchStatus.UPCOMING,
      createdBy,
    });

    await match.save();
    res.status(200).json({
      message: "match created",
      match,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const playingTeam = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { playingTeamA, playingTeamB } = req.body;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "match not found.." });

    if (playingTeamA === playingTeamB)
      return res.status(400).json({ message: "teams must be different......" });

    if (playingTeamA.length !== playingTeamB.length)
      return res
        .status(400)
        .json({ message: "each team have same number of players..." });

    match.playingTeamA = playingTeamA;
    match.playingTeamB = playingTeamB;

    await match.save();
    res.status(200).json(match);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const matchToss = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { tossWinner, tossDecision } = req.body;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "match not found...." });

    if (match.status !== MatchStatus.UPCOMING) {
      return res.status(400).json({ message: "match already started.." });
    }

    if (
      tossWinner.toString() !== match.teamA.toString() &&
      tossWinner.toString() !== match.teamB.toString()
    ) {
      return res
        .status(400)
        .json({ message: "enter team name who won the toss.." });
    }

    match.tossWinner = tossWinner;
    match.tossDecision = tossDecision;
    match.status = MatchStatus.TOSS;

    await match.save();
    res.json(match);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const startMatch = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);

    if (!match)
      return res.status(404).json({ message: "match is not created...." });

    if (match.status !== MatchStatus.TOSS)
      return res
        .status(404)
        .json({ message: "before match starttt do toss..." });

    if (!match.tossWinner)
      return res.status(404).json({ message: "tosswinner not declaree..." });

    let battingTeam, bowlingTeam;

    if (match.tossDecision == "bat") {
      battingTeam = match.tossWinner;
    } else {
      bowlingTeam = match.tossWinner;
    }

    const inning = await new Inning({
      matchId,
      inningsNumber: 1,
      battingTeam: battingTeam,
      bowlingTeam: bowlingTeam,
    });

    match.status = MatchStatus.LIVE;

    await match.save();

    res.json({ message: "match start..", match });
  } catch (er) {
    res.status(500).json({ message: "Server error", er });
  }
};

export const finishMatch = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);

    if (!match)
      return res.status(404).json({ message: "match is not created...." });

    if (!match.teamAScore || !match.teamBScore)
      return res.status(400).json({ message: "scores not available", match });

    if (match.teamAScore.runs > match.teamBScore.runs) {
      match.winner = match.teamA;
    } else if (match.teamBScore.runs > match.teamAScore.runs) {
      match.winner = match.teamB;
    } else {
      return res.status(400).json({ message: "match is tie" });
    }

    match.status = MatchStatus.FINISHED;
    await match.save();
    res.json({ message: "match finished", match });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const matchDetail = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId)
      .populate("teamA", "teamName")
      .populate("teamB", "teamName")
      .populate("tossWinner", "teamName")
      .populate("winner", "teamName");

    if (!match)
      return res.status(404).json({ message: "match not created...." });

    res.status(200).json(match);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
