import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { favoriteApi } from '../api/recipeApi';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner, EmptyState, SkeletonCard } from '../components/shared/index';
import { Link } from 'react-router-dom';
import DifficultyBadge from '../components/recipes/DifficultyBadge';
import toast from 'react-hot-toast';

function FavoriteCard({ recipe, onRemove }) {
  const navigate = useNavigate();
  const [removing, setRemoving] = useState(false);

  const handleRemove = async (e) => {
    e.stopPropagation();
    setRemoving(true);
    try {
      await favoriteApi.remove(recipe.spoonacularId);
      toast.success('Removed from favourites');
      onRemove(recipe.spoonacularId);   // ← removes from local state immediately
    } catch {
      toast.error('Failed to remove favourite');
      setRemoving(false);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: removing ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.25 }}
      onClick={() => navigate(`/recipes/${recipe.spoonacularId}`)}
      className="card overflow-hidden cursor-pointer group hover:shadow-card-hover transition-shadow duration-200"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/recipes/${recipe.spoonacularId}`)}
      aria-label={`View ${recipe.title}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
        )}

        {/* Remove heart button */}
        <button
          onClick={handleRemove}
          disabled={removing}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm
                     flex items-center justify-center text-red-500 hover:text-red-600
                     opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-150"
          aria-label="Remove from favourites"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-text-primary leading-snug line-clamp-2 mb-2">
          {recipe.title}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {recipe.cookTime && (
            <span className="badge-slate flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={2}/>
                <path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2"/>
              </svg>
              {recipe.cookTime} min
            </span>
          )}
          <DifficultyBadge recipe={recipe} />
          {recipe.cuisines?.slice(0, 1).map((c) => (
            <span key={c} className="badge-green capitalize">{c}</span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await favoriteApi.getAll();
        setFavorites(data.favorites || []);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Called by FavoriteCard immediately after successful API remove
  const handleRemove = (spoonacularId) => {
    setFavorites((prev) => prev.filter((r) => r.spoonacularId !== spoonacularId));
  };

  if (isLoading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-8 skeleton rounded-lg w-40 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-bold text-text-primary">Favourites</h1>
        {favorites.length > 0 && (
          <span className="text-sm text-text-muted">{favorites.length} saved</span>
        )}
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="No favourites yet"
          description="Heart any recipe while browsing to save it here."
          action={<Link to="/upload" className="btn-primary">Find recipes</Link>}
        />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {favorites.map((recipe) => (
              <FavoriteCard
                key={recipe.spoonacularId}
                recipe={recipe}
                onRemove={handleRemove}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </main>
  );
}
