import Match, { MatchStatus } from "../model/match.model";
import Team from "../model/team.model";
import Inning from "../model/inning.model";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { request } from "https";
import players from "../model/players.model";

export const createMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { teamA, teamB, matchType, venue, matchDate, totalOverInMatch } = req.body;
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
      matchType,
      venue,
      matchDate,
      totalOverInMatch,
      status: MatchStatus.UPCOMING,
      createdBy,
    });

    if (totalOverInMatch > 50 && totalOverInMatch < 0) {
      res.status(400).json({ message: "Enter Valid Over" })
    }



    await match.save();
    res.status(200).json({ message: "match created", match });
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

    // if (playingTeamA === playingTeamB)
    //   return res.status(400).json({ message: "teams must be different......" });

    // if (playingTeamA.length !== playingTeamB.length)
    //   return res
    //     .status(400)
    //     .json({ message: "each team have same number of players..." });

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
        .json({ message: "enter team name who win toss.." });
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





export const EndMatch = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
 
    // Get match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
 
    // Get both innings with populate
    const innings = await Inning.find({ matchId })
      .sort({ inningNumber: 1 })
      .populate("battingTeam", "teamname")
      .populate("bowlingTeam", "teamname")
      .lean();
 
    if (innings.length !== 2) {
      return res.status(400).json({ message: "Both innings not completed" });
    }
 
    const firstInning = innings[0];
    const secondInning = innings[1];
 
    // Validate second inning is completed
    if (secondInning.status !== "completed") {
      return res.status(400).json({ message: "Second inning not completed" });
    }
 
    // ✅ Format overs function
    const formatOvers = (overs: number, balls: number) => {
      return `${overs}.${balls}`;
    };
 
    // Get scores
    const firstInningRuns = firstInning.totalRuns;
    const secondInningRuns = secondInning.totalRuns;
    const secondInningWickets = secondInning.totalWickets;
 
    const firstBattingTeam = firstInning.battingTeam as any;
    const secondBattingTeam = secondInning.battingTeam as any;
 
    const firstInningTeamName =
      firstBattingTeam?.teamname || "Team A";
    const secondInningTeamName =
      secondBattingTeam?.teamname || "Team B";
 
    // Determine winner
    let winner = null;
    let winnerTeamName = "";
    let resultDescription = "";
    let resultType = "";
 
    if (secondInningRuns > firstInningRuns) {
      winner = secondInning.battingTeam;
      winnerTeamName = secondInningTeamName;
      const runDifference = secondInningRuns - firstInningRuns;
      resultDescription = `${secondInningTeamName} won by ${runDifference} ${
        runDifference === 1 ? "run" : "runs"
      }`;
      resultType = "wins_by_runs";
    } else if (secondInningRuns < firstInningRuns) {
      winner = firstInning.battingTeam;
      winnerTeamName = firstInningTeamName;
      const wicketDifference = 10 - secondInningWickets;
      resultDescription = `${firstInningTeamName} won by ${wicketDifference} ${
        wicketDifference === 1 ? "wicket" : "wickets"
      }`;
      resultType = "wins_by_wickets";
    } else {
      resultDescription = "Match Tied! 🤝";
      resultType = "tied";
      winnerTeamName = "Tied";
    }
 
    // Update match
    match.status = MatchStatus.FINISHED;
    if (winner !== null) {
      match.winner = winner;
    }
    await match.save();
 
    // Return complete response with formatted overs
    res.status(200).json({
      message: "Match completed successfully",
      match: {
        _id: match._id,
        status: match.status,
        winner: match.winner,
      },
      firstInning: {
        inningNumber: 1,
        battingTeam: firstInning.battingTeam,
        battingTeamName: firstInningTeamName,
        bowlingTeam: firstInning.bowlingTeam,
        runs: firstInning.totalRuns,
        wickets: firstInning.totalWickets,
        overs: formatOvers(firstInning.oversCompleted, firstInning.ballsInCurrentOver), // ✅ Format overs
      },
      secondInning: {
        inningNumber: 2,
        battingTeam: secondInning.battingTeam,
        battingTeamName: secondInningTeamName,
        bowlingTeam: secondInning.bowlingTeam,
        runs: secondInning.totalRuns,
        wickets: secondInning.totalWickets,
        overs: formatOvers(secondInning.oversCompleted, secondInning.ballsInCurrentOver), // ✅ Format overs
      },
      winner: winner,
      winnerTeamName: winnerTeamName,
      resultDescription: resultDescription,
      resultType: resultType,
    });
  } catch (error: any) {
    console.error("Error completing match:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




export const matchDetail = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId)
      .populate("teamA", "teamname")
      .populate("teamB", "teamname")
      .populate("tossWinner", "teamname")
      .populate("winner", "teamname")
      .populate("playingTeamA", "playername")
      .populate("playingTeamB", "playername");

    if (!match)
      return res.status(404).json({ message: "match not created...." });

    res.status(200).json(match);
  } catch (error) {
    console.log("MATCH DETAIL ERROR:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


export const getAllMatch = async (req: Request, res: Response) => {
  try {
    // const createdBy = req.user?.id;

    // if (!createdBy) {
    //   return res.status(401).json({ message: "Unauthorized" });
    // }

    const matches = await Match.find()
      .populate("teamA", "teamname")
      .populate("teamB", "teamname")
      .sort({ createdAt: -1 });

    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// for home page live match
export const getLiveMatches = async (req: Request, res: Response) => {
  try {
    const matches = await Match.find({ status: "live" })
      .populate("teamA", "teamname")
      .populate("teamB", "teamname");

    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
