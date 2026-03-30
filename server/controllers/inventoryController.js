import Ingredient from '../models/Ingredient.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const CATEGORIES = [
  'vegetables', 'fruits', 'dairy', 'meat', 'seafood',
  'grains', 'condiments', 'beverages', 'snacks', 'other',
];

// ── GET /api/inventory ────────────────────────────────────────
/**
 * Returns all current fridge inventory items for the user,
 * grouped by category. Supports ?category= and ?search= filters.
 */
export const getInventory = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    const query = { userId: req.user.id };
    if (category && CATEGORIES.includes(category)) {
      query.category = category;
    }
    if (search?.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { displayName: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const items = await Ingredient.find(query)
      .sort({ category: 1, displayName: 1 })
      .lean();

    // Group by category for the UI
    const grouped = {};
    for (const item of items) {
      const cat = item.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    res.json({
      success: true,
      total: items.length,
      inventory: items,
      grouped,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/inventory ───────────────────────────────────────
/**
 * Manually add a single ingredient to the fridge inventory.
 */
export const addInventoryItem = async (req, res, next) => {
  try {
    const {
      name,
      displayName,
      quantity,
      unit,
      category,
      expiryDate,
      notes,
    } = req.body;

    if (!name?.trim()) {
      throw new AppError('Ingredient name is required.', 400);
    }

    const ingredient = await Ingredient.create({
      userId: req.user.id,
      uploadId: null,          // Manually added — no upload session
      fatSecretFoodId: `manual_${Date.now()}`,
      name: name.toLowerCase().trim(),
      displayName: displayName?.trim() || name.trim(),
      quantity: quantity || 1,
      unit: unit?.trim() || '',
      category: CATEGORIES.includes(category) ? category : 'other',
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      notes: notes?.trim() || '',
      isAvailable: true,
      isManualEntry: true,
    });

    logger.info(`User ${req.user.id} manually added ingredient: ${ingredient.name}`);

    res.status(201).json({
      success: true,
      message: `${ingredient.displayName} added to your fridge.`,
      ingredient,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/inventory/batch ─────────────────────────────────
/**
 * Add multiple ingredients at once.
 * Body: { items: [{ name, displayName, quantity, unit, category }] }
 */
export const batchAddInventoryItems = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('items array is required and must not be empty.', 400);
    }
    if (items.length > 50) {
      throw new AppError('Maximum 50 items per batch.', 400);
    }

    const docs = items
      .filter((item) => item.name?.trim())
      .map((item) => ({
        userId: req.user.id,
        uploadId: null,
        fatSecretFoodId: `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: item.name.toLowerCase().trim(),
        displayName: item.displayName?.trim() || item.name.trim(),
        quantity: item.quantity || 1,
        unit: item.unit?.trim() || '',
        category: CATEGORIES.includes(item.category) ? item.category : 'other',
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
        notes: item.notes?.trim() || '',
        isAvailable: true,
        isManualEntry: true,
      }));

    const created = await Ingredient.insertMany(docs);

    logger.info(`User ${req.user.id} batch-added ${created.length} ingredients`);

    res.status(201).json({
      success: true,
      message: `${created.length} item${created.length !== 1 ? 's' : ''} added to your fridge.`,
      count: created.length,
      ingredients: created,
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/inventory/:id ──────────────────────────────────
/**
 * Update quantity, unit, expiry date, category, or availability.
 */
export const updateInventoryItem = async (req, res, next) => {
  try {
    const { quantity, unit, category, expiryDate, notes, isAvailable, displayName } = req.body;

    const ingredient = await Ingredient.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!ingredient) {
      throw new AppError('Ingredient not found.', 404);
    }

    if (displayName !== undefined)  ingredient.displayName = displayName.trim();
    if (quantity !== undefined)     ingredient.quantity = Math.max(0, Number(quantity));
    if (unit !== undefined)         ingredient.unit = unit.trim();
    if (category !== undefined && CATEGORIES.includes(category)) ingredient.category = category;
    if (expiryDate !== undefined)   ingredient.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (notes !== undefined)        ingredient.notes = notes.trim();
    if (isAvailable !== undefined)  ingredient.isAvailable = Boolean(isAvailable);

    await ingredient.save();

    res.json({
      success: true,
      message: 'Ingredient updated.',
      ingredient,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/inventory/:id ─────────────────────────────────
export const deleteInventoryItem = async (req, res, next) => {
  try {
    const result = await Ingredient.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!result) {
      throw new AppError('Ingredient not found.', 404);
    }

    logger.info(`User ${req.user.id} deleted ingredient ${req.params.id}`);

    res.json({ success: true, message: `${result.displayName} removed from your fridge.` });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/inventory ─────────────────────────────────────
/**
 * Bulk delete — body: { ids: ['...', '...'] }
 */
export const bulkDeleteInventoryItems = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('ids array is required.', 400);
    }

    const result = await Ingredient.deleteMany({
      _id: { $in: ids },
      userId: req.user.id,
    });

    res.json({
      success: true,
      message: `${result.deletedCount} item${result.deletedCount !== 1 ? 's' : ''} removed.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};