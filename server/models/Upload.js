import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },   // Full CDN URL
    cloudinaryPublicId: { type: String, required: true }, // For deletion
    thumbnailUrl: { type: String },                    // Cloudinary on-the-fly transform
    width: Number,
    height: Number,
    sizeBytes: Number,
  },
  { _id: false } // No separate _id for subdocuments
);

const uploadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Query uploads by user frequently
    },
    images: [imageSchema],
    extractedIngredients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
      },
    ],
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processingError: {
      type: String,
      default: null, // Stores error message if status === 'failed'
    },
    ingredientCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient user history queries (sorted by newest first)
uploadSchema.index({ userId: 1, createdAt: -1 });

const Upload = mongoose.model('Upload', uploadSchema);
export default Upload;
