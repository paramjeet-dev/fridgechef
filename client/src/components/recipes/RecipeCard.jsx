import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { favoriteApi } from '../../api/recipeApi';
import DifficultyBadge from './DifficultyBadge';
import toast from 'react-hot-toast';

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
      <div className="border-t border-white/10 pt-3 mt-3 space-y-1.5">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Missing ingredients</p>
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {item.image && <img src={item.image} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />}
              <span className="text-xs text-text-secondary capitalize truncate">
                {item.amount ? `${Number(item.amount).toFixed(item.amount % 1 === 0 ? 0 : 1)} ${item.unit || ''} ` : ''}{item.name}
              </span>
            </div>
            {item.shoppingUrl && (
              <a href={item.shoppingUrl} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 text-xs font-semibold text-cyan-400 hover:text-cyan-300
                           border border-cyan-500/30 hover:border-cyan-400/50 hover:bg-cyan-500/10
                           px-2 py-0.5 rounded-lg transition-all">
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
  const [isFav, setIsFav]             = useState(recipe.isFavorited ?? false);
  const [isTogglingFav, setToggling]  = useState(false);
  const [showMissing, setShowMissing] = useState(false);

  const {
    spoonacularId, title, image, cookTime,
    matchPercent = 0, missedIngredientCount = 0,
    missedIngredients = [], diets = [], cuisines = [],
    instructions = [], ingredients = [],
  } = recipe;

  const handleFav = async (e) => {
    e.stopPropagation();
    setToggling(true);
    try {
      if (isFav) { await favoriteApi.remove(spoonacularId); setIsFav(false); toast.success('Removed from favourites'); }
      else        { await favoriteApi.add(spoonacularId);   setIsFav(true);  toast.success('Added to favourites'); }
    } catch { toast.error('Failed to update favourites'); }
    finally { setToggling(false); }
  };

  const handleMissing = (e) => { e.stopPropagation(); setShowMissing((v) => !v); };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93 }}
      whileHover={{ y: -6, scale: 1.02, rotate: 0.3 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      onClick={() => navigate(`/recipes/${spoonacularId}`)}
      className="card overflow-hidden cursor-pointer group"
      role="button" tabIndex={0}
      aria-label={`View recipe: ${title}`}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/recipes/${spoonacularId}`)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-white/5 overflow-hidden">
        {image ? (
          <img src={image} alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Match % */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${
            matchPercent >= 80 ? 'bg-brand-600/90 text-white'
            : matchPercent >= 50 ? 'bg-amber-500/90 text-white'
            : 'bg-black/50 text-white/80'
          }`}>
            {matchPercent}% match
          </span>
        </div>

        {/* Difficulty */}
        <div className="absolute bottom-2 left-2">
          <DifficultyBadge recipe={{ cookTime, instructions, ingredients }} />
        </div>

        {/* Heart */}
        <motion.button
          onClick={handleFav} disabled={isTogglingFav}
          whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full backdrop-blur-sm
            flex items-center justify-center transition-all duration-200
            ${isFav ? 'bg-red-500/90 text-white' : 'bg-black/40 text-white/70 hover:bg-red-500/80 hover:text-white'}
            opacity-0 group-hover:opacity-100 focus-visible:opacity-100`}
          aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
        >
          <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </motion.button>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-bold text-text-primary leading-snug line-clamp-2 mb-2">{title}</h3>

        <div className="flex items-center gap-3 text-xs text-text-muted mb-2">
          {cookTime && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2"/>
              </svg>
              {cookTime} min
            </span>
          )}
          {missedIngredientCount > 0 && (
            <button onClick={handleMissing}
              className={`flex items-center gap-1 font-medium transition-colors
                ${showMissing ? 'text-amber-400' : 'text-amber-500/80 hover:text-amber-400'}`}
              aria-expanded={showMissing}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              {missedIngredientCount} missing
              <svg className={`w-3 h-3 transition-transform ${showMissing ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          )}
        </div>

        {(diets.length > 0 || cuisines.length > 0) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {[...cuisines.slice(0, 1), ...diets.slice(0, 2)].map((tag) => (
              <span key={tag} className="badge-slate capitalize">{tag}</span>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showMissing && <MissingPanel items={missedIngredients} />}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}