import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecipeStore } from '../../store/useRecipeStore';
import RecipeCard from './RecipeCard';
import RecipeFilters from './RecipeFilters';
import { SkeletonCard, EmptyState } from '../shared/index';

export default function RecipeGrid() {
  const { recipes, isLoading, isLoadingMore, hasMore, loadMore } = useRecipeStore();
  const sentinelRef = useRef(null);

  // ── Infinite scroll via IntersectionObserver ──────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before the sentinel appears
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // ── Initial loading state ─────────────────────────────────
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading recipes">
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton h-7 w-40 rounded-lg" />
          <div className="skeleton h-9 w-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────
  if (!isLoading && recipes.length === 0) {
    return (
      <EmptyState
        icon="🍽️"
        title="No recipes found"
        description="Try adjusting your filters or toggling more ingredients as available."
      />
    );
  }

  return (
    <section aria-label="Recipe results">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-bold text-text-primary">
          {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found
        </h2>
        <RecipeFilters />
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        layout
      >
        <AnimatePresence mode="popLayout">
          {recipes.map((recipe, i) => (
            <motion.div
              key={recipe.spoonacularId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
            >
              <RecipeCard recipe={recipe} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load more skeleton rows */}
      {isLoadingMore && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-5"
          aria-label="Loading more recipes"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* IntersectionObserver sentinel */}
      <div ref={sentinelRef} className="h-4" aria-hidden="true" />

      {/* End of results */}
      {!hasMore && recipes.length > 0 && (
        <p className="text-center text-sm text-text-muted mt-8">
          All {recipes.length} recipes shown
        </p>
      )}
    </section>
  );
}
