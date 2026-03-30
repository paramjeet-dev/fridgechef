import Recipe from '../models/Recipe.js';
import { spoonacularGet } from '../utils/spoonacularQueue.js';
import { buildMissedIngredientLinks } from './bigbasketService.js';
import logger from '../utils/logger.js';

const CACHE_TTL_DAYS = 7;
const cacheExpiry = () => new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

// ── Cache helpers ─────────────────────────────────────────────
const getCachedRecipe = (spoonacularId) =>
  Recipe.findOne({ spoonacularId, cacheExpiresAt: { $gt: new Date() } }).lean();

const upsertRecipeCache = (spoonacularId, data) =>
  Recipe.findOneAndUpdate(
    { spoonacularId },
    { ...data, cachedAt: new Date(), cacheExpiresAt: cacheExpiry() },
    { upsert: true, new: true, lean: true }
  );

// ── 1. Find recipes by ingredients ───────────────────────────
/**
 * @param {string[]} ingredients  - Ingredient name array
 * @param {Object}   opts
 * @param {number}   opts.page
 * @param {string}   opts.cuisine
 * @param {string}   opts.diet
 * @param {number}   opts.maxReadyTime
 * @returns {Promise<{recipes: Array, pagination: Object}>}
 */
export const findByIngredients = async (ingredients, opts = {}) => {
  const { page = 1, cuisine = '', diet = '', maxReadyTime = null } = opts;
  const number = 12;
  const offset = (page - 1) * number;

  // Step 1: Get recipe IDs that match ingredients
  const matchData = await spoonacularGet('/recipes/findByIngredients', {
    ingredients: ingredients.join(','),
    number,
    offset,
    ranking: 2,        // Maximise used ingredients
    ignorePantry: true,
  });

  if (!matchData?.length) {
    return { recipes: [], pagination: { page, hasMore: false } };
  }

  // Step 2: For each matched recipe, get or fetch full details
  // (findByIngredients only returns partial data)
  const recipes = await Promise.all(
    matchData.map(async (match) => {
      const full = await getRecipeDetails(match.id);

      // Attach match-specific data that isn't in the details endpoint
      return {
        ...full,
        usedIngredientCount: match.usedIngredientCount,
        missedIngredientCount: match.missedIngredientCount,
        missedIngredients: buildMissedIngredientLinks(match.missedIngredients || []),
        usedIngredients: (match.usedIngredients || []).map((i) => i.name),
        matchPercent: Math.round(
          (match.usedIngredientCount /
            (match.usedIngredientCount + match.missedIngredientCount)) * 100
        ),
      };
    })
  );

  return {
    recipes,
    pagination: {
      page,
      hasMore: matchData.length === number, // If full page returned, likely more exist
    },
  };
};

// ── 2. Get full recipe details ────────────────────────────────
export const getRecipeDetails = async (spoonacularId) => {
  // Cache-first
  const cached = await getCachedRecipe(spoonacularId);
  if (cached) {
    logger.debug(`Recipe ${spoonacularId}: cache hit`);
    return cached;
  }

  logger.debug(`Recipe ${spoonacularId}: fetching from Spoonacular`);

  const data = await spoonacularGet(`/recipes/${spoonacularId}/information`, {
    includeNutrition: true,
  });

  const mapped = mapRecipeDetails(data);
  const saved = await upsertRecipeCache(spoonacularId, mapped);
  return saved;
};

// ── 3. Get similar recipes ────────────────────────────────────
export const getSimilarRecipes = async (spoonacularId) => {
  const raw = await spoonacularGet(`/recipes/${spoonacularId}/similar`, { number: 6 });

  if (!raw?.length) return [];

  // similar endpoint only returns id + title + readyInMinutes — fetch details for each
  const recipes = await Promise.all(
    raw.map((r) => getRecipeDetails(r.id).catch(() => null))
  );

  return recipes.filter(Boolean);
};

// ── 4. Generate meal plan ─────────────────────────────────────
export const generateMealPlan = async ({ targetCalories = 2000, diet = '', timeFrame = 'week' }) => {
  const params = { timeFrame, targetCalories };
  if (diet) params.diet = diet;

  const data = await spoonacularGet('/mealplanner/generate', params);
  return data;
};

// ── Response mapper ───────────────────────────────────────────
const mapRecipeDetails = (data) => ({
  spoonacularId: data.id,
  title: data.title,
  image: data.image || null,
  summary: stripHtml(data.summary || ''),
  cookTime: data.readyInMinutes || null,
  prepTime: data.preparationMinutes || null,
  servings: data.servings || 2,
  sourceUrl: data.sourceUrl || null,
  cuisines: data.cuisines || [],
  diets: data.diets || [],
  dishTypes: data.dishTypes || [],

  ingredients: (data.extendedIngredients || []).map((ing) => ({
    spoonacularId: ing.id,
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    image: ing.image
      ? `https://spoonacular.com/cdn/ingredients_100x100/${ing.image}`
      : null,
  })),

  instructions: parseInstructions(data.analyzedInstructions),

  nutrition: (() => {
    const nutrients = data.nutrition?.nutrients || [];
    const get = (name) => nutrients.find((n) => n.name === name)?.amount || 0;
    return {
      calories: get('Calories'),
      protein:  get('Protein'),
      carbs:    get('Carbohydrates'),
      fat:      get('Fat'),
    };
  })(),
});

// ── Helpers ───────────────────────────────────────────────────
const stripHtml = (html) => html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();

const parseInstructions = (analyzedInstructions) => {
  if (!analyzedInstructions?.length) return [];
  const steps = analyzedInstructions[0]?.steps || [];
  return steps.map((s) => ({
    step: s.number,
    text: s.step,
    equipment: (s.equipment || []).map((e) => ({ name: e.name, image: e.image || null })),
    ingredients: (s.ingredients || []).map((i) => ({ name: i.name, image: i.image || null })),
  }));
};
