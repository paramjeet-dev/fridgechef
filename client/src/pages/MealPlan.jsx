import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useMealPlanStore,
  DAYS, MEAL_TYPES, MEAL_ICONS, MEAL_LABELS,
} from '../store/useMealPlanStore';
import { useAuthStore } from '../store/useAuthStore';
import { LoadingSpinner, EmptyState } from '../components/shared/index';

// ── Add-to-slot modal ─────────────────────────────────────────
function AddMealModal({ open, dayIndex, mealType, onClose }) {
  const { addRecipeToSlot, setCustomMeal, isUpdating } = useMealPlanStore();
  const [mode, setMode] = useState('recipe');   // 'recipe' | 'custom'
  const [recipeId, setRecipeId] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');

  const reset = () => { setRecipeId(''); setCustomName(''); setError(''); setMode('recipe'); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'recipe') {
      const id = parseInt(recipeId, 10);
      if (!id) { setError('Enter a valid Spoonacular recipe ID.'); return; }
      await addRecipeToSlot(dayIndex, mealType, id);
    } else {
      if (!customName.trim()) { setError('Meal name is required.'); return; }
      await setCustomMeal(dayIndex, mealType, customName);
    }
    reset();
    onClose();
  };

  const handleClose = () => { reset(); onClose(); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 32 }} transition={{ duration: 0.22 }}
        className="relative w-full max-w-sm bg-white rounded-2xl p-5 shadow-modal z-10"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-text-primary">
            {MEAL_ICONS[mealType]} Add {MEAL_LABELS[mealType]}
            {dayIndex !== undefined && <span className="text-text-muted font-normal text-sm ml-1">· {DAYS[dayIndex]}</span>}
          </h3>
          <button onClick={handleClose} className="btn-ghost p-1" aria-label="Close">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl bg-surface-muted p-1 mb-4">
          {[{ v: 'recipe', label: '🍽️ Recipe ID' }, { v: 'custom', label: '✏️ Custom meal' }].map(({ v, label }) => (
            <button key={v} onClick={() => { setMode(v); setError(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                mode === v ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'
              }`}>{label}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {mode === 'recipe' ? (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Spoonacular recipe ID
              </label>
              <input
                className={`input ${error ? 'border-red-400' : ''}`}
                type="number"
                placeholder="e.g. 716429"
                value={recipeId}
                onChange={(e) => { setRecipeId(e.target.value); setError(''); }}
                autoFocus
              />
              <p className="text-xs text-text-muted mt-1">Find the ID in the recipe URL on the Recipes page.</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Meal name</label>
              <input
                className={`input ${error ? 'border-red-400' : ''}`}
                placeholder="e.g. Protein shake, Leftover pasta…"
                value={customName}
                onChange={(e) => { setCustomName(e.target.value); setError(''); }}
                autoFocus
                maxLength={100}
              />
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={isUpdating} className="btn-primary w-full flex items-center justify-center gap-2">
            {isUpdating ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>Saving…</>
            ) : 'Add meal'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Meal slot card ────────────────────────────────────────────
function MealSlot({ meal, mealType, dayIndex, onAdd }) {
  const { removeSlot, toggleCooked } = useMealPlanStore();
  const navigate = useNavigate();

  if (!meal) {
    return (
      <button
        onClick={onAdd}
        className="w-full min-h-[60px] rounded-xl border-2 border-dashed border-slate-200
                   flex items-center justify-center text-text-muted hover:border-brand-300
                   hover:text-brand-500 hover:bg-brand-50/50 transition-all duration-150 group"
        aria-label={`Add ${mealType}`}
      >
        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    );
  }

  const displayTitle = meal.isCustom ? meal.customName : meal.title;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative group rounded-xl border transition-all duration-150 overflow-hidden
                  ${meal.isCooked
                    ? 'bg-brand-50 border-brand-200 opacity-75'
                    : 'bg-white border-slate-200 hover:border-brand-300 hover:shadow-card'}`}
    >
      {/* Recipe image */}
      {!meal.isCustom && meal.image && (
        <div className="aspect-video overflow-hidden bg-slate-100">
          <img src={meal.image} alt="" className="w-full h-full object-cover" loading="lazy" aria-hidden="true" />
        </div>
      )}

      {/* Custom meal icon */}
      {meal.isCustom && (
        <div className="flex items-center justify-center h-10 bg-slate-50 text-xl">
          ✏️
        </div>
      )}

      <div className="p-2">
        <p className={`text-xs font-medium leading-snug line-clamp-2
                       ${meal.isCooked ? 'text-brand-600 line-through' : 'text-text-primary'}`}>
          {displayTitle || '—'}
        </p>
        {meal.cookTime && !meal.isCustom && (
          <p className="text-xs text-text-muted mt-0.5">{meal.cookTime} min</p>
        )}
      </div>

      {/* Hover action bar */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between
                      bg-white/95 backdrop-blur-sm px-2 py-1.5 border-t border-slate-100
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {/* Cooked toggle */}
        <button
          onClick={() => toggleCooked(dayIndex, mealType)}
          className={`text-xs font-medium flex items-center gap-1 transition-colors
                      ${meal.isCooked ? 'text-brand-600 hover:text-brand-700' : 'text-text-muted hover:text-brand-600'}`}
          aria-label={meal.isCooked ? 'Mark as uncooked' : 'Mark as cooked'}
          title={meal.isCooked ? 'Unmark' : 'Mark cooked'}
        >
          {meal.isCooked ? '✅' : '⬜'}
        </button>

        <div className="flex gap-1">
          {/* Navigate to recipe */}
          {!meal.isCustom && meal.spoonacularId && (
            <button
              onClick={() => navigate(`/recipes/${meal.spoonacularId}`)}
              className="p-1 rounded text-text-muted hover:text-brand-600"
              aria-label="View recipe"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )}
          {/* Delete */}
          <button
            onClick={() => removeSlot(dayIndex, mealType)}
            className="p-1 rounded text-text-muted hover:text-red-500"
            aria-label="Remove meal"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Progress summary ──────────────────────────────────────────
function WeekProgress({ mealPlan }) {
  let total = 0, cooked = 0;
  for (const day of mealPlan.days || []) {
    for (const slot of Object.values(day.meals || {})) {
      if (slot) { total++; if (slot.isCooked) cooked++; }
    }
  }
  if (total === 0) return null;
  const pct = Math.round((cooked / total) * 100);

  return (
    <div className="card p-4 mb-6 flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-medium text-text-primary">Week progress</p>
          <p className="text-sm font-semibold text-brand-600">{cooked} / {total} meals cooked</p>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
      <span className="text-2xl font-bold text-brand-600">{pct}%</span>
    </div>
  );
}

// ── Grocery list summary ──────────────────────────────────────
function GroceryPreview({ mealPlan }) {
  const [open, setOpen] = useState(false);
  // Collect all non-null recipe slots
  const recipes = [];
  for (const day of mealPlan.days || []) {
    for (const slot of Object.values(day.meals || {})) {
      if (slot && !slot.isCustom && slot.title) recipes.push(slot);
    }
  }
  if (!recipes.length) return null;

  return (
    <div className="card p-4 mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🛒</span>
          <span className="text-sm font-semibold text-text-primary">
            Grocery list ({recipes.length} recipe{recipes.length !== 1 ? 's' : ''})
          </span>
        </div>
        <svg className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
              {recipes.map((slot, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                  {slot.title}
                </li>
              ))}
            </ul>
            <p className="text-xs text-text-muted mt-3">
              Check each recipe's "Missing ingredients" section for items to buy.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function MealPlan() {
  const { mealPlan, isLoading, isGenerating, fetchMealPlan, generateMealPlan, deleteMealPlan } = useMealPlanStore();
  const user = useAuthStore((s) => s.user);

  // Modal state
  const [modal, setModal] = useState(null); // { dayIndex, mealType } | null

  useEffect(() => { fetchMealPlan(); }, [fetchMealPlan]);

  const handleGenerate = () => {
    generateMealPlan({
      targetCalories: 2000,
      diet: user?.preferences?.dietaryRestrictions?.[0] || 'vegetarian',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading meal plan…" />
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Weekly Meal Plan</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Plan your week — click any empty slot to add a meal
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mealPlan && (
            <button
              onClick={() => {
                if (window.confirm('Delete your entire meal plan?')) deleteMealPlan();
              }}
              className="btn-secondary text-sm flex items-center gap-1.5 text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete plan
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary flex items-center gap-2"
            aria-busy={isGenerating}
          >
            {isGenerating ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>Generating…</>
            ) : <>✨ {mealPlan ? 'Regenerate' : 'Generate'} plan</>}
          </motion.button>
        </div>
      </div>

      {!mealPlan ? (
        <EmptyState
          icon="📅"
          title="No meal plan yet"
          description="Generate a personalised weekly meal plan, or add meals manually to each slot."
          action={
            <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary">
              Generate my plan
            </button>
          }
        />
      ) : (
        <>
          {/* Progress bar */}
          <WeekProgress mealPlan={mealPlan} />

          {/* Grocery preview */}
          <GroceryPreview mealPlan={mealPlan} />

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-500" />
              Planned
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-200" />
              Cooked ✅
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded border-2 border-dashed border-slate-300" />
              Empty — click to add
            </span>
          </div>

          {/* Calendar grid — horizontally scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="min-w-[700px]">

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wide py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Meal type rows */}
              {MEAL_TYPES.map((mealType) => (
                <div key={mealType} className="mb-5">
                  {/* Row label */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span aria-hidden="true">{MEAL_ICONS[mealType]}</span>
                    <span className="text-xs font-semibold text-text-secondary">{MEAL_LABELS[mealType]}</span>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    <AnimatePresence mode="popLayout">
                      {DAYS.map((_, dayIndex) => {
                        const day = mealPlan.days?.find((d) => d.dayIndex === dayIndex);
                        const meal = day?.meals?.[mealType] ?? null;
                        return (
                          <MealSlot
                            key={dayIndex}
                            meal={meal}
                            mealType={mealType}
                            dayIndex={dayIndex}
                            onAdd={() => setModal({ dayIndex, mealType })}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add meal modal */}
      <AnimatePresence>
        {modal && (
          <AddMealModal
            open={!!modal}
            dayIndex={modal.dayIndex}
            mealType={modal.mealType}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
