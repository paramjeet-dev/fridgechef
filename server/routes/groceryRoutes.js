import { Router } from 'express';
import { getGroceryList } from '../controllers/groceryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);
router.get('/', getGroceryList);

export default router;