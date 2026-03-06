import mongoose, { Types } from "mongoose";

export interface ITeam extends Document {
  teamname: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const teamSchema = new mongoose.Schema<ITeam>(
  {
    teamname: { type: String, required: true, unique: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  },
);

const Team = mongoose.model<ITeam>("Team", teamSchema);
export default Team;
