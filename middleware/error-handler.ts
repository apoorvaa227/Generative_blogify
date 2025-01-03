
import { CustomAPIError } from "../errors"
import { StatusCodes } from "http-status-codes"
import { Request, Response, NextFunction } from "express"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import multer from "multer"

const multerErrorMessages: { [key: string]: string } = {
  "LIMIT_PART_COUNT": "Too many parts",
  "LIMIT_FILE_SIZE": "File too large",
  "LIMIT_FILE_COUNT": "Too many files",
  "LIMIT_FIELD_KEY": "Field name too long",
  "LIMIT_FIELD_VALUE": "Field value too long",
  "LIMIT_FIELD_COUNT": "Too many fields",
  "LIMIT_UNEXPECTED_FILE": "Unexpected field"
}

const errorHandlerMiddleware = (
  err: Error | CustomAPIError | mongoose.Error | multer.Multer,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.NODE_ENV === "development") console.error("ERROR: " + (err as Error).message)

  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ success: false, msg: err.message })
  }

  if (err instanceof jwt.JsonWebTokenError) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, msg: "Session Expired. Please login again." })
    }
    return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, msg: "Not authorized" })
  }

  if (err instanceof mongoose.Error) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, msg: `No item found with id : ${err.value}` })
    }

    if (err instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(err.errors).map((item) => item.message).join("\n")
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, msg: messages })
    }
  }

  if (err instanceof multer.MulterError) {
    const errorCode = err.code
    const errorMessage = multerErrorMessages[errorCode] || "Unknown Multer error"
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, msg: errorMessage })
  }

  console.log(err)
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: "Something went wrong" })
}

export default errorHandlerMiddleware
