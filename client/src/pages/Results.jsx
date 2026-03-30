import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIngredientStore } from '../store/useIngredientStore';
import { useRecipeStore } from '../store/useRecipeStore';
import IngredientList from '../components/ingredients/IngredientList';
import { LoadingSpinner, EmptyState } from '../components/shared/index';
import api from '../api/axiosInstance';
import { useState } from 'react';

export default function Results() {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const { ingredients, setIngredients, availableNames } = useIngredientStore();
  const { searchRecipes } = useRecipeStore();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // If navigated here fresh (e.g. from History), fetch the upload's ingredients
  useEffect(() => {
    if (ingredients.length > 0) return; // Already populated by upload flow

    const fetchUpload = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/uploads/${uploadId}`);
        // Normalise DB shape to match store shape
        const mapped = data.upload.extractedIngredients.map((ing) => ({
          id: ing._id,
          ...ing,
        }));
        setIngredients(mapped);
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Failed to load upload.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpload();
  }, [uploadId, ingredients.length, setIngredients]);

  const handleFindRecipes = () => {
    const names = availableNames();
    if (!names.length) return;
    searchRecipes(names);
    navigate(`/results/${uploadId}/recipes`);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-text-secondary">Analysing your fridge…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <EmptyState
        icon="⚠️"
        title="Could not load results"
        description={fetchError}
        action={
          <button onClick={() => navigate('/upload')} className="btn-primary">
            Upload again
          </button>
        }
      />
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <IngredientList uploadId={uploadId} />
    </main>
  );
}

// Re-export a sub-route for the recipe grid view
// This allows /results/:uploadId/recipes to show the RecipeGrid
export { default as RecipeResults } from '../components/recipes/RecipeGrid';
