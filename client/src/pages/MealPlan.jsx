import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMealPlanStore, DAYS, MEAL_TYPES, MEAL_ICONS, MEAL_LABELS } from '../store/useMealPlanStore';
import { useAuthStore } from '../store/useAuthStore';
import { LoadingSpinner, EmptyState } from '../components/shared/index';

function AddMealModal({ open, dayIndex, mealType, onClose }) {
  const { addRecipeToSlot, setCustomMeal, isUpdating } = useMealPlanStore();
  const [mode, setMode]       = useState('recipe');
  const [recipeId, setRecipeId]   = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError]     = useState('');

  const reset = () => { setRecipeId(''); setCustomName(''); setError(''); setMode('recipe'); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'recipe') {
      const id = parseInt(recipeId, 10);
      if (!id) { setError('Enter a valid recipe ID.'); return; }
      await addRecipeToSlot(dayIndex, mealType, id);
    } else {
      if (!customName.trim()) { setError('Meal name is required.'); return; }
      await setCustomMeal(dayIndex, mealType, customName);
    }
    reset(); onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-dark-900/70 backdrop-blur-sm" onClick={handleClose} />
      <motion.div initial={{ opacity: 0, y: 32, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32 }} transition={{ duration: 0.22 }}
        className="relative w-full max-w-sm glass rounded-2xl p-5 z-10 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold gradient-text">
            {MEAL_ICONS[mealType]} {MEAL_LABELS[mealType]}
            {dayIndex !== undefined && <span className="text-text-muted font-normal text-sm ml-1">· {DAYS[dayIndex]}</span>}
          </h3>
          <button onClick={handleClose} className="btn-ghost p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-4">
          {[{ v: 'recipe', l: '🍽️ Recipe ID' }, { v: 'custom', l: '✏️ Custom' }].map(({ v, l }) => (
            <button key={v} onClick={() => { setMode(v); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === v ? 'bg-gradient-to-r from-brand-600/70 to-cyan-600/50 text-white' : 'text-text-muted'
              }`}>{l}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {mode === 'recipe' ? (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Spoonacular recipe ID</label>
              <input type="number" className={`input ${error ? 'border-red-500/60' : ''}`}
                placeholder="e.g. 716429" value={recipeId}
                onChange={(e) => { setRecipeId(e.target.value); setError(''); }} autoFocus />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Meal name</label>
              <input className={`input ${error ? 'border-red-500/60' : ''}`}
                placeholder="Protein shake, Leftovers…" value={customName} maxLength={100}
                onChange={(e) => { setCustomName(e.target.value); setError(''); }} autoFocus />
            </div>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <motion.button type="submit" disabled={isUpdating}
            whileHover={!isUpdating ? { scale: 1.02 } : {}} whileTap={!isUpdating ? { scale: 0.97 } : {}}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
            {isUpdating ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>Saving…</>
            ) : 'Add meal'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

function MealSlot({ meal, mealType, dayIndex, onAdd }) {
  const { removeSlot, toggleCooked } = useMealPlanStore();
  const navigate = useNavigate();

  if (!meal) {
    return (
      <button onClick={onAdd}
        className="w-full min-h-[60px] rounded-xl border-2 border-dashed border-white/10
                   flex items-center justify-center text-text-muted
                   hover:border-brand-500/40 hover:bg-brand-500/5 hover:text-brand-400
                   transition-all duration-150 group">
        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
        </svg>
      </button>
    );
  }

  const displayTitle = meal.isCustom ? meal.customName : meal.title;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
      className={`relative group rounded-xl border overflow-hidden transition-all duration-200
        ${meal.isCooked ? 'bg-brand-600/10 border-brand-500/20' : 'glass border-white/10 hover:border-brand-500/30'}`}>
      {!meal.isCustom && meal.image && (
        <div className="aspect-video overflow-hidden">
          <img src={meal.image} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy"/>
        </div>
      )}
      {meal.isCustom && <div className="h-8 flex items-center justify-center text-lg bg-white/5">✏️</div>}

      <div className="p-2">
        <p className={`text-xs font-medium leading-snug line-clamp-2 ${meal.isCooked ? 'text-brand-400 line-through' : 'text-text-primary'}`}>
          {displayTitle || '—'}
        </p>
        {meal.cookTime && !meal.isCustom && <p className="text-xs text-text-muted mt-0.5">{meal.cookTime} min</p>}
      </div>

      {/* Hover actions */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between
                      bg-dark-900/90 backdrop-blur-sm px-2 py-1.5 border-t border-white/10
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button onClick={() => toggleCooked(dayIndex, mealType)}
          className={`text-xs transition-colors ${meal.isCooked ? 'text-brand-400' : 'text-text-muted hover:text-brand-400'}`}>
          {meal.isCooked ? '✅' : '⬜'}
        </button>
        <div className="flex gap-1">
          {!meal.isCustom && meal.spoonacularId && (
            <button onClick={() => navigate(`/recipes/${meal.spoonacularId}`)}
              className="p-1 rounded text-text-muted hover:text-cyan-400 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </button>
          )}
          <button onClick={() => removeSlot(dayIndex, mealType)}
            className="p-1 rounded text-text-muted hover:text-red-400 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function WeekProgress({ mealPlan }) {
  let total = 0, cooked = 0;
  for (const day of mealPlan.days || []) {
    for (const slot of Object.values(day.meals || {})) {
      if (slot) { total++; if (slot.isCooked) cooked++; }
    }
  }
  if (!total) return null;
  const pct = Math.round((cooked / total) * 100);
  return (
    <div className="card p-4 mb-6 flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-medium text-text-primary">Week progress</p>
          <p className="text-sm font-bold gradient-text">{cooked} / {total} cooked</p>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-brand-600 to-cyan-500 rounded-full"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
        </div>
      </div>
      <span className="text-2xl font-bold gradient-text">{pct}%</span>
    </div>
  );
}

export default function MealPlan() {
  const { mealPlan, isLoading, isGenerating, fetchMealPlan, generateMealPlan, deleteMealPlan } = useMealPlanStore();
  const user = useAuthStore((s) => s.user);
  const [modal, setModal] = useState(null);

  useEffect(() => { fetchMealPlan(); }, [fetchMealPlan]);

  const handleGenerate = () => generateMealPlan({
    targetCalories: 2000,
    diet: user?.preferences?.dietaryRestrictions?.[0] || '',
  });

  if (isLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  );

  return (
    <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 overflow-hidden">
      <div className="blob w-64 h-64 bg-violet-600/15 top-0 right-0 animate-blob" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Meal <span className="gradient-text">Planner</span>
          </h1>
          <p className="mt-1 text-sm text-text-muted">Click any empty slot to add a meal</p>
        </div>
        <div className="flex items-center gap-2">
          {mealPlan && (
            <button onClick={() => { if (window.confirm('Delete your entire meal plan?')) deleteMealPlan(); }}
              className="btn-secondary text-sm flex items-center gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Delete
            </button>
          )}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleGenerate} disabled={isGenerating} className="btn-primary flex items-center gap-2">
            {isGenerating ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>Generating…</>
            ) : <>✨ {mealPlan ? 'Regenerate' : 'Generate'} plan</>}
          </motion.button>
        </div>
      </div>

      {!mealPlan ? (
        <EmptyState icon="📅" title="No meal plan yet"
          description="Generate a personalised weekly plan, or add meals manually to any slot."
          action={<button onClick={handleGenerate} disabled={isGenerating} className="btn-primary">Generate my plan</button>} />
      ) : (
        <div className="relative z-10">
          <WeekProgress mealPlan={mealPlan} />

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="min-w-[700px]">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-text-muted uppercase tracking-wide py-1">{d}</div>
                ))}
              </div>

              {/* Meal rows */}
              {MEAL_TYPES.map((mealType) => (
                <div key={mealType} className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span>{MEAL_ICONS[mealType]}</span>
                    <span className="text-xs font-semibold text-text-muted">{MEAL_LABELS[mealType]}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    <AnimatePresence mode="popLayout">
                      {DAYS.map((_, dayIndex) => {
                        const day  = mealPlan.days?.find((d) => d.dayIndex === dayIndex);
                        const meal = day?.meals?.[mealType] ?? null;
                        return (
                          <MealSlot key={dayIndex} meal={meal} mealType={mealType}
                            dayIndex={dayIndex} onAdd={() => setModal({ dayIndex, mealType })} />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {modal && <AddMealModal open={!!modal} dayIndex={modal.dayIndex} mealType={modal.mealType} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </main>
  );
}