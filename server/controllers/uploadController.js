import Upload from '../models/Upload.js';
import Ingredient from '../models/Ingredient.js';
import { compressImage, bufferToBase64 } from '../utils/imageCompressor.js';
import { uploadToCloudinary, getThumbnailUrl } from '../config/cloudinary.js';
import { recognizeImage } from '../services/fatSecretService.js';
import { deduplicateIngredients } from '../utils/ingredientDeduplicator.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

// ── POST /api/uploads ─────────────────────────────────────────
/**
 * Full pipeline for a multi-image fridge upload:
 *
 * 1. Create an Upload document (status: pending)
 * 2. For each image:
 *    a. Compress via Sharp (resize + JPEG normalise)
 *    b. Upload compressed buffer to Cloudinary
 *    c. Convert to base64 for FatSecret
 *    d. Call FatSecret /image-recognition/v2 (passing prev results as context)
 * 3. Deduplicate ingredients across all images by food_id
 * 4. Persist Ingredient documents to MongoDB
 * 5. Update Upload document (status: completed, ingredient refs)
 */
export const createUpload = async (req, res, next) => {
  // Validate files present
  if (!req.files || req.files.length === 0) {
    return next(new AppError('No images provided. Please upload at least one fridge photo.', 400));
  }

  // Create the upload document immediately so the user gets an ID
  // to poll if we add async processing later
  let upload;
  try {
    upload = await Upload.create({
      userId: req.user.id,
      images: [],
      processingStatus: 'processing',
    });
  } catch (error) {
    return next(error);
  }

  try {
    // ── Step 1: Process each image ──────────────────────────
    const imageRecords = [];
    const allFoodResponses = [];
    let accumulatedIngredients = []; // Grows per image for eaten_foods[] context

    for (const file of req.files) {
      logger.debug(`Processing image: ${file.originalname} (${(file.size / 1024).toFixed(0)}KB)`);

      // ── 1a. Compress ──────────────────────────────────────
      const { buffer, width, height, sizeBytes } = await compressImage(file.buffer);

      // ── 1b. Upload to Cloudinary ──────────────────────────
      const cloudinaryResult = await uploadToCloudinary(
        buffer,
        `${process.env.CLOUDINARY_UPLOAD_FOLDER}/${req.user.id}`,
      );

      imageRecords.push({
        originalName: file.originalname,
        cloudinaryUrl: cloudinaryResult.url,
        cloudinaryPublicId: cloudinaryResult.publicId,
        thumbnailUrl: getThumbnailUrl(cloudinaryResult.publicId, 400, 300),
        width,
        height,
        sizeBytes,
      });

      // ── 1c. Convert to base64 for FatSecret ───────────────
      const base64Image = bufferToBase64(buffer);

      // ── 1d. Call FatSecret (pass accumulated context) ─────
      const foodResponse = await recognizeImage(base64Image, accumulatedIngredients);
      allFoodResponses.push(foodResponse);

      // Build up context for the next image call
      // Use the raw deduplicated list so far
      accumulatedIngredients = deduplicateIngredients(allFoodResponses);
    }

    // ── Step 2: Final deduplication across all images ───────
    const deduplicatedIngredients = deduplicateIngredients(allFoodResponses);

    if (deduplicatedIngredients.length === 0) {
      // FatSecret found nothing — still succeed but warn
      logger.warn(`Upload ${upload._id}: no ingredients detected in ${req.files.length} image(s)`);
    }

    // ── Step 3: Persist Ingredient documents ─────────────────
    const ingredientDocs = await Ingredient.insertMany(
      deduplicatedIngredients.map((ingredient) => ({
        ...ingredient,
        uploadId: upload._id,
        userId: req.user.id,
      }))
    );

    // ── Step 4: Update Upload document ────────────────────────
    upload.images = imageRecords;
    upload.extractedIngredients = ingredientDocs.map((doc) => doc._id);
    upload.ingredientCount = ingredientDocs.length;
    upload.processingStatus = 'completed';
    await upload.save();

    logger.info(
      `Upload ${upload._id}: ${req.files.length} image(s) → ${ingredientDocs.length} ingredients`
    );

    // ── Step 5: Respond ───────────────────────────────────────
    res.status(201).json({
      success: true,
      message: `Detected ${ingredientDocs.length} ingredient${ingredientDocs.length !== 1 ? 's' : ''}.`,
      upload: {
        id: upload._id,
        images: imageRecords.map(({ originalName, cloudinaryUrl, thumbnailUrl }) => ({
          originalName,
          cloudinaryUrl,
          thumbnailUrl,
        })),
        createdAt: upload.createdAt,
      },
      ingredients: ingredientDocs.map((doc) => ({
        id: doc._id,
        fatSecretFoodId: doc.fatSecretFoodId,
        name: doc.name,
        displayName: doc.displayName,
        isAvailable: doc.isAvailable,
        suggestedServingDescription: doc.suggestedServingDescription,
        nutrition: doc.nutrition,
      })),
    });

  } catch (error) {
    // Mark the upload as failed so the user knows what happened
    try {
      await Upload.findByIdAndUpdate(upload._id, {
        processingStatus: 'failed',
        processingError: error.message,
      });
    } catch (updateError) {
      logger.error(`Failed to mark upload ${upload._id} as failed: ${updateError.message}`);
    }
    next(error);
  }
};

// ── GET /api/uploads ──────────────────────────────────────────
/**
 * Returns the current user's upload history, newest first.
 * Paginates with ?page=1&limit=10
 */
export const getUploads = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [uploads, total] = await Promise.all([
      Upload.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'extractedIngredients',
          select: 'name displayName isAvailable nutrition.calories',
        })
        .lean(),
      Upload.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      success: true,
      uploads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/uploads/:id ──────────────────────────────────────
/**
 * Returns a single upload with its full ingredient list.
 */
export const getUploadById = async (req, res, next) => {
  try {
    const upload = await Upload.findOne({
      _id: req.params.id,
      userId: req.user.id,  // Ensures user can only access their own uploads
    }).populate('extractedIngredients');

    if (!upload) {
      throw new AppError('Upload not found.', 404);
    }

    res.json({ success: true, upload });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/uploads/:id ───────────────────────────────────
export const deleteUpload = async (req, res, next) => {
  try {
    const upload = await Upload.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!upload) {
      throw new AppError('Upload not found.', 404);
    }

    // Delete images from Cloudinary
    const { deleteFromCloudinary } = await import('../config/cloudinary.js');
    await Promise.allSettled(
      upload.images.map((img) => deleteFromCloudinary(img.cloudinaryPublicId))
    );

    // Delete associated ingredients and the upload document
    await Promise.all([
      Ingredient.deleteMany({ uploadId: upload._id }),
      upload.deleteOne(),
    ]);

    logger.info(`Upload ${upload._id} deleted by user ${req.user.id}`);

    res.json({ success: true, message: 'Upload deleted.' });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/uploads/:uploadId/ingredients/:ingredientId ────
/**
 * Toggles an ingredient's isAvailable flag.
 * Used when a user marks an ingredient as "I don't actually have this".
 */
export const toggleIngredientAvailability = async (req, res, next) => {
  try {
    const ingredient = await Ingredient.findOne({
      _id: req.params.ingredientId,
      userId: req.user.id,
    });

    if (!ingredient) {
      throw new AppError('Ingredient not found.', 404);
    }

    ingredient.isAvailable = !ingredient.isAvailable;
    await ingredient.save();

    res.json({
      success: true,
      ingredientId: ingredient._id,
      isAvailable: ingredient.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};
