import { Router } from 'express';
import { searchRecipes, getRecipe, getSimilar } from '../controllers/recipeController.js';
import { getSubstitutes } from '../controllers/substitutesController.js';
// import { searchRecipesByName } from '../controllers/recipeSearchController.js';
import { protect } from '../middleware/authMiddleware.js';
import { recipeRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.use(protect);

// router.get('/search',          recipeRateLimiter, searchRecipesByName);
router.get('/',                recipeRateLimiter, searchRecipes);
router.get('/:id',             getRecipe);
router.get('/:id/similar',     getSimilar);
router.get('/:id/substitutes', getSubstitutes);

export default router;