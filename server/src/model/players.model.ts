import mongoose, { Schema, Document, Types } from "mongoose";

export type PlayerRole = "batsman" | "bowler" | "all-rounder";

export type Tag = "Player" | "Captain" | "Wise-Captain" | "wicket-keeper";

export interface IPlayers extends Document {
  playername: string;
  role: PlayerRole;
  tags: Tag;
  teamId: Types.ObjectId;
  createdBy: Types.ObjectId;
}

const playerSchema = new Schema<IPlayers>(
  {
    playername: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["batsman", "bowler", "all-rounder"],
      required: true,
    },
    tags: {
      type: String,
      enum: ["Player", "Captain", "Wise-Captain", "wicket-keeper"],
      default: "Player",
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPlayers>("Player", playerSchema);


// import mongoose from "mongoose";

// export type PlayerRole = "batsman" | "bowler" | "all-rounder";

// export type Tag = "Player" | "Captain" | "Wise-Captain" | "wicket-keeper";


// // ✅ FIXED: Added missing fields
// interface ICareerStats {
//   // Batsman stats
//   totalRuns: number;
//   totalBallsFaced: number;        // ✅ Added
//   totalFours: number;              // Optional but good to track
//   totalSixes: number;              // Optional but good to track
//   careerStrikeRate: number;

//   // Bowler stats
//   totalWickets: number;
//   totalRunsGiven: number;           // ✅ Added
//   totalOversBowled: number;         // ✅ Added
//   careerEconomy: number;
//   totalMaidens: number;             // Optional but good to track

//   // General
//   totalMatches: number;
//   lastUpdated: Date;
// }

// export interface IPlayers extends Document {
//   playername: string;
//   role: PlayerRole;
//   tags: Tag;
//   createdBy: mongoose.Types.ObjectId;
  
//   careerStats: ICareerStats;
  
//   createdAt: Date;
//   updatedAt: Date;
// }

// const careerStatsSchema = new mongoose.Schema<ICareerStats>(
//   {
//     // Batsman stats
//     totalRuns: {
//       type: Number,
//       default: 0,
//     },
//     totalBallsFaced: {
//       type: Number,
//       default: 0,
//     },
//     totalFours: {
//       type: Number,
//       default: 0,
//     },
//     totalSixes: {
//       type: Number,
//       default: 0,
//     },
//     careerStrikeRate: {
//       type: Number,
//       default: 0,
//     },

//     // Bowler stats
//     totalWickets: {
//       type: Number,
//       default: 0,
//     },
//     totalRunsGiven: {
//       type: Number,
//       default: 0,
//     },
//     totalOversBowled: {
//       type: Number,
//       default: 0,
//     },
//     careerEconomy: {
//       type: Number,
//       default: 0,
//     },
//     totalMaidens: {
//       type: Number,
//       default: 0,
//     },

//     // General
//     totalMatches: {
//       type: Number,
//       default: 0,
//     },
//     lastUpdated: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   { _id: false }
// );

// const playerSchema = new mongoose.Schema<IPlayers>(
//   {
//     playername: {
//       type: String,
//       required: true,
//     },
//     role: {
//       type: String,
//       enum: ["batsman", "bowler", "all-rounder"],
//       required: true,
//     },
//     tags: {
//       type: String,
//       enum: ["Player", "Captain", "Wise-Captain", "wicket-keeper"],
//       default: "Player",
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     careerStats: {
//       type: careerStatsSchema,
//       default: () => ({}),
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const Players = mongoose.model<IPlayers>("Player", playerSchema);
// export default Players;