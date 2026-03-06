// import mongoose, { Document, Schema, Types } from "mongoose";

// export enum MatchStatus {
//   UPCOMING = "upcoming",
//   TOSS = "toss",
//   LIVE = "live",
//   FINISHED = "finished",
//   ABANDONED = "abandoned",
// }

// export interface IMatch extends Document {
//   teamA: Types.ObjectId;
//   teamB: Types.ObjectId;
//   status: MatchStatus;
//   createdBy: Types.ObjectId;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const matchSchema = new Schema<IMatch>(
//   {
//     teamA: {
//       type: Schema.Types.ObjectId,
//       ref: "Team",
//       required: true,
//     },
//     teamB: {
//       type: Schema.Types.ObjectId,
//       ref: "Team",
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: Object.values(MatchStatus),
//       default: MatchStatus.UPCOMING,
//     },
//     createdBy: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );




// const Match = mongoose.model<IMatch>("Match", matchSchema);
// export default Match;


import mongoose, { Schema, Types, HydratedDocument } from "mongoose";

export enum MatchStatus {
  UPCOMING = "upcoming",
  TOSS = "toss",
  LIVE = "live",
  INNINGS_BREAK = "innings_break",
  FINISHED = "finished",
  ABANDONED = "abandoned",
}

export enum MatchType {
  T20 = "t20",
  ODI = "odi",
  BOX = "box-cricket",
}

export enum TossDecision {
  BAT = "bat",
  BOWL = "bowl",
}

interface IScore {
  runs: number;
  wickets: number;
  overs: number;
}

export interface IMatch {
  teamA: Types.ObjectId;
  teamB: Types.ObjectId;

  matchType: MatchType;
  venue: string;
  matchDate: Date;

  playingTeamA: Types.ObjectId[];
  playingTeamB: Types.ObjectId[];

  status: MatchStatus;

  tossWinner?: Types.ObjectId;
  tossDecision?: TossDecision;

  teamAScore?: IScore;
  teamBScore?: IScore;

  winner?: Types.ObjectId;

  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export type MatchDocument = HydratedDocument<IMatch>;

const scoreSchema = new Schema<IScore>(
  {
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
  },
  { _id: false }
);

const matchSchema = new Schema<IMatch>(
  {
    teamA: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    teamB: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },


     playingTeamA: [
      {
        type: Schema.Types.ObjectId,
        ref: "Player",
      },
    ],

    playingTeamB: [
      {
        type: Schema.Types.ObjectId,
        ref: "Player",
      },
    ],

    matchType: {
      type: String,
      enum: Object.values(MatchType),
      // required: true,
    },

    venue: {
      type: String,
      // required: true,
      trim: true,
    },

    matchDate: {
      type: Date,
    //   required: true,
     },

    status: {
      type: String,
      enum: Object.values(MatchStatus),
      default: MatchStatus.UPCOMING,
    },

    tossWinner: {
      type: Schema.Types.ObjectId,
      ref: "Team",
    },

    tossDecision: {
      type: String,
      enum: Object.values(TossDecision),
    },

    teamAScore: scoreSchema,
    teamBScore: scoreSchema,

    winner: {
      type: Schema.Types.ObjectId,
      ref: "Team",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);


matchSchema.pre("save", async function () {
  if (this.teamA.equals(this.teamB)) {
    throw new Error("Team A and Team B cannot be the same");
  }
});

matchSchema.pre("save", async function () {
  if (this.status === MatchStatus.FINISHED && !this.winner) {
    throw new Error("Winner must be set when match is finished");
  }

  if (this.status !== MatchStatus.FINISHED && this.winner) {
    throw new Error("Winner can only be set when match is finished");
  }
});


matchSchema.pre("save", function () {
  if (this.tossWinner) {
    if (
      !this.tossWinner.equals(this.teamA) &&
      !this.tossWinner.equals(this.teamB)
    ) {
      throw new Error("Toss winner must be either Team A or Team B");
    }
  }
});


matchSchema.index({ status: 1 });
matchSchema.index({ matchDate: 1 });
matchSchema.index({ teamA: 1, teamB: 1 });

const Match = mongoose.model<IMatch>("Match", matchSchema);
export default Match;
