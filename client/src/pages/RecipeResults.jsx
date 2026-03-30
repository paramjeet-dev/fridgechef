import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIngredientStore } from '../store/useIngredientStore';
import { useRecipeStore } from '../store/useRecipeStore';
import RecipeGrid from '../components/recipes/RecipeGrid';
import { LoadingSpinner } from '../components/shared/index';

export default function RecipeResults() {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const availableNames = useIngredientStore((s) => s.availableNames());
  const { searchRecipes, isLoading, recipes } = useRecipeStore();

  useEffect(() => {
    // Only search if we have ingredients and haven't already fetched
    if (availableNames.length > 0 && recipes.length === 0) {
      searchRecipes(availableNames);
    } else if (availableNames.length === 0) {
      // No ingredients — go back to results page to re-load them
      navigate(`/results/${uploadId}`, { replace: true });
    }
  }, []);

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
