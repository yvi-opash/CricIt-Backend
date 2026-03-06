import mongoose from "mongoose";

export type PlayerRole = "batsman" | "bowler" | "all-rounder";

export type Tag = "Player" | "Captain" | "Wise-Captain" | "wicket-keeper";

export interface IPlayers extends Document {
  playername: string;
  role: PlayerRole;
  tags: Tag;
  teamId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

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
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Players = mongoose.model<IPlayers>("Player", playerSchema);
export default Players;
