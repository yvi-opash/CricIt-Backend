import Match, { MatchStatus } from "../model/match.model";
import Team from "../model/team.model";
import Inning from "../model/inning.model";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { request } from "https";
import players from "../model/players.model";
import PlayerHistory from "../model/playerHistory.model";

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

    await createMatchHistory(match);


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
 
    
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
 
    
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
 
    
    if (secondInning.status !== "completed") {
      return res.status(400).json({ message: "Second inning not completed" });
    }
 
    
    const formatOvers = (overs: number, balls: number) => {
      return `${overs}.${balls}`;
    };
 
   
    const firstInningRuns = firstInning.totalRuns;
    const secondInningRuns = secondInning.totalRuns;
    const secondInningWickets = secondInning.totalWickets;
 
    const firstBattingTeam = firstInning.battingTeam as any;
    const secondBattingTeam = secondInning.battingTeam as any;
 
    const firstInningTeamName =
      firstBattingTeam?.teamname || "Team A";
    const secondInningTeamName =
      secondBattingTeam?.teamname || "Team B";
 
    
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
 
    
    match.status = MatchStatus.FINISHED;
    if (winner !== null) {
      match.winner = winner;
    }
    await match.save();
 
    
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
        overs: formatOvers(firstInning.oversCompleted, firstInning.ballsInCurrentOver), 
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



export const getAllMatch = async (req: Request, res: Response) => {
  try {
    //  Fetch matches (optimized)
    const matches = await Match.find()
      .select(
        "teamA teamB tossWinner winner status createdAt totalOverInMatch"
      )
      .populate("teamA", "teamname")
      .populate("teamB", "teamname")
      .populate("tossWinner", "teamname")
      .populate("winner", "teamname")
      .sort({ createdAt: -1 })
      .lean();

    if (!matches.length) {
      return res.status(404).json({ message: "No matches found" });
    }

    const matchIds = matches.map((m) => m._id);

    //  Fetch innings (optimized)
    const innings = await Inning.find({ matchId: { $in: matchIds } })
      .select(
        "matchId inningNumber battingTeam totalRuns totalWickets oversCompleted ballsInCurrentOver status target"
      )
      .populate("battingTeam", "teamname")
      .lean();

    //  Convert innings into Map (O(N))
    const inningsMap = new Map();

    innings.forEach((inn) => {
      const key = inn.matchId.toString();

      if (!inningsMap.has(key)) {
        inningsMap.set(key, []);
      }

      inningsMap.get(key).push(inn);
    });

    //  Attach innings to matches (FAST)
    const matchesWithInnings = matches.map((match) => ({
      ...match,
      innings: inningsMap.get(match._id.toString()) || [],
    }));

    res.status(200).json(matchesWithInnings);
  } catch (error) {
    console.error("GET ALL MATCH ERROR:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
 
export const matchDetail = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    // 🚀 Run in parallel
    const [match, innings] = await Promise.all([
      Match.findById(matchId)
        .select(
          "teamA teamB tossWinner tossDecision winner playingTeamA playingTeamB status totalOverInMatch"
        )
        .populate("teamA", "teamname")
        .populate("teamB", "teamname")
        .populate("tossWinner", "teamname")
        .populate("winner", "teamname")
        .populate("playingTeamA", "playername")
        .populate("playingTeamB", "playername")
        .lean(),

      Inning.find({ matchId })
        .select(
          "battingTeam bowlingTeam totalRuns totalWickets oversCompleted ballsInCurrentOver striker nonStriker currentBowler status inningNumber target"
        )
        .populate("battingTeam", "teamname")
        .populate("bowlingTeam", "teamname")
        .populate("striker", "playername")
        .populate("nonStriker", "playername")
        .populate("currentBowler", "playername")
        .lean(),
    ]);

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.status(200).json({
      ...match,
      innings,
    });
  } catch (error) {
    console.log("MATCH DETAIL ERROR:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// for home page live match
export const getLiveMatches = async (req: Request, res: Response) => {
  try {
    const matches = await Match.find({ status: "live" })
      .select("teamA teamB status")
      .populate("teamA", "teamname")
      .populate("teamB", "teamname")
      .lean();

    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const createMatchHistory = async (match: any) => {
  const allPlayers = [...match.playingTeamA, ...match.playingTeamB];

  const bulk = allPlayers.map((playerId: any) => ({
    playerId,
    matchId: match._id,
    teamId: match.playingTeamA.includes(playerId)
      ? match.teamA
      : match.teamB,
  }));

  await PlayerHistory.insertMany(bulk);
};

export const getMyMatches = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const matches = await Match.find({ createdBy: userId })
      .populate("teamA", "teamname")
      .populate("teamB", "teamname")
      .sort({ createdAt: -1 });

      // console.log("USER ID:", userId);
      
    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    if (match.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Match.findByIdAndDelete(id);

    res.status(200).json({ message: "Match deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};