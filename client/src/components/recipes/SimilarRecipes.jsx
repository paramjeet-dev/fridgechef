import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRecipeStore } from '../../store/useRecipeStore';

export default function SimilarRecipes({ spoonacularId }) {
  const navigate = useNavigate();
  const { similarRecipes, fetchSimilarRecipes } = useRecipeStore();

  useEffect(() => {
    if (spoonacularId) fetchSimilarRecipes(spoonacularId);
  }, [spoonacularId, fetchSimilarRecipes]);

  if (!similarRecipes.length) return null;

  return (
    <section aria-label="Similar recipes">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
        Similar recipes
      </h3>

      {/* Horizontal scroll strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
        {similarRecipes.map((recipe, i) => (
          <motion.button
            key={recipe.spoonacularId}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            onClick={() => navigate(`/recipes/${recipe.spoonacularId}`)}
            className="flex-shrink-0 w-44 snap-start text-left card overflow-hidden
                       hover:shadow-card-hover transition-shadow duration-200"
            aria-label={`View recipe: ${recipe.title}`}
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-slate-100 overflow-hidden">
              {recipe.image ? (
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  🍽️
                </div>
              )}
            </div>
            {/* Title + time */}
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
