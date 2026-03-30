import NodeCache from 'node-cache';
import logger from './logger.js';

// TTL values in seconds
const TTL = {
  RECIPE_SEARCH: 10 * 60,    // 10 min — search results change with ingredients
  SIMILAR:       30 * 60,    // 30 min — similar recipes are stable
  MEAL_PLAN:     60 * 60,    // 1 hour — generated plans don't change often
};

const cache = new NodeCache({
  stdTTL: TTL.RECIPE_SEARCH,
  checkperiod: 120,           // Check for expired keys every 2 minutes
  useClones: false,           // Faster — don't deep-clone on get/set
});

cache.on('expired', (key) => {
  logger.debug(`Cache expired: ${key}`);
});

/**
 * Get a cached value by key.
 * Returns undefined on miss.
 */
export const cacheGet = (key) => cache.get(key);

/**
 * Set a value with an optional TTL override.
 */
export const cacheSet = (key, value, ttl) => {
  cache.set(key, value, ttl || TTL.RECIPE_SEARCH);
};

/**
 * Delete a specific cache key.
 */
export const cacheDel = (key) => cache.del(key);

/**
 * Wraps an async function with cache-aside logic.
 * On hit: returns cached value immediately.
 * On miss: calls fn(), caches the result, and returns it.
 *
 * Usage:
 *   const data = await withCache(`similar:${id}`, TTL.SIMILAR, () => fetchSimilar(id));
 */
export const withCache = async (key, ttl, fn) => {
  const hit = cacheGet(key);
  if (hit !== undefined) {
    logger.debug(`Cache hit: ${key}`);
    return hit;
  }

  const result = await fn();
  cacheSet(key, result, ttl);
  logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
  return result;
};

export { TTL };
export default cache;
