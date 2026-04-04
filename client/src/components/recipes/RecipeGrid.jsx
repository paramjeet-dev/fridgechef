import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecipeStore } from '../../store/useRecipeStore';
import RecipeCard from './RecipeCard';
import RecipeFilters from './RecipeFilters';
import { SkeletonCard, EmptyState } from '../shared/index';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function RecipeGrid() {
  const { filteredRecipes, isLoading, isLoadingMore, hasMore, loadMore } = useRecipeStore();
  const sentinelRef = useRef(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !isLoadingMore) loadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  if (isLoading) {
    return (
      <div aria-busy="true">
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton h-7 w-40 rounded-lg" />
          <div className="skeleton h-9 w-24 rounded-xl" />
        </div>
        <motion.div variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div key={i} variants={item}><SkeletonCard /></motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  if (!filteredRecipes.length) {
    return (
      <EmptyState icon="🍽️" title="No recipes found"
        description="Try adjusting your filters or toggling more ingredients as available." />
    );
  }

  return (
    <section aria-label="Recipe results">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary">
          <span className="gradient-text">{filteredRecipes.length}</span> recipe{filteredRecipes.length !== 1 ? 's' : ''} found
        </h2>
        <RecipeFilters />
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredRecipes.map((recipe) => (
            <motion.div key={recipe.spoonacularId} variants={item} layout>
              <RecipeCard recipe={recipe} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {isLoadingMore && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" aria-hidden="true" />

      {!hasMore && filteredRecipes.length > 0 && (
        <p className="text-center text-sm text-text-muted mt-8">
          All <span className="gradient-text font-semibold">{filteredRecipes.length}</span> recipes shown
        </p>
      )}
    </section>
  );
}