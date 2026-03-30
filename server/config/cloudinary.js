import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS URLs
});

/**
 * Upload a buffer (processed by Sharp) to Cloudinary.
 * Returns the secure URL and public_id for storage in MongoDB.
 *
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Cloudinary folder path
 * @param {string} publicId - Optional explicit public_id
 * @returns {Promise<{ url: string, publicId: string, width: number, height: number }>}
 */
export const uploadToCloudinary = (buffer, folder, publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder || process.env.CLOUDINARY_UPLOAD_FOLDER,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' }, // Smart compression
        { fetch_format: 'auto' }, // Serve WebP/AVIF to supporting browsers
      ],
    };

    if (publicId) uploadOptions.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload failed: ${error.message}`);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          });
        }
      }
    );

    stream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary by its public_id.
 * Called when a user removes an uploaded image.
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Cloudinary delete: ${publicId} → ${result.result}`);
    return result;
  } catch (error) {
    logger.error(`Cloudinary delete failed for ${publicId}: ${error.message}`);
    throw error;
  }
};

/**
 * Generate a thumbnail URL from an existing Cloudinary public_id.
 * Uses Cloudinary's on-the-fly transformation — no extra upload needed.
 */
export const getThumbnailUrl = (publicId, width = 400, height = 300) => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
    secure: true,
  });
};

export default cloudinary;
