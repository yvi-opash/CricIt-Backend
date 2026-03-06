import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInnings extends Document {
  matchId: Types.ObjectId;

  
  inningNumber: 1 | 2;
  battingTeam: Types.ObjectId;
  bowlingTeam: Types.ObjectId;

  
  totalRuns: number;
  totalWickets: number;
  oversCompleted: number;
  ballsInCurrentOver: number; 
  extras: number;
 

  
  striker: Types.ObjectId;
  nonStriker: Types.ObjectId;


  currentBowler: Types.ObjectId;
  previousBowler?: Types.ObjectId;

 
  target?: number; 
  status: "ongoing" | "completed";
  resultType?: "normal" | "all-out" | "overs-completed" | "chased";

  createdAt: Date;
  updatedAt: Date;
}

const InningsSchema = new Schema<IInnings>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },

    inningNumber: {
      type: Number,
      enum: [1, 2],
      required: true,
    },

    battingTeam: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    bowlingTeam: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

  
    totalRuns: {
      type: Number,
      default: 0,
    },

    totalWickets: {
      type: Number,
      default: 0,
    },

    oversCompleted: {
      type: Number,
      default: 0,
    },

    ballsInCurrentOver: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    extras: {
      type: Number,
      default: 0,
    },
 

    
    striker: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    nonStriker: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    
    currentBowler: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    previousBowler: {
      type: Schema.Types.ObjectId,
      ref: "Player",
    },

    
    target: {
      type: Number,
    },

    status: {
      type: String,
      enum: ["ongoing", "completed"],
      default: "ongoing",
    },

    resultType: {
      type: String,
      enum: ["normal", "all-out", "overs-completed", "chased"],
    },
  },
  {
    timestamps: true,
  }
);

const Inning = mongoose.model<IInnings>("Innings", InningsSchema);
export default Inning;