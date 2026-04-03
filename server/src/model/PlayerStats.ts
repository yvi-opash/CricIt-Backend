import mongoose, { Schema, Document, Types } from "mongoose";


export interface IPlayerStats extends Document {
  matchId: Types.ObjectId;
  inningsId: Types.ObjectId;
  playerId: Types.ObjectId;
  teamId: Types.ObjectId;

  // Batsman 
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number; // runsScored / ballsFaced * 100

  // Bowler
  wicketsTaken: number;
  runsGiven: number;
  oversCompleted: number;
  ballsBowled: number;
  economy: number; 
  maidens: number; 

  createdAt: Date;
  updatedAt: Date;
}

const PlayerStatsSchema = new Schema<IPlayerStats>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    inningsId: {
      type: Schema.Types.ObjectId,
      ref: "Innings",
      required: true,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    // ------------- Batsman 
    runsScored: {
      type: Number,
      default: 0,
    },
    ballsFaced: {
      type: Number,
      default: 0,
    },
    fours: {
      type: Number,
      default: 0,
    },
    sixes: {
      type: Number,
      default: 0,
    },
    strikeRate: {
      type: Number,
      default: 0,
    },

    // -------- Bowler 
    wicketsTaken: {
      type: Number,
      default: 0,
    },
    runsGiven: {
      type: Number,
      default: 0,
    },
    oversCompleted: {
      type: Number,
      default: 0,
    },
    ballsBowled: {
      type: Number,
      default: 0,
    },
    economy: {
      type: Number,
      default: 0,
    },
    maidens: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index
PlayerStatsSchema.index({ matchId: 1, playerId: 1 });
PlayerStatsSchema.index({ playerId: 1 });
PlayerStatsSchema.index({ teamId: 1 });

const PlayerStats = mongoose.model<IPlayerStats>("PlayerStats", PlayerStatsSchema);
export default PlayerStats;