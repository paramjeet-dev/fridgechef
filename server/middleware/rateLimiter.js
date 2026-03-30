import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter — applied to all routes.
 * Prevents abuse and DDoS at the basic level.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                  // 300 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

/**
 * Strict limiter for auth endpoints — prevents brute-force attacks.
 * 10 attempts per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes.',
  },
});

/**
 * Upload limiter — FatSecret image recognition is expensive.
 * 15 upload sessions per hour per user (keyed by IP).
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload limit reached (15/hour). Please wait before uploading more.',
  },
});

/**
 * Recipe search limiter — protects Spoonacular quota.
 * 60 recipe searches per hour per IP.
 */
export const recipeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Recipe search limit reached. Please wait before searching again.',
  },
});
