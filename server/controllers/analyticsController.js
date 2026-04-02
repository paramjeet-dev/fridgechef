import mongoose from 'mongoose';
import Upload from '../models/Upload.js';
import Ingredient from '../models/Ingredient.js';
import { Favorite, MealPlan } from '../models/Favorite.js';
import Recipe from '../models/Recipe.js';
import logger from '../utils/logger.js';

// ── GET /api/analytics/stats ──────────────────────────────────
/**
 * Returns all dashboard stats in a single request:
 * - totalDetections, savedRecipesCount, inventorySize
 * - mostUsedIngredients (top 8 by frequency across all scans)
 * - weeklyScans (last 8 weeks bar chart data)
 * - categoryBreakdown (inventory split by category)
 * - nutritionSummary (avg calories/protein/carbs/fat across inventory)
 */
export const getStats = async (req, res, next) => {
  try {
    const userId    = req.user.id;
    const userObjId = new mongoose.Types.ObjectId(userId);

    const [
      totalDetections,
      savedRecipesCount,
      inventorySize,
      mostUsedIngredients,
      weeklyScans,
      categoryBreakdown,
      nutritionSummary,
      mealPlanStats,
    ] = await Promise.all([

      // 1. Total scan sessions
      Upload.countDocuments({ userId }),

      // 2. Saved (favourited) recipes
      Favorite.countDocuments({ userId }),

      // 3. Current inventory size (all ingredients ever added)
      Ingredient.countDocuments({ userId }),

      // 4. Most used ingredients — group by name, count occurrences
      Ingredient.aggregate([
        { $match: { userId: userObjId } },
        { $group: { _id: '$name', displayName: { $first: '$displayName' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, name: '$_id', displayName: 1, count: 1 } },
      ]),

      // 5. Weekly scan counts for the last 8 weeks
      Upload.aggregate([
        {
          $match: {
            userId: userObjId,
            createdAt: { $gte: new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: {
              year:  { $isoWeekYear: '$createdAt' },
              week:  { $isoWeek: '$createdAt' },
            },
            count: { $sum: 1 },
            weekStart: { $min: '$createdAt' },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
        { $project: { _id: 0, count: 1, weekStart: 1 } },
      ]),

      // 6. Inventory category breakdown
      Ingredient.aggregate([
        { $match: { userId: userObjId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, category: '$_id', count: 1 } },
      ]),

      // 7. Average nutrition across current inventory items
      Ingredient.aggregate([
        { $match: { userId: userObjId, isAvailable: true } },
        {
          $group: {
            _id: null,
            avgCalories: { $avg: '$nutrition.calories' },
            avgProtein:  { $avg: '$nutrition.protein'  },
            avgCarbs:    { $avg: '$nutrition.carbs'    },
            avgFat:      { $avg: '$nutrition.fat'      },
            totalItems:  { $sum: 1 },
          },
        },
      ]),

      // 8. Meal plan completion rate (this week)
      MealPlan.findOne({ userId }).sort({ weekStartDate: -1 }).lean(),
    ]);

    // ── Compute meal plan completion ──────────────────────────
    let mealPlanCompletion = null;
    if (mealPlanStats?.days) {
      let total = 0, cooked = 0;
      for (const day of mealPlanStats.days) {
        for (const slot of Object.values(day.meals || {})) {
          if (slot) { total++; if (slot.isCooked) cooked++; }
        }
      }
      mealPlanCompletion = { total, cooked, pct: total > 0 ? Math.round((cooked / total) * 100) : 0 };
    }

    // ── Format weekly scans — fill missing weeks with 0 ──────
    const now = new Date();
    const weeklyScansFilled = Array.from({ length: 8 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (7 - i) * 7);
      weekStart.setHours(0, 0, 0, 0);

      const label = weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const match = weeklyScans.find((w) => {
        const ws = new Date(w.weekStart);
        return Math.abs(ws - weekStart) < 7 * 24 * 60 * 60 * 1000;
      });
      return { label, count: match?.count || 0 };
    });

    const nutrition = nutritionSummary[0] || null;

    logger.info(`Analytics fetched for user ${userId}`);

    res.json({
      success: true,
      stats: {
        totalDetections,
        savedRecipesCount,
        inventorySize,
        mealPlanCompletion,
        mostUsedIngredients,
        weeklyScans: weeklyScansFilled,
        categoryBreakdown,
        nutritionSummary: nutrition ? {
          avgCalories: Math.round(nutrition.avgCalories || 0),
          avgProtein:  Math.round((nutrition.avgProtein  || 0) * 10) / 10,
          avgCarbs:    Math.round((nutrition.avgCarbs    || 0) * 10) / 10,
          avgFat:      Math.round((nutrition.avgFat      || 0) * 10) / 10,
          totalItems:  nutrition.totalItems,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/analytics/activity ───────────────────────────────
/**
 * Returns a unified recent activity timeline:
 * - Fridge scans (from Upload)
 * - Recipes saved/unsaved (from Favorite)
 * Limited to last 20 events, newest first.
 */
export const getActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [recentUploads, recentFavorites] = await Promise.all([
      Upload.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('createdAt ingredientCount images processingStatus')
        .lean(),

      Favorite.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
        .then(async (favs) => {
          // Attach recipe titles
          const ids = favs.map((f) => f.spoonacularId);
          const recipes = await Recipe.find({ spoonacularId: { $in: ids } })
            .select('spoonacularId title image')
            .lean();
          const map = Object.fromEntries(recipes.map((r) => [r.spoonacularId, r]));
          return favs.map((f) => ({ ...f, recipe: map[f.spoonacularId] || null }));
        }),
    ]);

    // Merge and sort by date
    const events = [
      ...recentUploads.map((u) => ({
        type: 'scan',
        id: u._id,
        title: `Scanned fridge — ${u.ingredientCount || 0} ingredient${u.ingredientCount !== 1 ? 's' : ''} detected`,
        subtitle: u.processingStatus === 'failed' ? 'Scan failed' : null,
        image: u.images?.[0]?.thumbnailUrl || null,
        createdAt: u.createdAt,
        link: `/history`,
      })),
      ...recentFavorites.map((f) => ({
        type: 'favorite',
        id: f._id,
        title: `Saved recipe: ${f.recipe?.title || `#${f.spoonacularId}`}`,
        image: f.recipe?.image || null,
        createdAt: f.createdAt,
        link: `/recipes/${f.spoonacularId}`,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);

    res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
};
