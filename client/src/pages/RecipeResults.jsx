import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIngredientStore } from '../store/useIngredientStore';
import { useRecipeStore } from '../store/useRecipeStore';
import RecipeGrid from '../components/recipes/RecipeGrid';

export default function RecipeResults() {
  const { uploadId } = useParams();
  const navigate = useNavigate();

  // Derive available names directly from state — not from a stale closure
  const availableIngredients = useIngredientStore((s) =>
    s.ingredients.filter((i) => i.isAvailable)
  );
  const availableNames = availableIngredients.map((i) => i.name).filter(Boolean);

  const { searchRecipes, recipes, isLoading } = useRecipeStore();

  useEffect(() => {
    if (availableNames.length === 0) {
      // No ingredients in store — user navigated here directly or refreshed.
      // Send them back to the results page to reload ingredients.
      navigate(`/results/${uploadId}`, { replace: true });
      return;
    }

    // Always search on mount so filters applied before navigation take effect.
    // RecipeResults is only ever mounted fresh (route-level), so this is safe.
    if (recipes.length === 0 && !isLoading) {
      searchRecipes(availableNames);
    }
  }, []); // run once on mount only — avoids infinite loop

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(`/results/${uploadId}`)}
          className="btn-ghost flex items-center gap-1.5 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to ingredients
        </button>
      </div>
      <RecipeGrid />
    </main>
  );
}
