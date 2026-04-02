import { Router } from 'express';
import { generatePlan } from '../controllers/recipeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { MealPlan } from '../models/Favorite.js';
import Recipe from '../models/Recipe.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(protect);

// ── GET /api/mealplan ─────────────────────────────────────────
// Fetch the most recent meal plan for the user, populated with recipe details.
router.get('/', async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ userId: req.user.id })
      .sort({ weekStartDate: -1 })
      .lean();

    if (!plan) return res.json({ success: true, mealPlan: null });

    // Populate recipe details (title, image, cookTime) from cached Recipe docs
    const populated = await populatePlan(plan);
    res.json({ success: true, mealPlan: populated });
  } catch (e) { next(e); }
});

// ── POST /api/mealplan/generate ───────────────────────────────
router.post('/generate', generatePlan);

// ── PUT /api/mealplan/slot ────────────────────────────────────
// Assign a recipe OR custom meal to a specific day+mealType slot.
// Body: { dayIndex, mealType, spoonacularId? } OR { dayIndex, mealType, customName }
router.put('/slot', async (req, res, next) => {
  try {
    const { dayIndex, mealType, spoonacularId, customName } = req.body;

    const VALID_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (dayIndex === undefined || !VALID_TYPES.includes(mealType)) {
      throw new AppError('dayIndex and a valid mealType (breakfast/lunch/dinner/snack) are required.', 400);
    }

    let slotData = null;

    if (customName?.trim()) {
      // Custom (non-recipe) meal
      slotData = {
        isCustom: true,
        customName: customName.trim(),
        recipeId: null,
        spoonacularId: null,
        title: null,
        image: null,
        cookTime: null,
        isCooked: false,
      };
    } else if (spoonacularId) {
      // Recipe-based slot — look up cached recipe for display fields
      const recipe = await Recipe.findOne({ spoonacularId: Number(spoonacularId) }).lean();
      slotData = {
        isCustom: false,
        customName: null,
        recipeId: recipe?._id ?? null,
        spoonacularId: Number(spoonacularId),
        title: recipe?.title ?? null,
        image: recipe?.image ?? null,
        cookTime: recipe?.cookTime ?? null,
        isCooked: false,
      };
    }
    // If neither provided, slotData stays null → clears the slot

    const plan = await MealPlan.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { [`days.${dayIndex}.meals.${mealType}`]: slotData } },
      { new: true }
    );

    if (!plan) throw new AppError('No meal plan found. Generate one first.', 404);

    const populated = await populatePlan(plan.toObject());
    res.json({ success: true, mealPlan: populated });
  } catch (e) { next(e); }
});

// ── DELETE /api/mealplan/slot ─────────────────────────────────
// Clear a specific meal slot. Body: { dayIndex, mealType }
router.delete('/slot', async (req, res, next) => {
  try {
    const { dayIndex, mealType } = req.body;

    const VALID_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (dayIndex === undefined || !VALID_TYPES.includes(mealType)) {
      throw new AppError('dayIndex and mealType are required.', 400);
    }

    const plan = await MealPlan.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { [`days.${dayIndex}.meals.${mealType}`]: null } },
      { new: true }
    );

    if (!plan) throw new AppError('No meal plan found.', 404);

    const populated = await populatePlan(plan.toObject());
    res.json({ success: true, mealPlan: populated });
  } catch (e) { next(e); }
});

// ── PATCH /api/mealplan/slot/cooked ──────────────────────────
// Toggle isCooked on a specific meal slot. Body: { dayIndex, mealType }
router.patch('/slot/cooked', async (req, res, next) => {
  try {
    const { dayIndex, mealType } = req.body;

    // First fetch to get current state
    const plan = await MealPlan.findOne({ userId: req.user.id });
    if (!plan) throw new AppError('No meal plan found.', 404);

    const day = plan.days.find((d) => d.dayIndex === dayIndex);
    if (!day?.meals?.[mealType]) throw new AppError('Meal slot is empty.', 400);

    const current = day.meals[mealType].isCooked;
    day.meals[mealType].isCooked = !current;
    await plan.save();

    const populated = await populatePlan(plan.toObject());
    res.json({
      success: true,
      isCooked: !current,
      mealPlan: populated,
    });
  } catch (e) { next(e); }
});

// ── DELETE /api/mealplan ──────────────────────────────────────
// Delete the user's current meal plan entirely
router.delete('/', async (req, res, next) => {
  try {
    await MealPlan.findOneAndDelete({ userId: req.user.id });
    res.json({ success: true, message: 'Meal plan deleted.' });
  } catch (e) { next(e); }
});

// ── Legacy PUT /api/mealplan (keep for backwards compat) ──────
router.put('/', async (req, res, next) => {
  try {
    const { dayIndex, mealType, recipeId } = req.body;
    const plan = await MealPlan.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { [`days.${dayIndex}.meals.${mealType}`]: recipeId ? { recipeId, isCooked: false } : null } },
      { new: true }
    );
    if (!plan) throw new AppError('No meal plan found. Generate one first.', 404);
    res.json({ success: true, mealPlan: plan });
  } catch (e) { next(e); }
});

// ── Helper: populate plan days with recipe info ───────────────
async function populatePlan(plan) {
  if (!plan?.days) return plan;

  // Collect all spoonacularIds we need
  const ids = new Set();
  for (const day of plan.days) {
    for (const slot of Object.values(day.meals || {})) {
      if (slot?.spoonacularId) ids.add(slot.spoonacularId);
    }
  }

  // Batch-fetch from cache
  const recipes = await Recipe.find({ spoonacularId: { $in: [...ids] } })
    .select('spoonacularId title image cookTime')
    .lean();

  const recipeMap = Object.fromEntries(recipes.map((r) => [r.spoonacularId, r]));

  // Merge recipe details into slots
  const days = plan.days.map((day) => ({
    ...day,
    meals: Object.fromEntries(
      Object.entries(day.meals || {}).map(([type, slot]) => {
        if (!slot) return [type, null];
        if (slot.isCustom) return [type, slot];
        const recipe = slot.spoonacularId ? recipeMap[slot.spoonacularId] : null;
        return [type, {
          ...slot,
          title:    slot.title    || recipe?.title    || null,
          image:    slot.image    || recipe?.image    || null,
          cookTime: slot.cookTime || recipe?.cookTime || null,
        }];
      })
    ),
  }));

  return { ...plan, days };
}

export default router;
