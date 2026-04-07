import mongoose, { Schema, Types } from "mongoose";

const playerHistorySchema = new Schema({
  playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
  matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true },
  teamId: { type: Schema.Types.ObjectId, ref: "Team" },

 
  battingRuns: { type: Number, default: 0 },
  battingBalls: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  isOut: { type: Boolean, default: false },
  outType: { type: String },

 
  bowlingBalls: { type: Number, default: 0 },
  bowlingOvers: { type: Number, default: 0 },
  runsConceded: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },


  catches: { type: Number, default: 0 },
  runOuts: { type: Number, default: 0 },

}, { timestamps: true });

const playerHistory = mongoose.model("playerHistory", playerHistorySchema);
export default playerHistory;