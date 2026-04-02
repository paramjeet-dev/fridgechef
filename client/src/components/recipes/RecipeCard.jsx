import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { favoriteApi } from '../../api/recipeApi';
import DifficultyBadge from './DifficultyBadge';
import toast from 'react-hot-toast';

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg className="w-4 h-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

// ── Inline missing-ingredients panel ─────────────────────────
function MissingPanel({ items }) {
  if (!items?.length) return null;
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="border-t border-slate-100 pt-3 mt-3 space-y-1.5">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
          Missing ingredients
        </p>
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {item.image && (
                <img src={item.image} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
              )}
              <span className="text-xs text-text-primary capitalize truncate">
                {item.amount ? `${Number(item.amount).toFixed(item.amount % 1 === 0 ? 0 : 1)} ${item.unit || ''} ` : ''}
                {item.name}
              </span>
            </div>
            {item.shoppingUrl && (
              <a
                href={item.shoppingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700
                           border border-brand-200 hover:border-brand-400 hover:bg-brand-50
                           px-2 py-0.5 rounded-lg transition-colors"
                aria-label={`Buy ${item.name}`}
              >
                Buy
              </a>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function RecipeCard({ recipe }) {
  const navigate = useNavigate();
  const [isFav, setIsFav]                 = useState(recipe.isFavorited ?? false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [showMissing, setShowMissing]     = useState(false);

  const {
    spoonacularId, title, image, cookTime,
    matchPercent = 0, missedIngredientCount = 0,
    missedIngredients = [],
    diets = [], cuisines = [],
    instructions = [], ingredients = [],
  } = recipe;

  const handleFavToggle = async (e) => {
    e.stopPropagation();
    setIsTogglingFav(true);
    try {
      if (isFav) {
        await favoriteApi.remove(spoonacularId);
        setIsFav(false);
        toast.success('Removed from favourites');
      } else {
        await favoriteApi.add(spoonacularId);
        setIsFav(true);
        toast.success('Added to favourites');
      }
    } catch {
      toast.error('Failed to update favourites');
    } finally {
      setIsTogglingFav(false);
    }
  };

  const handleMissingClick = (e) => {
    e.stopPropagation();
    setShowMissing((v) => !v);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.25 }}
      onClick={() => navigate(`/recipes/${spoonacularId}`)}
      className="card overflow-hidden cursor-pointer group"
      role="button"
      tabIndex={0}
      aria-label={`View recipe: ${title}`}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/recipes/${spoonacularId}`)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {image ? (
          <img src={image} alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl" aria-hidden="true">🍽️</div>
        )}

        {/* Match % badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            matchPercent >= 80 ? 'bg-brand-500 text-white'
            : matchPercent >= 50 ? 'bg-accent-400 text-white'
            : 'bg-white/90 text-text-secondary'
          }`}>
            {matchPercent}% match
          </span>
        </div>

        {/* Difficulty badge */}
        <div className="absolute bottom-2 left-2">
          <DifficultyBadge recipe={{ cookTime, instructions, ingredients }} />
        </div>

        {/* Favourite button */}
        <button
          onClick={handleFavToggle}
          disabled={isTogglingFav}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center
            bg-white/90 hover:bg-white shadow-sm transition-all duration-150
            ${isFav ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}
            opacity-0 group-hover:opacity-100 focus-visible:opacity-100`}
          aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
          aria-pressed={isFav}
        >
          <HeartIcon filled={isFav} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-text-primary leading-snug line-clamp-2 mb-2">
          {title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
          {cookTime && (
            <span className="flex items-center gap-1">
              <ClockIcon />{cookTime} min
            </span>
          )}
          {/* Missing count — now a clickable toggle */}
          {missedIngredientCount > 0 && (
            <button
              onClick={handleMissingClick}
              className={`flex items-center gap-1 font-medium transition-colors ${
                showMissing ? 'text-accent-600' : 'text-accent-500 hover:text-accent-600'
              }`}
              aria-expanded={showMissing}
              aria-label={`${showMissing ? 'Hide' : 'Show'} ${missedIngredientCount} missing ingredients`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {missedIngredientCount} missing
              <svg className={`w-3 h-3 transition-transform ${showMissing ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Diet tags */}
        {(diets.length > 0 || cuisines.length > 0) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {[...cuisines.slice(0, 1), ...diets.slice(0, 2)].map((tag) => (
              <span key={tag} className="badge-slate capitalize">{tag}</span>
            ))}
          </div>
        )}

        {/* Expandable missing ingredients panel */}
        <AnimatePresence>
          {showMissing && (
            <MissingPanel items={missedIngredients} />
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
