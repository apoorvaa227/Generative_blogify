import User from "../models/user";
import Blog from "../models/blog";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors";
import mongoose from "mongoose";

const getId = (id: string) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    throw new BadRequestError("Id is not a valid Object");
  }
};

// Get User Profile by ID
const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
 
  const { userId } = req.params;
  const matchedUsers = await User.aggregate([
    { $match: { _id: getId(userId) } },
    {
      $lookup: {
        from: "blogs",
        localField: "blogs",
        foreignField: "_id",
        as: "blogs",
      },
    },
    {
      $project: {
        name: 1,
        bio: 1,
        profileImage: 1,
        followersCount: { $size: "$followers" },
        followingCount: { $size: "$following" },
        myInterests: 1,
        createdAt: 1,
      },
    },
  ]);

  const totalCount = await Blog.countDocuments({ author: userId });
  if (matchedUsers.length == 0) throw new BadRequestError("User id is not valid or exist");
  const user = matchedUsers[0];

  return res.status(StatusCodes.OK).json({
    data: { user, totalCount },
    success: true,
    msg: "User Fetched Successfully",
  });
};

// Search Users by Name or Email
export const searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const { query } = req.query;
  if (!query) throw new BadRequestError("Search query is required.");

  const users = await User.find({
    $or: [{ name: { $regex: query, $options: "i" } }, { email: { $regex: query, $options: "i" } }],
  }).select("name email profileImage");

  return res.status(StatusCodes.OK).json({
    data: users,
    success: true,
    msg: "Users fetched successfully",
  });
};

// Search Blogs by Title or Content
export const searchBlogs = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const { query } = req.query;
  if (!query) throw new BadRequestError("Search query is required.");

  const blogs = await Blog.find({
    $or: [{ title: { $regex: query, $options: "i" } }, { content: { $regex: query, $options: "i" } }],
  }).select("title author createdAt");

  return res.status(StatusCodes.OK).json({
    data: blogs,
    success: true,
    msg: "Blogs fetched successfully",
  });
};

// export { searchUsers, searchBlogs };
export default { getUserProfile, getId };
// export { searchUsers, searchBlogs };
// export { getUserProfile, getId };