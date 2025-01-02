import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUser } from "../types/models";

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please provide name."],
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Please provide email."],
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email."],
    },
    password: {
      type: String,
      minlength: 8,
    },
    bio: { type: String, maxlength: 150 },
    profileImage: {
      type: String,
      default: "https://default.image.url",
    },
    blogs: [{ type: Schema.Types.ObjectId, ref: "Blog" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "inactive",
    },
    otp: {
      value: String,
      expires: Date,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.generateToken = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });
};

const User = model<IUser>("User", UserSchema);
export default User;
