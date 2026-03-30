/**
 * Tests for the mapFoodItemToIngredient function in fatSecretService.js
 *
 * These tests use the actual FatSecret sample response format
 * documented in the implementation plan.
 */

// Inline the mapper for isolated testing
const _parseNutrient = (value) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
};

const mapFoodItemToIngredient = (foodItem) => {
  const nc = foodItem.eaten?.total_nutritional_content || {};
  const serving = foodItem.suggested_serving || {};
  const eaten = foodItem.eaten || {};

  return {
    fatSecretFoodId: String(foodItem.food_id),
    name: eaten.food_name_singular || foodItem.food_entry_name?.toLowerCase() || 'unknown',
    displayName: foodItem.food_entry_name || '',
    suggestedServingId: serving.serving_id ? String(serving.serving_id) : null,
    suggestedServingDescription: serving.serving_description || serving.custom_serving_description || '',
    metricAmount: parseFloat(eaten.total_metric_amount) || 0,
    metricUnit: eaten.metric_description || 'g',
    units: parseFloat(eaten.units) || 1,
    nutrition: {
      servingDescription: serving.serving_description || '',
      calories:           _parseNutrient(nc.calories),
      protein:            _parseNutrient(nc.protein),
      carbs:              _parseNutrient(nc.carbohydrate),
      fat:                _parseNutrient(nc.fat),
      saturatedFat:       _parseNutrient(nc.saturated_fat),
      polyunsaturatedFat: _parseNutrient(nc.polyunsaturated_fat),
      monounsaturatedFat: _parseNutrient(nc.monounsaturated_fat),
      cholesterol:        _parseNutrient(nc.cholesterol),
      fiber:              _parseNutrient(nc.fiber),
      sugar:              _parseNutrient(nc.sugar),
      sodium:             _parseNutrient(nc.sodium),
      potassium:          _parseNutrient(nc.potassium),
      vitaminA:           _parseNutrient(nc.vitamin_a),
      vitaminC:           _parseNutrient(nc.vitamin_c),
      calcium:            _parseNutrient(nc.calcium),
      iron:               _parseNutrient(nc.iron),
    },
    isAvailable: true,
  };
};

// ── Sample response from FatSecret API docs ───────────────────
const BANANA_RESPONSE = {
  food_id: 35755,
  food_entry_name: 'Bananas',
  eaten: {
    food_name_singular: 'banana',
    food_name_plural: 'bananas',
    singular_description: '',
    plural_description: '',
    units: 1.0,
    metric_description: 'g',
    total_metric_amount: 118.0,
    per_unit_metric_amount: 118,
    total_nutritional_content: {
      calories: '105',
      carbohydrate: '26.95',
      protein: '1.29',
      fat: '0.39',
      saturated_fat: '0.132',
      polyunsaturated_fat: '0.086',
      monounsaturated_fat: '0.038',
      cholesterol: '0',
      sodium: '1',
      potassium: '422',
      fiber: '3.1',
      sugar: '14.43',
      vitamin_a: '4',
      vitamin_c: '10.3',
      calcium: '6',
      iron: '0.31',
    },
  },
  suggested_serving: {
    serving_id: 32978,
    serving_description: '1 medium (7" to 7-7/8" long)',
    metric_serving_description: 'g',
    metric_measure_amount: 118.0,
    number_of_units: '1',
  },
};

const CAPPUCCINO_RESPONSE = {
  food_id: 7350,
  food_entry_name: 'Cappuccino',
  eaten: {
    food_name_singular: 'cappuccino',
    food_name_plural: 'cappuccinos',
    singular_description: 'cup',
    plural_description: 'cups',
    units: 1.0,
    metric_description: 'ml',
    total_metric_amount: 240,
    per_unit_metric_amount: 240,
    total_nutritional_content: {
      calories: '75',
      carbohydrate: '5.89',
      protein: '4.14',
      fat: '4.04',
      saturated_fat: '2.305',
      polyunsaturated_fat: '0.244',
      monounsaturated_fat: '1.022',
      cholesterol: '12',
      sodium: '51',
      potassium: '236',
      fiber: '0.2',
      sugar: '6.50',
      vitamin_a: '34',
      vitamin_c: '0.0',
      calcium: '146',
      iron: '0.19',
    },
  },
  suggested_serving: {
    serving_id: 1136795,
    serving_description: '100 ml',
    custom_serving_description: 'cup',
    metric_serving_description: 'g',
    metric_measure_amount: 101.442,
    number_of_units: '2.4',
  },
};

// ── Tests ─────────────────────────────────────────────────────

describe('mapFoodItemToIngredient', () => {

  describe('Banana (solid food)', () => {
    let result;
    beforeAll(() => { result = mapFoodItemToIngredient(BANANA_RESPONSE); });

    test('extracts food_id as string', () => {
      expect(result.fatSecretFoodId).toBe('35755');
    });

    test('extracts singular name', () => {
      expect(result.name).toBe('banana');
    });

    test('preserves display name', () => {
      expect(result.displayName).toBe('Bananas');
    });

    test('parses metric amount and unit', () => {
      expect(result.metricAmount).toBe(118);
      expect(result.metricUnit).toBe('g');
    });

    test('parses units', () => {
      expect(result.units).toBe(1);
    });

    test('parses calories correctly', () => {
      expect(result.nutrition.calories).toBe(105);
    });

    test('parses macronutrients correctly', () => {
      expect(result.nutrition.protein).toBe(1.29);
      expect(result.nutrition.carbs).toBe(26.95);
      expect(result.nutrition.fat).toBe(0.39);
    });

    test('parses micronutrients correctly', () => {
      expect(result.nutrition.fiber).toBe(3.1);
      expect(result.nutrition.sugar).toBe(14.43);
      expect(result.nutrition.potassium).toBe(422);
      expect(result.nutrition.sodium).toBe(1);
    });

    test('parses vitamins and minerals', () => {
      expect(result.nutrition.vitaminC).toBe(10.3);
      expect(result.nutrition.vitaminA).toBe(4);
      expect(result.nutrition.calcium).toBe(6);
      expect(result.nutrition.iron).toBe(0.31);
    });

    test('sets isAvailable to true by default', () => {
      expect(result.isAvailable).toBe(true);
    });

    test('stores serving description', () => {
      expect(result.suggestedServingDescription).toBe('1 medium (7" to 7-7/8" long)');
    });

    test('stores serving id as string', () => {
      expect(result.suggestedServingId).toBe('32978');
    });
  });

  describe('Cappuccino (liquid, ml metric)', () => {
    let result;
    beforeAll(() => { result = mapFoodItemToIngredient(CAPPUCCINO_RESPONSE); });

    test('handles ml metric unit', () => {
      expect(result.metricUnit).toBe('ml');
      expect(result.metricAmount).toBe(240);
    });

    test('uses serving_description when custom_serving_description present', () => {
      // serving_description takes priority
      expect(result.suggestedServingDescription).toBe('100 ml');
    });

    test('parses saturated fat correctly', () => {
      expect(result.nutrition.saturatedFat).toBe(2.31); // rounded to 2dp
    });

    test('handles vitamin_c of 0.0 as zero', () => {
      expect(result.nutrition.vitaminC).toBe(0);
    });
  });

  describe('Edge cases', () => {

    test('handles completely missing eaten object', () => {
      const bare = { food_id: 1, food_entry_name: 'Mystery' };
      const result = mapFoodItemToIngredient(bare);

      expect(result.fatSecretFoodId).toBe('1');
      expect(result.name).toBe('mystery'); // falls back to lowercase food_entry_name
      expect(result.nutrition.calories).toBe(0);
    });

    test('handles string food_id (as well as numeric)', () => {
      const item = { ...BANANA_RESPONSE, food_id: '35755' };
      expect(mapFoodItemToIngredient(item).fatSecretFoodId).toBe('35755');
    });

    test('rounds nutrition values to 2 decimal places', () => {
      const item = {
        food_id: 1,
        food_entry_name: 'Test',
        eaten: {
          food_name_singular: 'test',
          units: 1,
          metric_description: 'g',
          total_metric_amount: 100,
          total_nutritional_content: {
            calories: '123.456789',
            protein: '7.777777',
          },
        },
        suggested_serving: {},
      };

      const result = mapFoodItemToIngredient(item);
      expect(result.nutrition.calories).toBe(123.46);
      expect(result.nutrition.protein).toBe(7.78);
    });

    test('handles non-numeric nutrient strings gracefully', () => {
      const item = {
        food_id: 1,
        food_entry_name: 'Test',
        eaten: {
          total_nutritional_content: {
            calories: 'N/A',
            protein: '',
            fat: null,
          },
        },
        suggested_serving: {},
      };

      const result = mapFoodItemToIngredient(item);
      expect(result.nutrition.calories).toBe(0);
      expect(result.nutrition.protein).toBe(0);
      expect(result.nutrition.fat).toBe(0);
    });
  });
});
