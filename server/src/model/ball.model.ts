import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBall extends Document {

  matchId: Types.ObjectId;
  inningsId: Types.ObjectId;

 
  overNumber: number;
  ballNumber: number;
  isLegalDelivery: boolean;

  
  batsman: Types.ObjectId;
  bowler: Types.ObjectId;

  
  runsScored: number;
  extraType?: "wide" | "no-ball" | "bye" | "leg-bye" | null;
  extraRuns?: number;

 
  isWicket: boolean;
  wicketType?: 
    | "bowled"
    | "caught"
    | "lbw"
    | "run-out"
    | "stumped"
    | "hit-wicket"
    | "retired-out";
  outPlayer?: Types.ObjectId;

  
  createdAt: Date;
  updatedAt: Date;
}

const BallSchema = new Schema<IBall>(
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

    
    overNumber: {
      type: Number,
      required: true,
      min: 0,
    },
    ballNumber: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    isLegalDelivery: {
      type: Boolean,
      required: true,
      default: true,
    },

    
    batsman: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    bowler: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    
    runsScored: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    extraType: {
      type: String,
      enum: ["wide", "no-ball", "bye", "leg-bye", null],
      default: null,
    },
    extraRuns: {
      type: Number,
      default: 0,
      min: 0,
    },

    
    isWicket: {
      type: Boolean,
      required: true,
      default: false,
    },
    wicketType: {
      type: String,
      enum: [
        "bowled",
        "caught",
        "lbw",
        "run-out",
        "stumped",
        "hit-wicket",
        "retired-out",
      ],
    },
    outPlayer: {
      type: Schema.Types.ObjectId,
      ref: "Player",
    },
  },
  {
    timestamps: true,
  }
);


BallSchema.pre("validate", function () {
  if (this.isWicket) {
    if (!this.wicketType || !this.outPlayer) {
      throw new Error(
        "wicketType and outPlayer are required when isWicket is true"
      );
    }
  }
});

export default mongoose.model<IBall>("Ball", BallSchema);