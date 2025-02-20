import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload Profile Image
const uploadProfileImage = (req: Express.Request): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!req.file) return reject(new Error("File is not provided"));

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `blogmind/${req.user.userId}`,
        public_id: "profile",
        overwrite: true,
        format: "webp",
        invalidate: true,
        width: 400,
        height: 400,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || "");
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  });
};

// Delete Profile Image
const deleteProfileImage = async (userId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(`blogmind/${userId}/profile`, { invalidate: true });
    return result.result === "ok";
  } catch (error) {
    console.error("Error deleting profile image:", error);
    return false;
  }
};

// Upload Multiple Asset Images
const uploadAssetsImages = async (files: Express.Multer.File[]): Promise<string[]> => {
  const uploadPromises = files.map((file) =>
    new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "blogmind/assets",
          format: "webp",
          invalidate: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result?.secure_url || "");
        }
      );

      streamifier.createReadStream(file.buffer).pipe(stream);
    })
  );

  return Promise.all(uploadPromises);
};

// Delete Asset Image
const deleteAssetImages = async (public_id: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(public_id, { invalidate: true });
    return result.result === "ok";
  } catch (error) {
    console.error("Error deleting asset image:", error);
    return false;
  }
};

// ✅ Ensure All Functions Are Exported
export { uploadProfileImage, deleteProfileImage, uploadAssetsImages, deleteAssetImages };
