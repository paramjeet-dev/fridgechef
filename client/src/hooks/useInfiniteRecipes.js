import { useEffect, useRef } from 'react';
import { useRecipeStore } from '../store/useRecipeStore';

/**
 * Attaches an IntersectionObserver to a sentinel element.
 * When the sentinel enters the viewport, loadMore() is called automatically.
 *
 * Usage:
 *   const sentinelRef = useInfiniteRecipes();
 *   return <div ref={sentinelRef} />;  // Place at the bottom of the list
 */
export function useInfiniteRecipes() {
  const { hasMore, isLoadingMore, loadMore } = useRecipeStore();
  const sentinelRef = useRef(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: '200px' } // Pre-load 200px before sentinel is visible
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  return sentinelRef;
}
