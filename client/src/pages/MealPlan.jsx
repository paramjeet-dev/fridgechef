import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMealPlanStore } from '../store/useMealPlanStore';
import { useAuthStore } from '../store/useAuthStore';
import { LoadingSpinner, EmptyState } from '../components/shared/index';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };

function MealSlot({ meal, mealType, onClick }) {
  if (!meal) {
    return (
      <div className="min-h-[64px] rounded-xl border-2 border-dashed border-slate-200
                      flex items-center justify-center text-xs text-text-muted">
        —
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left min-h-[64px] rounded-xl bg-brand-50 hover:bg-brand-100
                 border border-brand-200 p-2 transition-colors duration-150 group"
      aria-label={`View recipe: ${meal.title}`}
    >
      {meal.image && (
        <img src={meal.image} alt="" className="w-full h-12 object-cover rounded-lg mb-1" aria-hidden="true" />
      )}
      <p className="text-xs font-medium text-brand-700 line-clamp-2 leading-snug">{meal.title}</p>
      {meal.cookTime && (
        <p className="text-xs text-brand-500 mt-0.5">{meal.cookTime} min</p>
      )}
    </button>
  );
}

export default function MealPlan() {
  const navigate = useNavigate();
  const { mealPlan, isLoading, isGenerating, fetchMealPlan, generateMealPlan } = useMealPlanStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => { fetchMealPlan(); }, [fetchMealPlan]);

  const handleGenerate = () => {
    generateMealPlan({
      targetCalories: 2000,
      diet: user?.preferences?.dietaryRestrictions?.[0] || '',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading meal plan..." />
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
            Auto-generated based on your dietary preferences
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={isGenerating}
          className="btn-primary flex items-center gap-2"
          aria-busy={isGenerating}
        >
          {isGenerating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating...
            </>
          ) : (
            <>✨ {mealPlan ? 'Regenerate' : 'Generate'} plan</>
          )}
        </motion.button>
      </div>

      {!mealPlan ? (
        <EmptyState
          icon="📅"
          title="No meal plan yet"
          description="Generate a personalised weekly meal plan based on your dietary preferences."
          action={
            <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary">
              Generate my plan
            </button>
          }
        />
      ) : (
        /* Calendar grid — scrollable horizontally on mobile */
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wide py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Meal rows */}
            {MEAL_TYPES.map((mealType) => (
              <div key={mealType} className="mb-4">
                {/* Meal type label */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span aria-hidden="true">{MEAL_ICONS[mealType]}</span>
                  <span className="text-xs font-semibold text-text-secondary capitalize">{mealType}</span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((_, dayIndex) => {
                    const day = mealPlan.days?.find((d) => d.dayIndex === dayIndex);
                    const meal = day?.meals?.[mealType];
                    return (
                      <MealSlot
                        key={dayIndex}
                        meal={meal}
                        mealType={mealType}
                        onClick={() => meal?.spoonacularId && navigate(`/recipes/${meal.spoonacularId}`)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
