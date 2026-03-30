import { Router } from 'express';
import {
  createUpload,
  getUploads,
  getUploadById,
  deleteUpload,
  toggleIngredientAvailability,
} from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { uploadMiddleware, handleMulterError } from '../middleware/uploadMiddleware.js';

const router = Router();

// All upload routes require authentication
router.use(protect);

router.get('/',    getUploads);
router.get('/:id', getUploadById);
router.delete('/:id', deleteUpload);

// Multi-file upload — rate-limited, multer processes files[], multerError catches oversized files
router.post(
  '/',
  uploadRateLimiter,
  uploadMiddleware.array('images', 5), // Field name: 'images', max 5 files
  handleMulterError,
  createUpload
);

// Toggle ingredient availability within an upload
router.patch(
  '/:uploadId/ingredients/:ingredientId/toggle',
  toggleIngredientAvailability
);

export default router;
