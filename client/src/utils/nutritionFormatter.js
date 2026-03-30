/**
 * Formats a raw nutrition value for display.
 * Returns null if the value is zero or missing (avoids showing "0g" rows).
 *
 * @param {number} value - Raw numeric value
 * @param {number} decimals - Decimal places (default 1)
 * @returns {string|null}
 */
export const formatNutrient = (value, decimals = 1) => {
  const num = parseFloat(value);
  if (isNaN(num) || num === 0) return null;
  return num.toFixed(decimals);
};

/**
 * Returns a colour class based on calorie density.
 * Used to colour-code ingredient cards by caloric value.
 */
export const calorieColour = (calories) => {
  if (calories < 50)  return 'text-brand-500';   // Low cal — green
  if (calories < 200) return 'text-amber-500';   // Medium — amber
  return 'text-red-500';                         // High — red
};

/**
 * Calculates the macronutrient percentage breakdown.
 * Returns { proteinPct, carbsPct, fatPct } as integers summing to ~100.
 */
export const macroPercentages = ({ protein = 0, carbs = 0, fat = 0 }) => {
  const proteinCal = protein * 4;
  const carbsCal   = carbs   * 4;
  const fatCal     = fat     * 9;
  const total      = proteinCal + carbsCal + fatCal;

  if (total === 0) return { proteinPct: 0, carbsPct: 0, fatPct: 0 };

  return {
    proteinPct: Math.round((proteinCal / total) * 100),
    carbsPct:   Math.round((carbsCal   / total) * 100),
    fatPct:     Math.round((fatCal     / total) * 100),
  };
};
