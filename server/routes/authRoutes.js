import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updatePreferences,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { validateRequest, registerSchema, loginSchema } from '../middleware/validateRequest.js';

const router = Router();

// ── Public routes (no auth required) ─────────────────────────

// Rate-limited to 10 attempts per 15 min to prevent brute-force
router.post('/register', authRateLimiter, validateRequest(registerSchema), register);
router.post('/login',    authRateLimiter, validateRequest(loginSchema),    login);

// Refresh uses its own cookie — no access token needed
router.post('/refresh', refreshToken);

// ── Protected routes ──────────────────────────────────────────

router.post('/logout',           protect, logout);
router.get('/me',                protect, getMe);
router.patch('/preferences',     protect, updatePreferences);

export default router;
