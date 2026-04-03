// import { Request, Response } from "express";
// import PlayerStats from "../model/PlayerStats";
// import Players from "../model/players.model";

// // When match ends, update player career stats in Player model
// export const updatePlayerCareerStatsSimple = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const { matchId } = req.body;

//     // Get all player stats from the match
//     const allStats = await PlayerStats.find({ matchId });

//     // Update each player's career stats in Player model
//     for (const stat of allStats) {
//       const player = await Players.findById(stat.playerId);

//       if (player) {
//         // Add to career totals
//         player.careerStats.totalRuns += stat.runsScored;
//         player.careerStats.totalWickets += stat.wicketsTaken;
//         player.careerStats.totalMatches += 1;

//         // Recalculate career averages
//         if (player.careerStats.totalBallsFaced > 0) {
//           player.careerStats.careerStrikeRate =
//             (player.careerStats.totalRuns / player.careerStats.totalBallsFaced) *
//             100;
//         }

//         if (player.careerStats.totalOversBowled > 0) {
//           player.careerStats.careerEconomy =
//             player.careerStats.totalRunsGiven /
//             player.careerStats.totalOversBowled;
//         }

//         player.careerStats.lastUpdated = new Date();
//         await player.save();
//       }
//     }

//     res.status(200).json({
//       message: "All player career stats updated",
//     });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Get player quick stats (from Player model)
// export const getPlayerQuickStats = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const { playerId } = req.params;

//     const player = await Players.findById(playerId).select(
//       "playername role careerStats"
//     );

//     if (!player) {
//       return res.status(404).json({ error: "Player not found" });
//     }

//     res.status(200).json({
//       message: "Player quick stats fetched",
//       data: {
//         playerId: player._id,
//         playername: player.playername,
//         role: player.role,
//         careerStats: player.careerStats,
//       },
//     });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Get detailed match performance (from PlayerStats collection)
// export const getPlayerMatchDetails = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const { playerId, matchId } = req.params;

//     const matchStats = await PlayerStats.findOne({
//       playerId,
//       matchId,
//     })
//       .populate("playerId", "playername role")
//       .populate("matchId", "matchDate venue teamA teamB");

//     if (!matchStats) {
//       return res.status(404).json({ error: "Match stats not found" });
//     }

//     res.status(200).json({
//       message: "Player match details fetched",
//       data: matchStats,
//     });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Get all matches where player played
// export const getPlayerAllMatches = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const { playerId } = req.params;

//     const allMatches = await PlayerStats.find({ playerId })
//       .populate("matchId", "matchDate venue teamA teamB")
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       message: "All matches of player fetched",
//       count: allMatches.length,
//       data: allMatches,
//     });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };