import { mapFoodItemToIngredient } from '../services/fatSecretService.js';

/**
 * Deduplicates FatSecret food_response results across multiple images.
 *
 * Strategy: use food_id as the canonical unique key.
 * The same food_id appearing in image 1 and image 2 is ONE ingredient.
 * No fuzzy string matching needed — FatSecret handles normalisation.
 *
 * @param {Array<Array>} allFoodResponses - Array of food_response arrays,
 *   one per uploaded image. e.g. [[banana, milk], [milk, egg]]
 * @returns {Array<Object>} Deduplicated array of mapped Ingredient objects
 */
export const deduplicateIngredients = (allFoodResponses) => {
  // Flatten all responses and index by food_id
  // Map preserves insertion order — first-seen wins on duplicate
  const seen = new Map();

  for (const imageResponse of allFoodResponses) {
    if (!Array.isArray(imageResponse)) continue;

    for (const foodItem of imageResponse) {
      const foodId = String(foodItem.food_id);

      if (!foodId || foodId === 'undefined') {
        continue; // Skip malformed items
      }

      if (!seen.has(foodId)) {
        seen.set(foodId, mapFoodItemToIngredient(foodItem));
      }
      // Duplicate food_id: already in map — skip
    }
  }

  return Array.from(seen.values());
};

/**
 * Extracts a simple array of ingredient names from deduplicated ingredients.
 * Used when querying Spoonacular — it expects a comma-separated name list.
 *
 * @param {Array<Object>} ingredients - Deduplicated ingredient objects
 * @returns {string[]} Array of ingredient name strings
 */
export const extractIngredientNames = (ingredients) => {
  return ingredients
    .filter((i) => i.isAvailable)
    .map((i) => i.name)
    .filter(Boolean);
};
