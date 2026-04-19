import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { recipeApi } from '../../api/recipeApi';
import { LoadingSpinner } from '../shared/index';

export default function SimilarRecipes({ spoonacularId }) {
  const navigate = useNavigate();
  const [recipes,    setRecipes]    = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);

  useEffect(() => {
    if (!spoonacularId) return;
    setIsLoading(true);
    setRecipes([]);

    recipeApi.getSimilar(spoonacularId)
      .then(({ data }) => setRecipes(data.recipes || []))
      .catch(() => setRecipes([]))
      .finally(() => setIsLoading(false));
  }, [spoonacularId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <LoadingSpinner size="md" label="Finding similar recipes…" />
      </div>
    );
  }

  if (!recipes.length) {
    return (
      <p className="text-sm text-text-muted text-center py-8">No similar recipes found.</p>
    );
  }

  return (
    <section aria-label="Similar recipes">
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-none">
        {recipes.map((recipe, i) => (
          <motion.button
            key={recipe.spoonacularId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => navigate(`/recipes/${recipe.spoonacularId}`)}
            className="flex-shrink-0 w-44 snap-start text-left card overflow-hidden group"
          >
            <div className="aspect-video bg-white/5 overflow-hidden">
              {recipe.image ? (
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-xs font-semibold text-text-primary line-clamp-2 leading-snug">
                {recipe.title}
              </p>
              {recipe.cookTime && (
                <p className="text-xs text-text-muted mt-1">{recipe.cookTime} min</p>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
