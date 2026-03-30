import axios from 'axios';
import logger from '../utils/logger.js';

// ── Token Cache ───────────────────────────────────────────────
// In-memory cache — sufficient for single-instance deploys.
// For multi-instance (clustered), swap this for Redis.
let tokenCache = {
  accessToken: null,
  expiresAt: null,   // Unix timestamp (ms)
};

const FATSECRET_TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const FATSECRET_RECOGNITION_URL = 'https://platform.fatsecret.com/rest/image-recognition/v2';

// ── OAuth2: Get or refresh access token ──────────────────────
const getAccessToken = async () => {
  const now = Date.now();
  const bufferMs = 60 * 1000; // Refresh 60s before expiry — prevents mid-request expiry

  if (tokenCache.accessToken && tokenCache.expiresAt && (now + bufferMs) < tokenCache.expiresAt) {
    return tokenCache.accessToken; // Valid cached token
  }

  logger.debug('FatSecret: fetching new OAuth2 access token...');

  const credentials = Buffer.from(
    `${process.env.FATSECRET_CLIENT_ID}:${process.env.FATSECRET_CLIENT_SECRET}`
  ).toString('base64');

  const response = await axios.post(
    FATSECRET_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'image-recognition',
    }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const { access_token, expires_in } = response.data;

  tokenCache = {
    accessToken: access_token,
    expiresAt: now + expires_in * 1000, // expires_in is in seconds
  };

  logger.debug(`FatSecret: new token acquired, expires in ${expires_in}s`);
  return access_token;
};

// ── Core: Recognise ingredients from one base64 image ────────
/**
 * Calls FatSecret /rest/image-recognition/v2 for a single image.
 *
 * @param {string} base64Image - Base64-encoded image string (no data URI prefix)
 * @param {Array}  alreadyFound - Ingredients found in previous images (for context)
 * @returns {Promise<Array>} food_response array from FatSecret
 */
export const recognizeImage = async (base64Image, alreadyFound = []) => {
  const token = await getAccessToken();

  const payload = {
    image_b64: base64Image,
    include_food_data: true,
    region: 'IN',
    language: 'en',
    // Pass previously found foods to improve contextual recognition
    // on subsequent images in the same upload session
    eaten_foods: alreadyFound.map((ingredient) => ({
      food_id: parseInt(ingredient.fatSecretFoodId, 10),
      food_name: ingredient.name,
      food_brand: null,
      serving_description: ingredient.suggestedServingDescription || 'serving',
      serving_size: ingredient.units || 1,
    })),
  };

  try {
    const response = await axios.post(FATSECRET_RECOGNITION_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30s — recognition can be slow on large images
    });

    const foodResponse = response.data?.food_response;

    if (!Array.isArray(foodResponse)) {
      logger.warn('FatSecret: unexpected response shape', response.data);
      return [];
    }

    logger.debug(`FatSecret: detected ${foodResponse.length} items`);
    return foodResponse;

  } catch (error) {
    // Log the full FatSecret error but re-throw so uploadController can handle it
    const status = error.response?.status;
    const detail = error.response?.data?.error_description || error.message;
    logger.error(`FatSecret recognition failed [${status}]: ${detail}`);
    throw error;
  }
};

// ── Mapper: FatSecret food_response item → Ingredient shape ──
/**
 * Converts a single item from FatSecret's food_response array
 * into the shape expected by our Ingredient Mongoose model.
 *
 * @param {Object} foodItem - Single item from food_response[]
 * @returns {Object} Ingredient-compatible object (without uploadId/userId)
 */
export const mapFoodItemToIngredient = (foodItem) => {
  const nc = foodItem.eaten?.total_nutritional_content || {};
  const serving = foodItem.suggested_serving || {};
  const eaten = foodItem.eaten || {};

  return {
    fatSecretFoodId: String(foodItem.food_id),
    name: eaten.food_name_singular || foodItem.food_entry_name?.toLowerCase() || 'unknown',
    displayName: foodItem.food_entry_name || '',

    // Serving info
    suggestedServingId: serving.serving_id ? String(serving.serving_id) : null,
    suggestedServingDescription: serving.serving_description || serving.custom_serving_description || '',
    metricAmount: parseFloat(eaten.total_metric_amount) || 0,
    metricUnit: eaten.metric_description || 'g',
    units: parseFloat(eaten.units) || 1,

    // Nutrition — all values parsed to floats with 0 fallback
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

// ── Helper ───────────────────────────────────────────────────
const _parseNutrient = (value) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100; // Round to 2dp
};
