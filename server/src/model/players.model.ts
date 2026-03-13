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