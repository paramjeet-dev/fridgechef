import { getDifficulty, DIFFICULTY_CONFIG } from '../../utils/difficultyScorer';

const DARK_CONFIG = {
  easy:   { label: 'Easy',   className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  medium: { label: 'Medium', className: 'bg-amber-500/20  text-amber-400  border border-amber-500/30'  },
  hard:   { label: 'Hard',   className: 'bg-red-500/20    text-red-400    border border-red-500/30'    },
};

export default function DifficultyBadge({ recipe, className = '' }) {
  if (!recipe) return null;
  const level = getDifficulty(recipe);
  const { label, className: cls } = DARK_CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
      {level === 'easy'   && '🟢'}
      {level === 'medium' && '🟡'}
      {level === 'hard'   && '🔴'}
      {label}
    </span>
  );
}