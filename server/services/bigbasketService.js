// ── BigBasket URL Builder ─────────────────────────────────────
// BigBasket has no public API. We construct search URLs by pattern.
// All patterns are centralised here — one change point if URLs shift.

const BB_CONFIG = {
  searchBase: 'https://www.bigbasket.com/ps/',
  searchParam: 'q',
};

/**
 * Build a BigBasket search URL for a single ingredient.
 * @param {string} ingredientName
 * @returns {string} URL
 */
export const buildShoppingLink = (ingredientName) => {
  const query = encodeURIComponent(ingredientName.toLowerCase().trim());
  return `${BB_CONFIG.searchBase}?${BB_CONFIG.searchParam}=${query}`;
};

/**
 * Build shopping links for a list of missed ingredients
 * (from Spoonacular's missedIngredients[]).
 *
 * @param {Array<{name: string, image: string, amount: number, unit: string}>} missedIngredients
 * @returns {Array<{name, amount, unit, image, shoppingUrl}>}
 */
export const buildMissedIngredientLinks = (missedIngredients) => {
  if (!Array.isArray(missedIngredients)) return [];

  return missedIngredients.map((item) => ({
    name: item.name,
    amount: item.amount,
    unit: item.unit,
    image: item.image
      ? `https://spoonacular.com/cdn/ingredients_100x100/${item.image}`
      : null,
    shoppingUrl: buildShoppingLink(item.name),
  }));
};
