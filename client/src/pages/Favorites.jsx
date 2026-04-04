import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { favoriteApi } from '../api/recipeApi';
import { LoadingSpinner, EmptyState, SkeletonCard } from '../components/shared/index';
import DifficultyBadge from '../components/recipes/DifficultyBadge';
import toast from 'react-hot-toast';

function FavoriteCard({ recipe, onRemove }) {
  const navigate  = useNavigate();
  const [removing, setRemoving] = useState(false);

  const handleRemove = async (e) => {
    e.stopPropagation();
    setRemoving(true);
    try {
      await favoriteApi.remove(recipe.spoonacularId);
      toast.success('Removed from favourites');
      onRemove(recipe.spoonacularId);
    } catch {
      toast.error('Failed to remove favourite');
      setRemoving(false);
    }
  };

  return (
    <motion.article layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: removing ? 0.3 : 1, scale: removing ? 0.95 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={() => navigate(`/recipes/${recipe.spoonacularId}`)}
      className="card overflow-hidden cursor-pointer group"
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/recipes/${recipe.spoonacularId}`)}
    >
      <div className="relative aspect-[4/3] bg-white/5 overflow-hidden">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/70 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Remove heart */}
        <motion.button
          onClick={handleRemove} disabled={removing}
          whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 text-white
                     flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Remove from favourites"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </motion.button>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-text-primary line-clamp-2 mb-2">{recipe.title}</h3>
        <div className="flex flex-wrap gap-2 items-center">
          {recipe.cookTime && (
            <span className="badge-slate flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2"/>
              </svg>
              {recipe.cookTime} min
            </span>
          )}
          <DifficultyBadge recipe={recipe} />
          {recipe.cuisines?.slice(0,1).map((c) => <span key={c} className="badge-green capitalize">{c}</span>)}
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
      } finally { setIsLoading(false); }
    })();
  }, []);

  const handleRemove = (id) => setFavorites((prev) => prev.filter((r) => r.spoonacularId !== id));

  if (isLoading) return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="h-9 skeleton rounded-lg w-48 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </main>
  );

  return (
    <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 overflow-hidden">
      <div className="blob w-56 h-56 bg-pink-500/10 top-0 right-0 animate-blob" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Saved <span className="gradient-text-warm">recipes</span>
          </h1>
          {favorites.length > 0 && <p className="text-sm text-text-muted mt-1">{favorites.length} saved</p>}
        </div>
      </div>

      {favorites.length === 0 ? (
        <EmptyState icon="❤️" title="No favourites yet"
          description="Heart any recipe while browsing to save it here."
          action={<Link to="/upload" className="btn-primary">Find recipes</Link>} />
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {favorites.map((recipe) => (
              <FavoriteCard key={recipe.spoonacularId} recipe={recipe} onRemove={handleRemove} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </main>
  );
}