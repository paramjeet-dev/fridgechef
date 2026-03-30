import mongoose from 'mongoose';

const recipeIngredientSchema = new mongoose.Schema(
  {
    spoonacularId: Number,
    name: String,
    amount: Number,
    unit: String,
    image: String,
  },
  { _id: false }
);

const instructionStepSchema = new mongoose.Schema(
  {
    step: Number,
    text: String,
    equipment: [{ name: String, image: String }],
    ingredients: [{ name: String, image: String }],
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    spoonacularId: {
      type: Number,
      unique: true,
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    image: String,
    summary: String,
    cookTime: Number,   // minutes (readyInMinutes from Spoonacular)
    prepTime: Number,
    servings: Number,
    sourceUrl: String,
    cuisines: [String],
    diets: [String],    // ["vegetarian", "gluten free"]
    dishTypes: [String],

    // Full ingredient list from Spoonacular
    ingredients: [recipeIngredientSchema],

    // Parsed instructions
    instructions: [instructionStepSchema],

    // Nutrition summary
    nutrition: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },

    // Taste profile from Spoonacular tasteWidget
    tasteProfile: {
      sweetness: Number,
      saltiness: Number,
      sourness: Number,
      bitterness: Number,
      savoriness: Number,
      fattiness: Number,
      spiciness: Number,
    },

    // Cache management
    cachedAt: { type: Date, default: Date.now },
    cacheExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      index: true, // TTL index — MongoDB can auto-expire if needed
    },
  },
  {
    timestamps: true,
  }
);

const Recipe = mongoose.model('Recipe', recipeSchema);
export default Recipe;
