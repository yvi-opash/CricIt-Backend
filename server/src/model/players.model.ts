// import mongoose, { Schema, Document, Types } from "mongoose";

// export type PlayerRole = "batsman" | "bowler" | "all-rounder";

// export type Tag = "Player" | "Captain" | "Wise-Captain" | "wicket-keeper";

// export interface IPlayers extends Document {
//   playername: string;
//   role: PlayerRole;
//   tags: Tag;
//   teamId: Types.ObjectId;
//   createdBy: Types.ObjectId;
// }

// const playerSchema = new Schema<IPlayers>(
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
//     teamId: {
//       type: Schema.Types.ObjectId,
//       ref: "Team",
//       required: true,
//     },
//     createdBy: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model<IPlayers>("Player", playerSchema);


import mongoose from "mongoose";

export type PlayerRole = "batsman" | "bowler" | "all-rounder";

export type Tag = "Player" | "Captain" | "Wise-Captain" | "wicket-keeper";


interface ICareerStats {
  totalRuns: number;
  totalWickets: number;
  totalMatches: number;
  careerStrikeRate: number;
  careerEconomy: number;
  lastUpdated: Date;
}

export interface IPlayers extends Document {
  playername: string;
  role: PlayerRole;
  tags: Tag;
  createdBy: mongoose.Types.ObjectId;
  
 
  careerStats: ICareerStats;
  
  createdAt: Date;
  updatedAt: Date;
}

const careerStatsSchema = new mongoose.Schema<ICareerStats>(
  {
    totalRuns: {
      type: Number,
      default: 0,
    },
    totalWickets: {
      type: Number,
      default: 0,
    },
    totalMatches: {
      type: Number,
      default: 0,
    },
    careerStrikeRate: {
      type: Number,
      default: 0,
    },
    careerEconomy: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const playerSchema = new mongoose.Schema<IPlayers>(
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    careerStats: {
      type: careerStatsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

const Players = mongoose.model<IPlayers>("Player", playerSchema);
export default Players;