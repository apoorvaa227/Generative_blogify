import User from "../models/user";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import { Request, Response } from "express";
import { RequestHandler } from "express";
import mongoose from "mongoose";
import {
  uploadProfileImage as cloudinaryUploadProfileImage,
  deleteProfileImage as cloudinaryDeleteProfileImage,
  uploadAssetsImages as cloudinaryUploadAssetsImages,
  deleteAssetImages as cloudinaryDeleteAssetImages,
 
} from "../utils/imageHandlers/cloudinary";












const updateUser = async (userId: mongoose.Types.ObjectId, key: string, value: any) => {
  const user = await User.findById(userId);
  if (!user) throw new UnauthenticatedError("User Not Found");
  user.set({ [key]: value });
  await user.save();
};

const updateCompleteProfile = async (req: Request, res: Response) => {
  const { name, bio, myInterests } = req.body;
  const userId = req.user.userId;
  if (!name || !bio || !myInterests)
    throw new BadRequestError("Name, Bio, or Interests are required");

  await User.findByIdAndUpdate(userId, { name, bio, myInterests });

  res.status(StatusCodes.OK).json({
    success: true,
    msg: "Profile Updated Successfully",
  });
};


const updateProfileImage = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  const userId = req.user.userId;

  if (!req.file) {
    throw new BadRequestError("Image is required");
  }

  // Delete the previous profile image from Cloudinary
  await cloudinaryDeleteProfileImage(userId.toString());

  // Upload new profile image to Cloudinary
  const cloudinary_img_url = await cloudinaryUploadProfileImage(req);

  // Update user profile image in database
  await updateUser(userId, "profileImage", cloudinary_img_url);

  res.status(StatusCodes.OK).json({
    data: { profileImage: cloudinary_img_url },
    success: true,
    msg: "Image Updated Successfully",
  });
};

const deleteProfileImage = async (req: Request, res: Response) => {
  const userId = req.user.userId;
  await cloudinaryDeleteProfileImage(userId.toString());

  const defaultProfileImage = "https://res.cloudinary.com/dzvci8arz/image/upload/v1715/default-profile.png";
  await updateUser(userId, "profileImage", defaultProfileImage);

  res.status(StatusCodes.OK).json({
    data: { profileImage: defaultProfileImage },
    success: true,
    msg: "Image Deleted Successfully",
  });
};

const getAllAssets = async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const user = await User.findById(userId).select("myAssets");
  if (!user) throw new UnauthenticatedError("User Not Found");

  res.status(StatusCodes.OK).json({
    data: { assets: user.myAssests },
    success: true,
    msg: "All Assets Fetched Successfully",
  });
};

export const uploadAssets: RequestHandler = async (req, res) => {

  const userId = req.user.userId;
  if (!req.files || req.files.length === 0)
    throw new BadRequestError("Files are required");

  const filesArray = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
  const cloudinary_img_urls = await cloudinaryUploadAssetsImages(filesArray);
  await User.findByIdAndUpdate(userId, { $push: { myAssets: { $each: cloudinary_img_urls } } });

  res.status(StatusCodes.OK).json({
    data: cloudinary_img_urls,
    success: true,
    msg: "Assets Uploaded Successfully",
  });
};

const deleteAsset = async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { assetUrl } = req.body;
  if (!assetUrl) throw new BadRequestError("Asset URL is required");

  const public_id = assetUrl.split("/").slice(-3).join("/").split(".").slice(0, -1).join(".");
  if (!public_id.includes(userId.toString()))
    throw new BadRequestError("You are not authorized to delete this asset");

  await cloudinaryDeleteAssetImages(public_id);
  await User.findByIdAndUpdate(userId, { $pull: { myAssets: assetUrl } });

  res.status(StatusCodes.OK).json({
    success: true,
    msg: "Asset Deleted Successfully",
  });
};

const followUnfollowUser = async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { followId } = req.body;
  if (!followId) throw new BadRequestError("FollowId is required");

  const user = await User.findById(userId);
  const followUser = await User.findById(followId);
  if (!user || !followUser) throw new UnauthenticatedError("User Not Found");

  const isFollowing = user.following.includes(followId);
  if (isFollowing) {
    await User.findByIdAndUpdate(userId, { $pull: { following: followId } });
    await User.findByIdAndUpdate(followId, { $pull: { followers: userId } });
  } else {
    await User.findByIdAndUpdate(userId, { $push: { following: followId } });
    await User.findByIdAndUpdate(followId, { $push: { followers: userId } });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    msg: isFollowing ? "User Unfollowed Successfully" : "User Followed Successfully",
  });
};

const isFollowing = async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { followId } = req.body;
  if (!followId) throw new BadRequestError("FollowId is required");

  const user = await User.findById(userId);
  if (!user) throw new UnauthenticatedError("User Not Found");

  const isFollowing = user.following.includes(followId);
  res.status(StatusCodes.OK).json({
    data: { isFollowing },
    success: true,
    msg: "Check Following Status Successfully",
  });
};

export {
  updateCompleteProfile,
  updateProfileImage,
  deleteProfileImage,
  getAllAssets,
 
  deleteAsset,
  followUnfollowUser,
  isFollowing,
};
