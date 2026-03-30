import { Router } from 'express';
import { generatePlan } from '../controllers/recipeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { MealPlan } from '../models/Favorite.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ userId: req.user.id }).sort({ weekStartDate: -1 });
    res.json({ success: true, mealPlan: plan || null });
  } catch (e) { next(e); }
});

router.post('/generate', generatePlan);

router.put('/', async (req, res, next) => {
  try {
    const { dayIndex, mealType, recipeId } = req.body;
    const plan = await MealPlan.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { [`days.${dayIndex}.meals.${mealType}`]: recipeId || null } },
      { new: true }
    );
    if (!plan) throw new AppError('No meal plan found. Generate one first.', 404);
    res.json({ success: true, mealPlan: plan });
  } catch (e) { next(e); }
});

export default router;
