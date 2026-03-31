import mongoose from 'mongoose';

// ── Favorite ─────────────────────────────────────────────────
const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    spoonacularId: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true }
);

favoriteSchema.index({ userId: 1, spoonacularId: 1 }, { unique: true });
export const Favorite = mongoose.model('Favorite', favoriteSchema);

// ── MealSlot ──────────────────────────────────────────────────
// Each slot holds either a recipe reference OR a custom meal string.
// isCooked tracks whether the user has marked it as done.
const mealSlotSchema = new mongoose.Schema(
  {
    // Recipe-based slot (from Spoonacular)
    recipeId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null },
    spoonacularId: { type: Number, default: null },
    title:         { type: String, default: null },   // cached for display without extra DB call
    image:         { type: String, default: null },
    cookTime:      { type: Number, default: null },

    // Custom (non-recipe) meal
    isCustom:      { type: Boolean, default: false },
    customName:    { type: String, default: null, maxlength: 100 },

    // Completion tracking
    isCooked:      { type: Boolean, default: false },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    dayIndex: { type: Number, required: true, min: 0, max: 6 }, // 0 = Monday
    meals: {
      breakfast: { type: mealSlotSchema, default: null },
      lunch:     { type: mealSlotSchema, default: null },
      dinner:    { type: mealSlotSchema, default: null },
      snack:     { type: mealSlotSchema, default: null },   // ← NEW
    },
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
    },
    days: {
      type: [daySchema],
      default: () =>
        Array.from({ length: 7 }, (_, i) => ({
          dayIndex: i,
          meals: { breakfast: null, lunch: null, dinner: null, snack: null },
        })),
    },
    targetCalories: { type: Number, default: 2000 },
    diet:           { type: String, default: null },
  },
  { timestamps: true }
);

mealPlanSchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });
export const MealPlan = mongoose.model('MealPlan', mealPlanSchema);