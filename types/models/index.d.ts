
import { Schema, Types, Model } from "mongoose";

export interface IBlog {
  title: string;
  description: string;
  content: string;
  img?: string;
  author: Schema.Types.ObjectId;  // Jo author hai, wo ek ObjectId reference hai "User" collection ka
  tags: Types.Array<string>;
  views: number;
  likes: Types.Array<Types.ObjectId>;  // Jo likes hain, wo ObjectId references hain "User" collection ke
  likesCount: number;
  comments: Types.Array<Schema.Types.ObjectId>;  // Comments bhi ObjectId references hain "Comment" collection ke
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment {
  message: string;
  author: Types.ObjectId;  // Author ka ObjectId jo "User" se related hai
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OTP {
  value: string;
  expires: Date;
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  bio?: string;
  profileImage: string;
  blogs: Types.Array<Schema.Types.ObjectId>;  // Jo blogs hain, wo "Blog" collection ke references hain
  myInterests: Types.Array<string>;
  readArticles: Types.Array<Schema.Types.ObjectId>;  // Jo read articles hain, wo "Blog" ke references hain
  following: Types.Array<Types.ObjectId>;  // Ye "User" ke references hain
  followers: Types.Array<Types.ObjectId>;  // Ye bhi "User" ke references hain
  createdAt: Date;
  updatedAt: Date;
  status: string;
  otp: OTP | undefined;  // OTP object ho sakta hai ya undefined
  myAssests: Types.Array<string>;
  generateToken: () => string;  // Token generate karne ka method
  comparePassword: (pswrd: string) => boolean;  // Password compare karne ka method
}
