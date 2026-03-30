import { Router } from 'express';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/recipeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);

router.get('/',                  getFavorites);
router.post('/',                 addFavorite);
router.delete('/:spoonacularId', removeFavorite);

export default router;
