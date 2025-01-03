import multer, { MulterError } from "multer";
import { Request } from "express";

// Allowed File Types
const allowedFileTypes = ["image/jpeg", "image/png", "image/jpg"];

// File Filter Function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new MulterError("LIMIT_UNEXPECTED_FILE"));
  }
};

// Memory Storage for Files
const storage = multer.memoryStorage();

// Multer Upload Config
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4 MB limit
  },
});

export default upload;
