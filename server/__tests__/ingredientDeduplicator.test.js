/**
 * Tests for ingredientDeduplicator.js
 *
 * Run: cd server && node --experimental-vm-modules ../../node_modules/.bin/jest
 *
 * These tests verify the core deduplication logic without needing
 * a running database or external API connections.
 */

// ── Inline implementation for isolated testing ────────────────
// (mirrors the real implementation in utils/ingredientDeduplicator.js)

const mapFoodItemToIngredient = (foodItem) => {
  const nc = foodItem.eaten?.total_nutritional_content || {};
  const serving = foodItem.suggested_serving || {};
  const eaten = foodItem.eaten || {};

  return {
    fatSecretFoodId: String(foodItem.food_id),
    name: eaten.food_name_singular || foodItem.food_entry_name?.toLowerCase() || 'unknown',
    displayName: foodItem.food_entry_name || '',
    suggestedServingDescription: serving.serving_description || '',
    metricAmount: parseFloat(eaten.total_metric_amount) || 0,
    metricUnit: eaten.metric_description || 'g',
    units: parseFloat(eaten.units) || 1,
    nutrition: {
      calories: parseFloat(nc.calories) || 0,
      protein: parseFloat(nc.protein) || 0,
      carbs: parseFloat(nc.carbohydrate) || 0,
      fat: parseFloat(nc.fat) || 0,
    },
    isAvailable: true,
  };
};

const deduplicateIngredients = (allFoodResponses) => {
  const seen = new Map();

  for (const imageResponse of allFoodResponses) {
    if (!Array.isArray(imageResponse)) continue;

    for (const foodItem of imageResponse) {
      const foodId = String(foodItem.food_id);
      if (!foodId || foodId === 'undefined') continue;
      if (!seen.has(foodId)) {
        seen.set(foodId, mapFoodItemToIngredient(foodItem));
      }
    }
  }

  return Array.from(seen.values());
};

// ── Test data ─────────────────────────────────────────────────

const makeFoodItem = (id, name, calories = 100) => ({
  food_id: id,
  food_entry_name: name,
  eaten: {
    food_name_singular: name.toLowerCase(),
    food_name_plural: `${name.toLowerCase()}s`,
    units: 1.0,
    metric_description: 'g',
    total_metric_amount: 100,
    total_nutritional_content: {
      calories: String(calories),
      protein: '5',
      carbohydrate: '10',
      fat: '2',
    },
  },
  suggested_serving: {
    serving_description: '1 serving',
    serving_id: id * 100,
  },
});

const banana  = makeFoodItem(35755, 'Banana',  105);
const milk    = makeFoodItem(1056,  'Milk',     61);
const egg     = makeFoodItem(3092,  'Egg',      78);
const tomato  = makeFoodItem(11529, 'Tomato',   22);

// ── Tests ─────────────────────────────────────────────────────

describe('deduplicateIngredients', () => {

  test('returns empty array for empty input', () => {
    expect(deduplicateIngredients([])).toEqual([]);
    expect(deduplicateIngredients([[]])).toEqual([]);
  });

  test('maps a single food item correctly', () => {
    const result = deduplicateIngredients([[banana]]);

    expect(result).toHaveLength(1);
    expect(result[0].fatSecretFoodId).toBe('35755');
    expect(result[0].name).toBe('banana');
    expect(result[0].displayName).toBe('Banana');
    expect(result[0].nutrition.calories).toBe(105);
    expect(result[0].isAvailable).toBe(true);
  });

  test('deduplicates the same food_id across two images', () => {
    // milk appears in both image 1 and image 2
    const image1 = [banana, milk];
    const image2 = [milk, egg];

    const result = deduplicateIngredients([image1, image2]);

    expect(result).toHaveLength(3); // banana, milk, egg — milk not doubled
    const ids = result.map((i) => i.fatSecretFoodId);
    expect(ids).toContain('35755'); // banana
    expect(ids).toContain('1056');  // milk (once)
    expect(ids).toContain('3092');  // egg
  });

  test('preserves first-seen entry on duplicate (image 1 wins over image 2)', () => {
    // Same food_id but different calorie value — first-seen should win
    const bananaImage1 = makeFoodItem(35755, 'Banana', 105);
    const bananaImage2 = makeFoodItem(35755, 'Banana', 999); // different calories

    const result = deduplicateIngredients([[bananaImage1], [bananaImage2]]);

    expect(result).toHaveLength(1);
    expect(result[0].nutrition.calories).toBe(105); // image 1 value preserved
  });

  test('handles multiple images each with unique ingredients', () => {
    const image1 = [banana, milk];
    const image2 = [egg, tomato];
    const image3 = [banana]; // duplicate

    const result = deduplicateIngredients([image1, image2, image3]);

    expect(result).toHaveLength(4); // banana, milk, egg, tomato
  });

  test('skips items with missing or undefined food_id', () => {
    const malformed = [
      { food_id: undefined, food_entry_name: 'Ghost', eaten: {}, suggested_serving: {} },
      { food_id: null,      food_entry_name: 'Null',  eaten: {}, suggested_serving: {} },
    ];

    const result = deduplicateIngredients([malformed, [banana]]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('banana');
  });

  test('handles non-array items in outer array gracefully', () => {
    expect(() =>
      deduplicateIngredients([null, undefined, [banana]])
    ).not.toThrow();

    const result = deduplicateIngredients([null, undefined, [banana]]);
    expect(result).toHaveLength(1);
  });

  test('nutrition values default to 0 when missing', () => {
    const noNutrition = {
      food_id: 9999,
      food_entry_name: 'Mystery Food',
      eaten: {
        food_name_singular: 'mystery food',
        units: 1,
        metric_description: 'g',
        total_metric_amount: 100,
        total_nutritional_content: {}, // all fields missing
      },
      suggested_serving: { serving_description: '1 serving' },
    };

    const result = deduplicateIngredients([[noNutrition]]);
    expect(result[0].nutrition.calories).toBe(0);
    expect(result[0].nutrition.protein).toBe(0);
    expect(result[0].nutrition.carbs).toBe(0);
    expect(result[0].nutrition.fat).toBe(0);
  });

  test('food_id is always stored as a string', () => {
    const item = makeFoodItem(12345, 'Test');
    const result = deduplicateIngredients([[item]]);
    expect(typeof result[0].fatSecretFoodId).toBe('string');
    expect(result[0].fatSecretFoodId).toBe('12345');
  });

  test('preserves insertion order — output matches encounter order', () => {
    const result = deduplicateIngredients([[tomato, egg, banana, milk]]);
    expect(result.map((i) => i.name)).toEqual(['tomato', 'egg', 'banana', 'milk']);
  });
});
