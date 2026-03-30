import Bottleneck from 'bottleneck';
import axios from 'axios';
import logger from '../utils/logger.js';

const SPOONACULAR_BASE = 'https://api.spoonacular.com';

// ── Rate limiter: 60 requests / 60 seconds ────────────────────
const limiter = new Bottleneck({
  reservoir: 60,                    // Start with 60 tokens
  reservoirRefreshAmount: 60,       // Refill to 60…
  reservoirRefreshInterval: 60000,  // …every 60 seconds
  maxConcurrent: 5,                 // Max 5 in-flight at once
  minTime: 200,                     // At least 200ms between requests
});

// Track remaining tokens for observability
limiter.on('depleted', () => {
  logger.warn('Spoonacular rate limiter: token reservoir depleted — requests queuing');
});

// ── Retry logic on 429 ────────────────────────────────────────
limiter.on('failed', async (error, jobInfo) => {
  if (error.response?.status === 429) {
    const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
    logger.warn(`Spoonacular 429 — retrying after ${retryAfter}s (attempt ${jobInfo.retryCount + 1})`);
    if (jobInfo.retryCount < 2) {
      return retryAfter * 1000; // Return delay in ms — Bottleneck will retry
    }
  }
});

limiter.on('retry', (_error, jobInfo) => {
  logger.info(`Spoonacular retry #${jobInfo.retryCount}`);
});

// ── Core fetch function ────────────────────────────────────────
/**
 * Wraps an axios GET through the Bottleneck queue.
 * All Spoonacular calls must use this — never call axios directly.
 *
 * @param {string} path    - API path e.g. '/recipes/findByIngredients'
 * @param {Object} params  - Query params (apiKey injected automatically)
 * @returns {Promise<Object>} Parsed JSON response body
 */
export const spoonacularGet = limiter.wrap(async (path, params = {}) => {
  const url = `${SPOONACULAR_BASE}${path}`;
  logger.debug(`Spoonacular GET: ${path}`);

  const response = await axios.get(url, {
    params: {
      ...params,
      apiKey: process.env.SPOONACULAR_API_KEY,
    },
    timeout: 15000,
  });

  return response.data;
});

/**
 * Returns current queue depth — used to surface loading state to clients.
 */
export const getQueueDepth = () => limiter.counts().QUEUED;
