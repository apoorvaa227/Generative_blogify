
import { Response, Request } from "express";
import mongoose from "mongoose";

export interface UserPayload {
  userId: mongoose.Types.ObjectId;
}

declare global {
  namespace Express {
    export interface Request {
      user: UserPayload;  // Ye custom field hai jo Express ke Request object mein add ki ja rahi hai
      pagination: { 
        skip: number;
        limit: number;
        page: number;
      };
    }
  }
}
