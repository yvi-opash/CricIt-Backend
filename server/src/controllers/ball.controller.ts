import Match, { MatchStatus } from "../model/match.model";
import Inning from "../model/inning.model";
import Ball from "../model/ball.model";
import { Request, Response } from "express";
import PlayerHistory from "../model/playerHistory.model";

import { io } from "../server";


export const addBall = async (req: Request, res: Response) => {
  try {
    const { matchId, inningId } = req.params;

    const {
      runsScored = 0,
      extraType = null,
      extraRuns = 0,
      isWicket = false,
      wicketType,
      outPlayer,
      newBatsman,
      bowler,
    } = req.body;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "Match not found" });

    if (match.status !== MatchStatus.LIVE)
      return res.status(400).json({ message: "Match not live" });

    const inning = await Inning.findById(inningId);
    if (!inning) return res.status(404).json({ message: "Inning not found" });

    if (inning.status === "completed")
      return res.status(400).json({ message: "Inning already completed" });

    //  legal delivery
    const isLegalDelivery =
      !extraType || (extraType !== "wide" && extraType !== "no-ball");

    //  ball
    const ball = await Ball.create({
      matchId,
      inningsId: inningId,
      overNumber: inning.oversCompleted,
      ballNumber: inning.ballsInCurrentOver,
      batsman: inning.striker,
      bowler: bowler || inning.currentBowler,
      runsScored,
      extraType,
      extraRuns,
      isLegalDelivery,
      isWicket,
      wicketType,
      outPlayer,
    });

    // 🟢 BATSMAN UPDATE
await PlayerHistory.findOneAndUpdate(
  { playerId: inning.striker, matchId },
  {
    $inc: {
      battingRuns: runsScored,
      battingBalls: isLegalDelivery ? 1 : 0,
      fours: runsScored === 4 ? 1 : 0,
      sixes: runsScored === 6 ? 1 : 0,
    },
  },
   { upsert: true, new: true }
);

// 🔵 BOWLER UPDATE
await PlayerHistory.findOneAndUpdate(
  { playerId: bowler || inning.currentBowler, matchId },
  {
    $inc: {
      runsConceded: runsScored + extraRuns,
      bowlingBalls: isLegalDelivery ? 1 : 0,
      wickets: isWicket ? 1 : 0,
    },
  },
   { upsert: true, new: true }
);

// 🔴 WICKET UPDATE (BATSMAN OUT)
if (isWicket && outPlayer) {
  await PlayerHistory.findOneAndUpdate(
    { playerId: outPlayer, matchId },
    {
      isOut: true,
      outType: wicketType,
    }
  );
}

// 🟡 OVER UPDATE
if (isLegalDelivery && inning.ballsInCurrentOver === 6) {
  await PlayerHistory.findOneAndUpdate(
    { playerId: bowler || inning.currentBowler, matchId },
    {
      $inc: { bowlingOvers: 1 },
    }
  );
}

   
    //  runs
    inning.totalRuns += runsScored + extraRuns;

    //  wicket
    if (isWicket) {
      inning.totalWickets++;

      if (newBatsman) {
        if (outPlayer.toString() === inning.striker.toString()) {
          inning.striker = newBatsman;
        } else {
          inning.nonStriker = newBatsman;
        }
      }
    }

    // ball count
    if (isLegalDelivery) {
      inning.ballsInCurrentOver++;

      if (inning.ballsInCurrentOver === 6) {
        inning.oversCompleted++;
        inning.ballsInCurrentOver = 0;

        // Over end strike change
        const temp = inning.striker;
        inning.striker = inning.nonStriker;
        inning.nonStriker = temp;
      }
    }

    // strike Rotate
    if (runsScored % 2 === 1) {
      const temp = inning.striker;
      inning.striker = inning.nonStriker;
      inning.nonStriker = temp;
    }

    //all Out
    // if (inning.totalWickets === match.playingTeamA.length) {
    //   inning.status = "completed";
    //   inning.resultType = "all-out";
    // }

    const battingTeamSize = inning.battingTeam.equals(match.teamA)
      ? match.playingTeamA.length
      : match.playingTeamB.length;

    if (inning.totalWickets >= battingTeamSize - 1) {
      inning.status = "completed";
      inning.resultType = "all-out";
    }

    // Over finish
    if (inning.oversCompleted === match.totalOverInMatch) {
      inning.status = "completed";
      inning.resultType = "overs-completed";
    }

    // target chase
    // if (inning.inningNumber === 2 && inning.totalRuns >= (inning.target || 0)) {
    //   inning.status = "completed";
    //   inning.resultType = "chased";
    //   match.status = MatchStatus.FINISHED;
    // }

    if (inning.inningNumber === 2) {
      if (inning.totalRuns >= (inning.target || 0)) {
        inning.status = "completed";

        await inning.save();

        await Match.findByIdAndUpdate(inning.matchId, {
          status: "completed",
        });
      }
    }

    await inning.save();
    await match.save();



io.emit("scoreUpdate")

    res.status(201).json({
      message: "Ball added",
      inning,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const undoLastBall = async (req: Request, res: Response) => {
  try {
    const { inningId } = req.params;

    const lastBall = await Ball.findOne({ inningsId: inningId }).sort({
      createdAt: -1,
    });

    if (!lastBall) return res.status(404).json({ message: "No ball to undo" });

    const inning = await Inning.findById(inningId);
    if (!inning) return res.status(404).json({ message: "Inning not found" });

    inning.totalRuns -= lastBall.runsScored + (lastBall.extraRuns || 0);

    if (lastBall.isWicket) inning.totalWickets--;

    if (lastBall.isLegalDelivery) {
      if (inning.ballsInCurrentOver === 0) {
        inning.oversCompleted--;
        inning.ballsInCurrentOver = 5;
      } else {
        inning.ballsInCurrentOver--;
      }
    }

    await inning.save();
    await Ball.findByIdAndDelete(lastBall._id);

    res.json({ message: "Last ball undone", inning });
  } catch (error) {
    res.status(500).json({ message: "Error", error });
  }
};

export const getCurrentScore = async (req: Request, res: Response) => {
  const inning = await Inning.findById(req.params.inningId);

  res.json({
    runs: inning?.totalRuns,
    wickets: inning?.totalWickets,
    overs: `${inning?.oversCompleted}.${inning?.ballsInCurrentOver}`,
  });
};

export const getBallsByOver = async (req: Request, res: Response) => {
  const balls = await Ball.find({ inningsId: req.params.inningId }).sort({
    overNumber: 1,
    ballNumber: 1,
  });

  res.json(balls);
};

export const getCommentary = async (req: Request, res: Response) => {
  const balls = await Ball.find({ inningsId: req.params.inningId })
    .sort({ createdAt: -1 })
    .populate("batsman bowler");

  const commentary = balls.map((b) => {
    let result = "";

    if (b.isWicket) result = "WICKET";
    else if (b.runsScored === 4) result = "FOUR";
    else if (b.runsScored === 6) result = "SIX";
    else if (b.extraType) result = b.extraType;
    else result = `${b.runsScored} run`;

    return `Over ${b.overNumber}.${b.ballNumber + 1} - ${result}`;
  });

  res.json(commentary);
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
    res.status(500).json({ message: "Server error" });
  }
};

// import Match, { MatchStatus } from "../model/match.model";
// import Inning from "../model/inning.model";
// import Ball from "../model/ball.model";
// import { Request, Response } from "express";

// export const addBall = async (req: Request, res: Response) => {
//   try {
//     const { matchId, Id } = req.params;
//     const {
//       runsScored = 0,
//       extraRuns = 0,
//       isWicket = false,
//       extraType,
//       wicketType,
//       outPlayer,
//       batsman,
//       bowler,
//     } = req.body;

//     const match = await Match.findById(matchId);
//     if (!match) return res.status(404).json({ message: "Match not found..." });
//     if (match.status !== MatchStatus.LIVE)
//       return res.status(400).json({ message: "Match is not live!!!!!!!!!!!!" });

//     const inning = await Inning.findById(Id);
//     if (!inning)
//       return res.status(404).json({ message: "inning not found...." });
//     if (inning.status == "completed")
//       return res.status(400).json({ message: "match is compleated...." });

//     const overNumber = inning.oversCompleted;
//     const ballNumber = inning.ballsInCurrentOver;

//     const ball = await new Ball({
//       matchId,
//       inningsId: Id,
//       batsman: batsman || inning.striker,
//       bowler: bowler || inning.currentBowler,
//       runsScored,
//       extraType,
//       wicketType,
//       overNumber,
//       ballNumber,
//     });

//     inning.totalRuns += runsScored + extraRuns;

//     const isLegalDelivery =
//       !extraType || (extraType !== "wide" && extraType !== "no-ball");

//     if (isLegalDelivery) {
//       inning.ballsInCurrentOver++;

//       if (inning.ballsInCurrentOver === 6) {
//         inning.oversCompleted++;
//         inning.ballsInCurrentOver = 0;
//       }
//     }

//     if (isWicket) {
//       inning.totalWickets++;
//     }

//     if (inning.totalWickets === 10) {
//       inning.status = "completed";
//       inning.resultType = "all-out";
//     }

//     if (runsScored % 2 !== 0) {
//       [inning.striker, inning.nonStriker] = [inning.nonStriker, inning.striker];
//     }

//     if (isLegalDelivery && inning.ballsInCurrentOver === 0) {
//       [inning.striker, inning.nonStriker] = [inning.nonStriker, inning.striker];
//     }

//     await inning.save();

//     res.status(201).json({ message: "Ball added successfully", ball, inning });
//   } catch (error) {
//     res.status(400).json({ message: "server error", error });
//   }
// };

// export const getBallsByOver = async (req: Request, res: Response) => {
//   try {
//     const { inningsId } = req.params;

//     const balls = await Ball.find({ inningsId })
//       .sort({ overNumber: 1, ballNumber: 1 })
//       .populate("batsman bowler");

//     res.status(200).json({ balls });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching balls", error });
//   }
// };

// export const getCurrentScore = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     const inning = await Inning.findById(id);
//     if (!inning) return res.status(404).json({ message: "Innings not found" });

//     const overs = `${inning.oversCompleted}.${inning.ballsInCurrentOver}`;

//     res.status(200).json({
//       runs: inning.totalRuns,
//       wickets: inning.totalWickets,
//       overs,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching score", error });
//   }
// };

// export const undoLastBall = async (req: Request, res: Response) => {
//   try {
//     const { inningsId } = req.params;

//     const lastBall = await Ball.findOne({ inningsId }).sort({ createdAt: -1 });
//     if (!lastBall) return res.status(404).json({ message: "No ball to undo" });

//     const inning = await Inning.findById(inningsId);
//     if (!inning) return res.status(404).json({ message: "Innings not found" });

//     // Reverse score impact
//     inning.totalRuns -= lastBall.runsScored + (lastBall.extraType ? 1 : 0);

//     if (lastBall.wicketType) {
//       inning.totalWickets--;
//     }

//     const wasLegal =
//       !lastBall.extraType ||
//       (lastBall.extraType !== "wide" && lastBall.extraType !== "no-ball");
//     if (wasLegal) {
//       if (inning.ballsInCurrentOver === 0) {
//         inning.oversCompleted--;
//         inning.ballsInCurrentOver = 5;
//       } else {
//         inning.ballsInCurrentOver--;
//       }
//     }

//     await inning.save();
//     await Ball.findByIdAndDelete(lastBall._id);

//     res.status(200).json({ message: "Ball undone successfully", inning });
//   } catch (error) {
//     res.status(500).json({ message: "Error undoing ball", error });
//   }
// };

// export const getCommentary = async (req: Request, res: Response) => {
//   try {
//     const { inningsId } = req.params;

//     const balls = await Ball.find({ inningsId })
//       .sort({ overNumber: -1, ballNumber: -1 })
//       .populate("batsman bowler");

//     const commentary = balls.map((ball) => {
//       const over = `${ball.overNumber}.${ball.ballNumber}`;
//       const batsman = (ball.batsman as any)?.name || "Unknown";
//       const bowler = (ball.bowler as any)?.name || "Unknown";
//       let result = "";

//       if (ball.wicketType) result = "WICKET";
//       else if (ball.runsScored === 6) result = "SIX";
//       else if (ball.runsScored === 4) result = "FOUR";
//       else if (ball.extraType) result = ball.extraType.toUpperCase();
//       else result = `${ball.runsScored} run${ball.runsScored !== 1 ? "s" : ""}`;

//       return `Over ${over} - ${bowler} to ${batsman} - ${result}`;
//     });

//     res.status(200).json({ commentary });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching commentary", error });
//   }
// };
