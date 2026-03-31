import { MealPlan } from '../models/Favorite.js';
import Recipe from '../models/Recipe.js';
import { buildShoppingLink } from '../services/bigbasketService.js';

// Simple aisle lookup — maps ingredient names to store sections
const AISLE_MAP = {
  produce:  ['tomato','onion','garlic','potato','carrot','spinach','lettuce','cucumber','pepper','broccoli','mushroom','ginger','lemon','lime','apple','banana','mango','grape','strawberry','blueberry','avocado','corn','pea','bean'],
  dairy:    ['milk','cream','butter','cheese','yogurt','paneer','ghee','curd','egg','eggs'],
  meat:     ['chicken','beef','lamb','pork','mutton','bacon','sausage','turkey','duck'],
  seafood:  ['fish','prawn','shrimp','crab','salmon','tuna','cod','tilapia','lobster'],
  pantry:   ['flour','sugar','salt','oil','rice','pasta','noodle','bread','oat','lentil','dal','chickpea','kidney','soy','sauce','vinegar','honey','jam','pickle','mayonnaise','ketchup','mustard','chilli','cumin','turmeric','coriander','pepper','paprika','oregano','basil','thyme','rosemary'],
  beverages:['water','juice','coffee','tea','milk','soda','wine','beer','broth','stock'],
  frozen:   ['ice cream','frozen','peas frozen'],
  bakery:   ['bread','bun','roll','cake','cookie','pastry','croissant','tortilla','wrap'],
};

function getAisle(name) {
  const lower = (name || '').toLowerCase();
  for (const [aisle, keywords] of Object.entries(AISLE_MAP)) {
    if (keywords.some((k) => lower.includes(k))) return aisle;
  }
  return 'other';
}

// ── GET /api/grocery ──────────────────────────────────────────
/**
 * Aggregates all missedIngredients across every recipe in the current meal plan.
 * Deduplicates by ingredient name (case-insensitive) and groups by store aisle.
 */
export const getGroceryList = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ userId: req.user.id }).sort({ weekStartDate: -1 }).lean();
    if (!plan) return res.json({ success: true, items: [], grouped: {}, total: 0 });

    // Collect all spoonacularIds from the plan
    const spoonacularIds = new Set();
    for (const day of plan.days || []) {
      for (const slot of Object.values(day.meals || {})) {
        if (slot?.spoonacularId && !slot.isCustom) spoonacularIds.add(slot.spoonacularId);
      }
    }

    if (!spoonacularIds.size) return res.json({ success: true, items: [], grouped: {}, total: 0 });

    // Fetch recipes from cache
    const recipes = await Recipe.find({ spoonacularId: { $in: [...spoonacularIds] } })
      .select('spoonacularId title ingredients')
      .lean();

    // Get the user's current inventory ingredient names for comparison
    const Ingredient = (await import('../models/Ingredient.js')).default;
    const owned = await Ingredient.find({ userId: req.user.id, isAvailable: true })
      .select('name').lean();
    const ownedNames = new Set(owned.map((i) => i.name.toLowerCase().trim()));

    // Build deduplicated ingredient list
    // Key = normalised name, value = { name, amount, unit, aisle, usedIn[], shoppingUrl }
    const itemMap = new Map();

    for (const recipe of recipes) {
      for (const ing of recipe.ingredients || []) {
        const key = ing.name.toLowerCase().trim();
        // Skip if user already has it
        if (ownedNames.has(key)) continue;

        if (!itemMap.has(key)) {
          itemMap.set(key, {
            name: ing.name,
            normalised: key,
            amount: ing.amount || null,
            unit: ing.unit || '',
            aisle: getAisle(ing.name),
            usedIn: [recipe.title],
            shoppingUrl: buildShoppingLink(ing.name),
            image: ing.image || null,
          });
        } else {
          // Ingredient already in list — just append recipe reference
          const existing = itemMap.get(key);
          if (!existing.usedIn.includes(recipe.title)) {
            existing.usedIn.push(recipe.title);
          }
        }
      }
    }

    const items = Array.from(itemMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Group by aisle
    const grouped = {};
    for (const item of items) {
      if (!grouped[item.aisle]) grouped[item.aisle] = [];
      grouped[item.aisle].push(item);
    }

    res.json({ success: true, items, grouped, total: items.length });
  } catch (error) {
    next(error);
  }
};