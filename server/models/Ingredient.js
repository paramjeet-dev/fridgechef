import mongoose from 'mongoose';

const nutritionSchema = new mongoose.Schema(
  {
    servingDescription: String,       // e.g. "1 medium (7\" to 7-7/8\" long)"
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },         // grams
    carbs: { type: Number, default: 0 },           // grams
    fat: { type: Number, default: 0 },             // grams
    saturatedFat: { type: Number, default: 0 },
    polyunsaturatedFat: { type: Number, default: 0 },
    monounsaturatedFat: { type: Number, default: 0 },
    cholesterol: { type: Number, default: 0 },     // mg
    fiber: { type: Number, default: 0 },           // grams
    sugar: { type: Number, default: 0 },           // grams
    sodium: { type: Number, default: 0 },          // mg
    potassium: { type: Number, default: 0 },       // mg
    vitaminA: { type: Number, default: 0 },        // mcg
    vitaminC: { type: Number, default: 0 },        // mg
    calcium: { type: Number, default: 0 },         // mg
    iron: { type: Number, default: 0 },            // mg
  },
  { _id: false }
);

const ingredientSchema = new mongoose.Schema(
  {
    uploadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // FatSecret fields
    fatSecretFoodId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,    // Singular form: "banana"
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,      // As returned by FatSecret: "Bananas"
      required: true,
    },
    // Serving info from suggested_serving
    suggestedServingId: String,
    suggestedServingDescription: String,  // "1 medium (7\" to 7-7/8\" long)"
    metricAmount: Number,                 // e.g. 118 (grams)
    metricUnit: String,                   // "g" or "ml"
    units: Number,                        // e.g. 1.0

    nutrition: nutritionSchema,

    // Availability toggle — user can mark ingredient as unavailable
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index — get all ingredients for a specific upload
ingredientSchema.index({ uploadId: 1, fatSecretFoodId: 1 });

const Ingredient = mongoose.model('Ingredient', ingredientSchema);
export default Ingredient;
