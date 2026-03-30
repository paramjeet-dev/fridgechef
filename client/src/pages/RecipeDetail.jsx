import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecipeStore } from '../store/useRecipeStore';
import CookingTimer from '../components/recipes/CookingTimer';
import ShoppingLinks from '../components/shopping/ShoppingLinks';
import SimilarRecipes from '../components/recipes/SimilarRecipes';
import { LoadingSpinner } from '../components/shared/index';

const TABS = ['Overview', 'Instructions', 'Nutrition', 'Similar'];

function NutritionRow({ label, value, unit }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-semibold text-text-primary">{value}{unit}</span>
    </div>
  );
}

export default function RecipeDetail() {
  const { spoonacularId } = useParams();
  const navigate = useNavigate();
  const { currentRecipe, isLoadingDetail, fetchRecipeDetail } = useRecipeStore();
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    if (spoonacularId) fetchRecipeDetail(parseInt(spoonacularId, 10));
  }, [spoonacularId, fetchRecipeDetail]);

  if (isLoadingDetail) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading recipe..." />
      </div>
    );
  }

  if (!currentRecipe) return null;

  const {
    title, image, cookTime, servings, cuisines = [], diets = [],
    instructions = [], ingredients = [], nutrition = {},
    summary, missedIngredients = [],
  } = currentRecipe;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-1.5 mb-6 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {image && (
          <div className="rounded-2xl overflow-hidden aspect-[16/7] mb-6 bg-slate-100">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-3xl font-display font-bold text-text-primary mb-3">{title}</h1>
        <div className="flex flex-wrap gap-2 mb-6">
          {cookTime && <span className="badge-slate">{cookTime} min</span>}
          {servings && <span className="badge-slate">Serves {servings}</span>}
          {cuisines.map((c) => <span key={c} className="badge-green capitalize">{c}</span>)}
          {diets.slice(0, 2).map((d) => <span key={d} className="badge-slate capitalize">{d}</span>)}
        </div>
      </motion.div>

      <div className="flex gap-1 bg-surface-muted p-1 rounded-xl mb-6 overflow-x-auto" role="tablist">
        {TABS.map((tab) => (
          <button key={tab} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[80px] py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === tab ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}>{tab}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>

          {activeTab === 'Overview' && (
            <div className="space-y-6">
              {summary && (
                <div className="card p-5">
                  <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">About</h2>
                  <p className="text-sm text-text-secondary leading-relaxed">{summary}</p>
                </div>
              )}
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  Ingredients ({ingredients.length})
                </h2>
                <ul className="space-y-2" role="list">
                  {ingredients.map((ing) => (
                    <li key={ing.name} className="flex items-center gap-2.5 text-sm">
                      {ing.image && <img src={ing.image} alt="" className="w-7 h-7 rounded object-cover" aria-hidden="true" />}
                      <span className="text-text-primary capitalize"><strong>{ing.amount} {ing.unit}</strong> {ing.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {missedIngredients.length > 0 && <ShoppingLinks missedIngredients={missedIngredients} />}
            </div>
          )}

          {activeTab === 'Instructions' && (
            <div className="grid md:grid-cols-[1fr_280px] gap-6">
              <div className="space-y-4">
                {instructions.length === 0
                  ? <p className="text-text-secondary text-sm">No step-by-step instructions available.</p>
                  : instructions.map((step) => (
                    <div key={step.step} className="flex gap-4">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        {step.step}
                      </span>
                      <p className="text-sm text-text-primary leading-relaxed">{step.text}</p>
                    </div>
                  ))
                }
              </div>
              <div className="md:sticky md:top-24 self-start">
                <CookingTimer steps={instructions} />
              </div>
            </div>
          )}

          {activeTab === 'Nutrition' && (
            <div className="card p-5 max-w-sm">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">Per serving</h2>
              <NutritionRow label="Calories"      value={Math.round(nutrition.calories)} unit=" kcal" />
              <NutritionRow label="Protein"       value={nutrition.protein?.toFixed(1)}  unit="g" />
              <NutritionRow label="Carbohydrates" value={nutrition.carbs?.toFixed(1)}    unit="g" />
              <NutritionRow label="Fat"           value={nutrition.fat?.toFixed(1)}      unit="g" />
            </div>
          )}

          {activeTab === 'Similar' && (
            <SimilarRecipes spoonacularId={parseInt(spoonacularId, 10)} />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
