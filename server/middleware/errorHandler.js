import logger from '../utils/logger.js';

/**
 * Global Express error handler.
 * Must be registered LAST with app.use() — after all routes.
 *
 * Handles:
 * - Mongoose validation errors (400)
 * - Mongoose duplicate key errors (409)
 * - JWT errors (401)
 * - Custom AppError instances
 * - Generic unhandled errors (500)
 */
export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // ── Mongoose Validation Error ─────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const fields = Object.values(err.errors).map((e) => e.message);
    message = fields.join('. ');
  }

  // ── Mongoose Duplicate Key (e.g. duplicate email) ─────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field ? `'${field}'` : 'A field'} already exists`;
  }

  // ── Mongoose CastError (invalid ObjectId) ────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: '${err.value}'`;
  }

  // ── JWT Errors ────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // ── Log internal errors (not expected client errors) ─────
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${statusCode}: ${err.stack || message}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} → ${statusCode}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Custom error class for intentional API errors.
 * Usage: throw new AppError('Not found', 404)
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguish from unexpected errors
    Error.captureStackTrace(this, this.constructor);
  }
}
