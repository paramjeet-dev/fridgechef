import mongoose from 'mongoose';

const nutritionSchema = new mongoose.Schema(
  {
    servingDescription: String,
    calories:           { type: Number, default: 0 },
    protein:            { type: Number, default: 0 },
    carbs:              { type: Number, default: 0 },
    fat:                { type: Number, default: 0 },
    saturatedFat:       { type: Number, default: 0 },
    polyunsaturatedFat: { type: Number, default: 0 },
    monounsaturatedFat: { type: Number, default: 0 },
    cholesterol:        { type: Number, default: 0 },
    fiber:              { type: Number, default: 0 },
    sugar:              { type: Number, default: 0 },
    sodium:             { type: Number, default: 0 },
    potassium:          { type: Number, default: 0 },
    vitaminA:           { type: Number, default: 0 },
    vitaminC:           { type: Number, default: 0 },
    calcium:            { type: Number, default: 0 },
    iron:               { type: Number, default: 0 },
  },
  { _id: false }
);

const ingredientSchema = new mongoose.Schema(
  {
    uploadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
      default: null,    // null for manually added items
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
      required: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
    },

    // Serving info from FatSecret (null for manual entries)
    suggestedServingId:          { type: String, default: null },
    suggestedServingDescription: { type: String, default: '' },
    metricAmount:                { type: Number, default: 0 },
    metricUnit:                  { type: String, default: 'g' },
    units:                       { type: Number, default: 1 },

    nutrition: nutritionSchema,

    // ── Inventory management fields (new) ────────────────────
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    unit: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: ['vegetables', 'fruits', 'dairy', 'meat', 'seafood', 'grains', 'condiments', 'beverages', 'snacks', 'other'],
      default: 'other',
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 300,
    },
    isManualEntry: {
      type: Boolean,
      default: false,   // true = user added manually, false = from scan
    },

    // Availability toggle
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
// Index for inventory queries by category
ingredientSchema.index({ userId: 1, category: 1 });

const Ingredient = mongoose.model('Ingredient', ingredientSchema);
export default Ingredient;