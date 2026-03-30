import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';

// ── Cookie config (shared across auth endpoints) ─────────────
const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,                                      // JS cannot read it — XSS safe
  secure: process.env.NODE_ENV === 'production',       // HTTPS only in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 15 * 60 * 1000,                              // 15 minutes
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,                    // 7 days
  path: '/api/auth/refresh',                           // Scoped — only sent to refresh endpoint
};

/**
 * Attach both tokens as httpOnly cookies and return safe user data.
 * Centralised so all auth endpoints (login, refresh) behave identically.
 */
const issueTokens = (user, res) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  return { accessToken, refreshToken };
};

// ── POST /api/auth/register ───────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    // Check for existing user — give a clear message (duplicate key handled
    // in errorHandler too, but we prefer a proactive check here for clarity)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('An account with this email already exists.', 409);
    }

    // Create user — passwordHash pre-save hook bcrypts the value
    const user = await User.create({
      email,
      passwordHash: password, // Pre-save hook hashes this
      displayName,
    });

    // Issue tokens and set cookies
    const { refreshToken } = issueTokens(user, res);

    // Persist hashed refresh token to DB for rotation validation
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Must select passwordHash explicitly (field has select: false)
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      // Vague message intentionally — don't reveal whether email exists
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const { refreshToken } = issueTokens(user, res);

    // Update refresh token and last login
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    // Clear both cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

    // Invalidate refresh token in DB so it cannot be reused
    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
      logger.info(`User logged out: ${req.user.email}`);
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/refresh ────────────────────────────────────
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new AppError('Refresh token missing.', 401);
    }

    // Verify the refresh token
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // Load user and compare stored refresh token (rotation check)
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      // Token reuse detected — clear everything (possible theft)
      if (user) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
      }
      throw new AppError('Invalid refresh token. Please log in again.', 401);
    }

    // Issue new token pair (refresh token rotation)
    const { refreshToken: newRefreshToken } = issueTokens(user, res);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Token refreshed.' });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    // req.user is set by protect middleware — just fetch fresh data
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/auth/preferences ───────────────────────────────
export const updatePreferences = async (req, res, next) => {
  try {
    const { dietaryRestrictions, cuisinePreferences, defaultServings } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          ...(dietaryRestrictions !== undefined && { 'preferences.dietaryRestrictions': dietaryRestrictions }),
          ...(cuisinePreferences !== undefined && { 'preferences.cuisinePreferences': cuisinePreferences }),
          ...(defaultServings !== undefined && { 'preferences.defaultServings': defaultServings }),
        },
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Preferences updated.',
      preferences: user.preferences,
    });
  } catch (error) {
    next(error);
  }
};
