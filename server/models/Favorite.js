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
  {
    timestamps: true,
  }
);

// One user can only favorite a recipe once
favoriteSchema.index({ userId: 1, spoonacularId: 1 }, { unique: true });

export const Favorite = mongoose.model('Favorite', favoriteSchema);

// ── MealPlan ─────────────────────────────────────────────────
const mealSlotSchema = new mongoose.Schema(
  {
    breakfast: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null },
    lunch: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null },
    dinner: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    dayIndex: { type: Number, required: true, min: 0, max: 6 }, // 0 = Monday
    meals: { type: mealSlotSchema, default: () => ({}) },
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
        Array.from({ length: 7 }, (_, i) => ({ dayIndex: i, meals: {} })),
    },
    targetCalories: {
      type: Number,
      default: 2000,
    },
    diet: {
      type: String,
      default: null, // Passed to Spoonacular /mealplanner/generate
    },
  },
  {
    timestamps: true,
  }
);

// One meal plan per user per week
mealPlanSchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });

export const MealPlan = mongoose.model('MealPlan', mealPlanSchema);
