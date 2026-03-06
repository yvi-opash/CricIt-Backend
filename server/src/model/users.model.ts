import mongoose from "mongoose";

export interface IUser extends Document {
  username: string;
  age: number;
  email: string;
  phone: string;
  password: string;
}

const userSchema = new mongoose.Schema<IUser>({
  username: { type: String, required: true },
  age: { type: Number, required: true },
  email: { type: String, required: true, unique: true },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: { type: String, required: true },
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
