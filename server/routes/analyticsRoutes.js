import { Router } from 'express';
import { getStats, getActivity } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);

router.get('/stats',    getStats);
router.get('/activity', getActivity);

export default router;