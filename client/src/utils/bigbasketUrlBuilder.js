const BB_SEARCH_BASE = 'https://www.bigbasket.com/ps/?q=';

/**
 * Build a BigBasket search URL for a single ingredient name.
 * @param {string} name
 * @returns {string}
 */
export const buildBigBasketUrl = (name) =>
  `${BB_SEARCH_BASE}${encodeURIComponent(name.toLowerCase().trim())}`;

/**
 * Build a bulk BigBasket URL for multiple ingredients.
 * Opens the first ingredient search — BigBasket doesn't reliably support
 * multi-item queries in one URL, so we join with spaces as a best-effort.
 * @param {string[]} names
 * @returns {string}
 */
export const buildBulkBigBasketUrl = (names) =>
  `${BB_SEARCH_BASE}${names.map((n) => encodeURIComponent(n)).join('+')}`;
