import { spoonacularGet } from '../utils/spoonacularQueue.js';
import { AppError } from '../middleware/errorHandler.js';

// ── GET /api/recipes/:id/substitutes ─────────────────────────
/**
 * For each ingredient in a recipe, fetch possible substitutes
 * from Spoonacular's /food/ingredients/:id/substitutes endpoint.
 * Returns only ingredients that have at least one substitute.
 */
export const getSubstitutes = async (req, res, next) => {
  try {
    const spoonacularId = parseInt(req.params.id, 10);
    if (isNaN(spoonacularId)) throw new AppError('Invalid recipe ID.', 400);

    // Get recipe ingredients first (from cache)
    const Recipe = (await import('../models/Recipe.js')).default;
    const recipe = await Recipe.findOne({ spoonacularId }).lean();

    if (!recipe) throw new AppError('Recipe not found. View the recipe first to load it.', 404);

    const ingredients = recipe.ingredients || [];
    if (!ingredients.length) return res.json({ success: true, substitutes: [] });

    // Fetch substitutes in parallel — silent fail per ingredient
    const results = await Promise.allSettled(
      ingredients.map(async (ing) => {
        if (!ing.spoonacularId) return null;
        try {
          const data = await spoonacularGet(
            `/food/ingredients/${ing.spoonacularId}/substitutes`
          );
          if (!data?.substitutes?.length) return null;
          return {
            ingredientName: ing.name,
            substitutes: data.substitutes,   // Array of strings e.g. "1 cup X = 1 cup Y"
          };
        } catch {
          return null;
        }
      })
    );

    const substitutes = results
      .filter((r) => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value);

    res.json({ success: true, substitutes });
  } catch (error) {
    next(error);
  }
};