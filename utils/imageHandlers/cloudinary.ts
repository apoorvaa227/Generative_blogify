import { Request } from "express";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload Profile Image
const uploadProfileImage = async (req: Request): Promise<string> => {
  const result = await cloudinary.uploader.upload(
    `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
    {
      folder: `blogmind/${req.user.userId}`,
      public_id: "profile",
      overwrite: true,
      format: "webp",
      invalidate: true,
      width: 400,
      height: 400,
    }
  );
  return result.secure_url;
};

// Delete Profile Image
const deleteProfileImage = async (userId: string): Promise<boolean> => {
  const result = await cloudinary.uploader.destroy(
    `blogmind/${userId}/profile`,
    { invalidate: true }
  );
  return result.result === "ok";
};

export { uploadProfileImage, deleteProfileImage };
