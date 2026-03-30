import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Protects routes by verifying the JWT access token.
 * Token is read from the httpOnly cookie 'accessToken'.
 *
 * On success: attaches req.user = { id, email, displayName }
 * On failure: throws 401 AppError (caught by global error handler)
 */
export const protect = async (req, _res, next) => {
  try {
    // ── 1. Extract token from httpOnly cookie ─────────────
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new AppError('Access token missing. Please log in.', 401);
    }

    // ── 2. Verify signature and expiry ────────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── 3. Confirm user still exists in DB ────────────────
    // Guards against: user deleted after token was issued
    const user = await User.findById(decoded.id).select('-passwordHash -refreshToken');

    if (!user) {
      throw new AppError('User no longer exists.', 401);
    }

    // ── 4. Attach user to request ─────────────────────────
    req.user = {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
    };

    next();
  } catch (error) {
    next(error);
  }
};
