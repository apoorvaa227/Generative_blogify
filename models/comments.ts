import { Schema, model } from "mongoose";
import { IComment } from "../types/models";

const CommentSchema = new Schema<IComment>(
  {
    message: {
      type: String,
      required: [true, "Please provide a message."],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide author."],
    },
  },
  { timestamps: true }
);

const Comment = model<IComment>("Comment", CommentSchema);
export default Comment;
