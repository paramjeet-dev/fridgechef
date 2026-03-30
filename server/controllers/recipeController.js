import {
  findByIngredients,
  getRecipeDetails,
  getSimilarRecipes,
  generateMealPlan,
} from '../services/spoonacularService.js';
import { Favorite } from '../models/Favorite.js';
import { MealPlan } from '../models/Favorite.js';
import Recipe from '../models/Recipe.js';
import { AppError } from '../middleware/errorHandler.js';
import { getQueueDepth } from '../utils/spoonacularQueue.js';
import logger from '../utils/logger.js';

// ── GET /api/recipes ──────────────────────────────────────────
export const searchRecipes = async (req, res, next) => {
  try {
    const { ingredients, page = 1, cuisine, diet, maxReadyTime } = req.query;

    if (!ingredients) {
      throw new AppError('ingredients query param is required (comma-separated names).', 400);
    }

    const ingredientList = ingredients
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (ingredientList.length === 0) {
      throw new AppError('At least one ingredient name is required.', 400);
    }

    const queueDepth = getQueueDepth();
    if (queueDepth > 0) {
      logger.info(`Spoonacular queue depth: ${queueDepth}`);
    }

    const result = await findByIngredients(ingredientList, {
      page: parseInt(page, 10),
      cuisine,
      diet,
      maxReadyTime: maxReadyTime ? parseInt(maxReadyTime, 10) : null,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/recipes/:id ──────────────────────────────────────
export const getRecipe = async (req, res, next) => {
  try {
    const spoonacularId = parseInt(req.params.id, 10);
    if (isNaN(spoonacularId)) throw new AppError('Invalid recipe ID.', 400);

    const recipe = await getRecipeDetails(spoonacularId);
    if (!recipe) throw new AppError('Recipe not found.', 404);

    // Attach favourite status for this user
    const isFavorited = await Favorite.exists({
      userId: req.user.id,
      spoonacularId,
    });

    res.json({ success: true, recipe: { ...recipe, isFavorited: !!isFavorited } });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/recipes/:id/similar ──────────────────────────────
export const getSimilar = async (req, res, next) => {
  try {
    const spoonacularId = parseInt(req.params.id, 10);
    if (isNaN(spoonacularId)) throw new AppError('Invalid recipe ID.', 400);

    const recipes = await getSimilarRecipes(spoonacularId);
    res.json({ success: true, recipes });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/favorites ────────────────────────────────────────
export const getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch recipe details for each favourite (cache-first, no extra API calls)
    const recipes = await Promise.all(
      favorites.map(async (fav) => {
        const recipe = await Recipe.findOne({ spoonacularId: fav.spoonacularId }).lean();
        return recipe ? { ...recipe, favoriteId: fav._id, notes: fav.notes } : null;
      })
    );

    res.json({ success: true, favorites: recipes.filter(Boolean) });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/favorites ───────────────────────────────────────
export const addFavorite = async (req, res, next) => {
  try {
    const { spoonacularId, notes = '' } = req.body;
    if (!spoonacularId) throw new AppError('spoonacularId is required.', 400);

    // Ensure recipe is in cache (fetch it if not)
    const recipe = await Recipe.findOne({ spoonacularId }).lean();
    if (!recipe) {
      await getRecipeDetails(spoonacularId); // Fetches and caches
    }

    const favorite = await Favorite.create({
      userId: req.user.id,
      recipeId: recipe?._id,
      spoonacularId,
      notes,
    });

    logger.info(`User ${req.user.id} favourited recipe ${spoonacularId}`);
    res.status(201).json({ success: true, favoriteId: favorite._id });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/favorites/:spoonacularId ──────────────────────
export const removeFavorite = async (req, res, next) => {
  try {
    const spoonacularId = parseInt(req.params.spoonacularId, 10);
    const result = await Favorite.findOneAndDelete({
      userId: req.user.id,
      spoonacularId,
    });

    if (!result) throw new AppError('Favourite not found.', 404);

    res.json({ success: true, message: 'Removed from favourites.' });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/mealplan/generate ───────────────────────────────
export const generatePlan = async (req, res, next) => {
  try {
    const { targetCalories = 2000, diet = '' } = req.body;

    const spoonacularPlan = await generateMealPlan({ targetCalories, diet });

    // Spoonacular returns a week plan — map it to our MealPlan schema
    const days = (spoonacularPlan.week
      ? Object.values(spoonacularPlan.week)
      : []
    ).map((day, i) => ({
      dayIndex: i,
      meals: {
        breakfast: day.meals?.[0]?.id || null,
        lunch:     day.meals?.[1]?.id || null,
        dinner:    day.meals?.[2]?.id || null,
      },
    }));

    // Fetch and cache all referenced recipes
    const allIds = days.flatMap((d) =>
      [d.meals.breakfast, d.meals.lunch, d.meals.dinner].filter(Boolean)
    );
    await Promise.allSettled(allIds.map((id) => getRecipeDetails(id)));

    // Find Monday of current week
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const { MealPlan } = await import('../models/Favorite.js');
    const plan = await MealPlan.findOneAndUpdate(
      { userId: req.user.id, weekStartDate: monday },
      { days, targetCalories, diet },
      { upsert: true, new: true }
    );

    res.json({ success: true, mealPlan: plan });
  } catch (error) {
    next(error);
  }
};
