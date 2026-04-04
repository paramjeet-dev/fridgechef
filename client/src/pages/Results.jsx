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
  const ingredients    = useIngredientStore((s) => s.ingredients);
  const setIngredients = useIngredientStore((s) => s.setIngredients);
  const availableIngredients = useIngredientStore((s) => s.ingredients.filter((i) => i.isAvailable));
  const { searchRecipes, clearRecipes } = useRecipeStore();
  const [isLoading,  setIsLoading]  = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (ingredients.length > 0) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/uploads/${uploadId}`);
        setIngredients(data.upload.extractedIngredients.map((ing) => ({ id: ing._id, ...ing })));
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Failed to load upload.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [uploadId]);

  const handleFindRecipes = () => {
    const names = availableIngredients.map((i) => i.name).filter(Boolean);
    if (!names.length) return;
    clearRecipes();
    searchRecipes(names);
    navigate(`/results/${uploadId}/recipes`);
  };

  if (isLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-text-muted">Analysing your fridge…</p>
      </div>
    </div>
  );

  if (fetchError) return (
    <EmptyState icon="⚠️" title="Could not load results" description={fetchError}
      action={<button onClick={() => navigate('/upload')} className="btn-primary">Upload again</button>} />
  );

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <IngredientList uploadId={uploadId} onFindRecipes={handleFindRecipes} />
    </main>
  );
}