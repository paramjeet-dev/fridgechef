/**
 * Derives a difficulty label from recipe data already returned by Spoonacular.
 * No extra API call needed — uses cookTime, step count, and ingredient count.
 *
 * Scoring (0–100):
 *   cookTime     0–40 pts  (>60 min = 40, 30–60 = 20, <30 = 0)
 *   steps        0–30 pts  (>10 = 30, 5–10 = 15, <5 = 0)
 *   ingredients  0–30 pts  (>12 = 30, 6–12 = 15, <6 = 0)
 *
 * Result:
 *   0–30  → easy
 *   31–60 → medium
 *   61–100 → hard
 */
export const getDifficulty = ({ cookTime = 0, instructions = [], ingredients = [] } = {}) => {
  let score = 0;

  // Cook time component
  if (cookTime > 60)      score += 40;
  else if (cookTime > 30) score += 20;

  // Step count component
  const stepCount = instructions.length;
  if (stepCount > 10)     score += 30;
  else if (stepCount > 4) score += 15;

  // Ingredient count component
  const ingCount = ingredients.length;
  if (ingCount > 12)      score += 30;
  else if (ingCount > 5)  score += 15;

  if (score <= 30) return 'easy';
  if (score <= 60) return 'medium';
  return 'hard';
};

export const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   color: 'bg-brand-100 text-brand-700'   },
  medium: { label: 'Medium', color: 'bg-accent-100 text-accent-600' },
  hard:   { label: 'Hard',   color: 'bg-red-100 text-red-600'       },
};