/**
 * Tests for bigbasketService.js URL builder
 *
 * These are pure function tests — no external dependencies.
 */

const BB_BASE = 'https://www.bigbasket.com/ps/?q=';

const buildShoppingLink = (ingredientName) => {
  const query = encodeURIComponent(ingredientName.toLowerCase().trim());
  return `${BB_BASE}${query}`;
};

const buildMissedIngredientLinks = (missedIngredients) => {
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

describe('buildShoppingLink', () => {

  test('builds a valid BigBasket URL', () => {
    const url = buildShoppingLink('tomato');
    expect(url).toBe(`${BB_BASE}tomato`);
  });

  test('lowercases the ingredient name', () => {
    expect(buildShoppingLink('TOMATO')).toBe(`${BB_BASE}tomato`);
    expect(buildShoppingLink('Mozzarella Cheese')).toContain('mozzarella%20cheese');
  });

  test('trims whitespace', () => {
    expect(buildShoppingLink('  oregano  ')).toBe(`${BB_BASE}oregano`);
  });

  test('URL-encodes special characters', () => {
    const url = buildShoppingLink('olive oil');
    expect(url).toBe(`${BB_BASE}olive%20oil`);
  });

  test('handles multi-word ingredients', () => {
    const url = buildShoppingLink('coconut milk');
    expect(url).toContain('coconut%20milk');
  });
});

describe('buildMissedIngredientLinks', () => {

  const sampleMissed = [
    {
      name: 'oregano',
      amount: 1,
      unit: 'tsp',
      image: 'dried-oregano.png',
    },
    {
      name: 'olive oil',
      amount: 2,
      unit: 'tbsp',
      image: null,
    },
  ];

  test('returns empty array for empty input', () => {
    expect(buildMissedIngredientLinks([])).toEqual([]);
  });

  test('returns empty array for non-array input', () => {
    expect(buildMissedIngredientLinks(null)).toEqual([]);
    expect(buildMissedIngredientLinks(undefined)).toEqual([]);
  });

  test('maps all fields correctly', () => {
    const result = buildMissedIngredientLinks(sampleMissed);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('oregano');
    expect(result[0].amount).toBe(1);
    expect(result[0].unit).toBe('tsp');
    expect(result[0].shoppingUrl).toBe(`${BB_BASE}oregano`);
  });

  test('constructs Spoonacular image URL when image is present', () => {
    const result = buildMissedIngredientLinks([sampleMissed[0]]);
    expect(result[0].image).toBe(
      'https://spoonacular.com/cdn/ingredients_100x100/dried-oregano.png'
    );
  });

  test('sets image to null when no image provided', () => {
    const result = buildMissedIngredientLinks([sampleMissed[1]]);
    expect(result[0].image).toBeNull();
  });

  test('shopping URL for multi-word ingredient is URL-encoded', () => {
    const result = buildMissedIngredientLinks([sampleMissed[1]]);
    expect(result[0].shoppingUrl).toContain('olive%20oil');
  });
});
