import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIngredientStore } from '../store/useIngredientStore';
import { useRecipeStore } from '../store/useRecipeStore';
import IngredientList from '../components/ingredients/IngredientList';
import { LoadingSpinner, EmptyState } from '../components/shared/index';
import api from '../api/axiosInstance';

export default function Results() {
  const { uploadId } = useParams();
  const navigate = useNavigate();

  const ingredients   = useIngredientStore((s) => s.ingredients);
  const setIngredients = useIngredientStore((s) => s.setIngredients);
  // Read availableNames as a derived value, not a function call
  const availableIngredients = useIngredientStore((s) =>
    s.ingredients.filter((i) => i.isAvailable)
  );

  const { searchRecipes, clearRecipes } = useRecipeStore();

  const [isLoading,  setIsLoading]  = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // If navigated here fresh (e.g. from History), fetch the upload's ingredients
  useEffect(() => {
    if (ingredients.length > 0) return;

    const fetchUpload = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/uploads/${uploadId}`);
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
  }, [uploadId]);   // intentionally omit ingredients.length — only run once on mount

  const handleFindRecipes = () => {
    const names = availableIngredients.map((i) => i.name).filter(Boolean);
    if (!names.length) return;

    // Clear any stale recipes from a previous search before navigating
    clearRecipes();
    searchRecipes(names);
    navigate(`/results/${uploadId}/recipes`);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-text-secondary">Loading your fridge…</p>
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
      <IngredientList uploadId={uploadId} onFindRecipes={handleFindRecipes} />
    </main>
  );
}
