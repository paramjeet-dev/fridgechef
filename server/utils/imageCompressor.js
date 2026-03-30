import sharp from 'sharp';
import logger from '../utils/logger.js';

const MAX_DIMENSION = 1200; // px — enough for FatSecret recognition, low payload size
const JPEG_QUALITY = 82;    // Good quality vs. file size balance

/**
 * Compresses and resizes an image buffer using Sharp.
 *
 * Pipeline:
 * 1. Auto-rotate based on EXIF orientation (common on iPhone photos)
 * 2. Resize: scale down to fit within MAX_DIMENSION × MAX_DIMENSION (preserve aspect ratio)
 * 3. Convert to JPEG (normalises HEIC, PNG, WEBP inputs)
 * 4. Apply quality compression
 *
 * @param {Buffer} inputBuffer - Raw image buffer from multer memory storage
 * @returns {Promise<{ buffer: Buffer, width: number, height: number, sizeBytes: number }>}
 */
export const compressImage = async (inputBuffer) => {
  try {
    const pipeline = sharp(inputBuffer)
      .rotate()                                  // Auto-rotate from EXIF
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',                           // Scale down only, never upscale
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true }); // mozjpeg = better compression

    const buffer = await pipeline.toBuffer();
    const metadata = await sharp(buffer).metadata();

    logger.debug(
      `Image compressed: ${(inputBuffer.length / 1024).toFixed(0)}KB → ` +
      `${(buffer.length / 1024).toFixed(0)}KB ` +
      `(${metadata.width}×${metadata.height})`
    );

    return {
      buffer,
      width: metadata.width,
      height: metadata.height,
      sizeBytes: buffer.length,
    };
  } catch (error) {
    logger.error(`Image compression failed: ${error.message}`);
    throw error;
  }
};

/**
 * Converts a compressed buffer to a base64 string for FatSecret API.
 * Strips the data URI prefix if present — FatSecret expects raw base64.
 *
 * @param {Buffer} buffer
 * @returns {string} Pure base64 string
 */
export const bufferToBase64 = (buffer) => {
  const base64 = buffer.toString('base64');
  // Strip data URI prefix if somehow present
  return base64.replace(/^data:image\/\w+;base64,/, '');
};
