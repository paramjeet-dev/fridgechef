import { getDifficulty, DIFFICULTY_CONFIG } from '../../utils/difficultyScorer';

export default function DifficultyBadge({ recipe, className = '' }) {
  if (!recipe) return null;
  const level = getDifficulty(recipe);
  const { label, color } = DIFFICULTY_CONFIG[level];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}
      aria-label={`Difficulty: ${label}`}
    >
      {level === 'easy'   && '🟢'}
      {level === 'medium' && '🟡'}
      {level === 'hard'   && '🔴'}
      {label}
    </span>
  );
}