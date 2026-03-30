import multer from 'multer';
import { AppError } from './errorHandler.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB — Sharp will compress before Cloudinary upload
const MAX_FILES = 5;                     // Max 5 fridge images per upload session

/**
 * Use memory storage so we can:
 * 1. Pass the buffer to Sharp for compression/resizing
 * 2. Then pipe the compressed buffer to Cloudinary
 *
 * Do NOT use disk storage — stateless deploys (Railway, Render) have ephemeral filesystems.
 */
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Unsupported file type '${file.mimetype}'. Upload JPEG, PNG, WEBP, or HEIC.`,
        415
      ),
      false
    );
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

/**
 * Handles Multer-specific errors and passes others to global handler.
 * Must be used as a second middleware AFTER uploadMiddleware.
 */
export const handleMulterError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: `Too many files. Maximum ${MAX_FILES} images per upload.`,
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};
