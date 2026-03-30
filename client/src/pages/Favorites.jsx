import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { favoriteApi } from '../api/recipeApi';
import RecipeCard from '../components/recipes/RecipeCard';
import { LoadingSpinner, EmptyState, SkeletonCard } from '../components/shared/index';
import { Link } from 'react-router-dom';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await favoriteApi.getAll();
        setFavorites(data.favorites || []);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

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
      <h1 className="text-3xl font-display font-bold text-text-primary mb-8">Favourites</h1>

      {favorites.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="No favourites yet"
          description="Heart any recipe while browsing to save it here."
          action={<Link to="/upload" className="btn-primary">Find recipes</Link>}
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {favorites.map((recipe) => (
            <motion.div
              key={recipe.spoonacularId}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            >
              <RecipeCard recipe={{ ...recipe, isFavorited: true }} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
}
