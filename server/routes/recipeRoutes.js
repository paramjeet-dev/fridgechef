import { Router } from 'express';
import {
  searchRecipes,
  getRecipe,
  getSimilar,
} from '../controllers/recipeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { recipeRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.use(protect);

router.get('/',            recipeRateLimiter, searchRecipes);
router.get('/:id',         getRecipe);
router.get('/:id/similar', getSimilar);

export default router;
