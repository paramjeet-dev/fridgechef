import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecipeStore } from '../store/useRecipeStore';
import CookingTimer from '../components/recipes/CookingTimer';
import ShoppingLinks from '../components/shopping/ShoppingLinks';
import SimilarRecipes from '../components/recipes/SimilarRecipes';
import DifficultyBadge from '../components/recipes/DifficultyBadge';
import SubstitutionsPanel from '../components/recipes/SubstitutionsPanel';
import { LoadingSpinner } from '../components/shared/index';

const TABS = ['Overview','Instructions','Nutrition','Substitutions','Similar'];

function NutritionRow({ label, value, unit }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-bold text-text-primary">{value}{unit}</span>
    </div>
  );
}

function ServingsStepper({ baseServings, onChange }) {
  const [servings, setServings] = useState(baseServings || 2);
  const change = (delta) => {
    const next = Math.max(1, Math.min(20, servings + delta));
    setServings(next);
    onChange(next / (baseServings || 2));
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted">Serves</span>
      {[-1,1].map((d) => (
        <button key={d} onClick={() => change(d)}
          className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center
                     text-text-muted hover:border-brand-500/50 hover:text-brand-400 transition-all">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {d < 0
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>}
          </svg>
        </button>
      )).reduce((acc, el, i) => i === 0 ? [el,
        <span key="val" className="text-sm font-bold gradient-text w-6 text-center tabular-nums">{servings}</span>
      ] : [...acc, el], [])}
    </div>
  );
}

function formatAmt(amount, ratio) {
  if (!amount) return '';
  const s = amount * ratio;
  return s % 1 === 0 ? String(s) : s.toFixed(1);
}

export default function RecipeDetail() {
  const { spoonacularId } = useParams();
  const navigate = useNavigate();
  const { currentRecipe, isLoadingDetail, fetchRecipeDetail } = useRecipeStore();
  const [activeTab,  setActiveTab]  = useState('Overview');
  const [scaleRatio, setScaleRatio] = useState(1);

  useEffect(() => { if (spoonacularId) fetchRecipeDetail(parseInt(spoonacularId, 10)); }, [spoonacularId, fetchRecipeDetail]);

  if (isLoadingDetail) return (
    <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  );
  if (!currentRecipe) return null;

  const { title, image, cookTime, servings, cuisines = [], diets = [],
    instructions = [], ingredients = [], nutrition = {}, summary, missedIngredients = [] } = currentRecipe;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-1.5 mb-6 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Back
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {image && (
          <div className="rounded-2xl overflow-hidden aspect-[16/7] mb-6 relative">
            <img src={image} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-3">{title}</h1>
            <div className="flex flex-wrap gap-2">
              {cookTime && <span className="badge-slate">{cookTime} min</span>}
              <DifficultyBadge recipe={{ cookTime, instructions, ingredients }} />
              {cuisines.map((c) => <span key={c} className="badge-cyan capitalize">{c}</span>)}
              {diets.slice(0,2).map((d) => <span key={d} className="badge-green capitalize">{d}</span>)}
            </div>
          </div>
          <ServingsStepper baseServings={servings} onChange={setScaleRatio} />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 glass p-1 rounded-xl mb-6 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[80px] py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === tab
                ? 'bg-gradient-to-r from-brand-600/70 to-cyan-600/50 text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>

          {activeTab === 'Overview' && (
            <div className="space-y-5">
              {summary && (
                <div className="card p-5">
                  <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">About</h2>
                  <p className="text-sm text-text-secondary leading-relaxed">{summary}</p>
                </div>
              )}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Ingredients ({ingredients.length})
                  </h2>
                  {scaleRatio !== 1 && <span className="text-xs gradient-text font-medium">×{scaleRatio.toFixed(1)} scaled</span>}
                </div>
                <ul className="space-y-2">
                  {ingredients.map((ing) => (
                    <li key={ing.name} className="flex items-center gap-2.5 text-sm">
                      {ing.image && <img src={ing.image} alt="" className="w-7 h-7 rounded-lg object-cover" aria-hidden="true"/>}
                      <span className="text-text-secondary capitalize">
                        <strong className="text-text-primary">{formatAmt(ing.amount, scaleRatio)} {ing.unit}</strong>{' '}{ing.name}
                      </span>
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
                {!instructions.length
                  ? <p className="text-text-muted text-sm">No step-by-step instructions available.</p>
                  : instructions.map((step) => (
                    <div key={step.step} className="flex gap-4">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-cyan-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        {step.step}
                      </span>
                      <p className="text-sm text-text-secondary leading-relaxed">{step.text}</p>
                    </div>
                  ))
                }
              </div>
              <div className="md:sticky md:top-24 self-start"><CookingTimer steps={instructions} /></div>
            </div>
          )}

          {activeTab === 'Nutrition' && (
            <div className="card p-5 max-w-sm">
              <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">
                Per serving {scaleRatio !== 1 && <span className="gradient-text">(×{scaleRatio.toFixed(1)})</span>}
              </h2>
              <NutritionRow label="Calories"      value={Math.round((nutrition.calories||0)*scaleRatio)} unit=" kcal"/>
              <NutritionRow label="Protein"       value={((nutrition.protein||0)*scaleRatio).toFixed(1)} unit="g"/>
              <NutritionRow label="Carbohydrates" value={((nutrition.carbs||0)*scaleRatio).toFixed(1)}   unit="g"/>
              <NutritionRow label="Fat"           value={((nutrition.fat||0)*scaleRatio).toFixed(1)}     unit="g"/>
            </div>
          )}

          {activeTab === 'Substitutions' && <SubstitutionsPanel spoonacularId={parseInt(spoonacularId, 10)} />}
          {activeTab === 'Similar' && <SimilarRecipes spoonacularId={parseInt(spoonacularId, 10)} />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}