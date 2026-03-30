import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecipeStore } from '../../store/useRecipeStore';

const CUISINES = ['Indian', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Mediterranean', 'American', 'Thai'];
const DIETS = ['vegetarian', 'vegan', 'gluten free', 'ketogenic', 'paleo'];
const TIME_OPTIONS = [
  { label: 'Any time', value: null },
  { label: 'Under 15 min', value: 15 },
  { label: 'Under 30 min', value: 30 },
  { label: 'Under 60 min', value: 60 },
];

export default function RecipeFilters() {
  const { filters, setFilters, resetFilters } = useRecipeStore();
  const [open, setOpen] = useState(false);

  const hasActiveFilters = filters.cuisine || filters.diet || filters.maxReadyTime;

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`btn-secondary flex items-center gap-2 text-sm ${hasActiveFilters ? 'border-brand-400 text-brand-600' : ''}`}
        aria-expanded={open}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        Filters
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-brand-500" aria-label="Active filters" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-72 card p-4 z-20 space-y-4"
            role="dialog"
            aria-label="Recipe filters"
          >
            {/* Cuisine */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Cuisine
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CUISINES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilters({ cuisine: filters.cuisine === c.toLowerCase() ? '' : c.toLowerCase() })}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      filters.cuisine === c.toLowerCase()
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'border-slate-200 text-text-secondary hover:border-brand-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Diet */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Diet
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DIETS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setFilters({ diet: filters.diet === d ? '' : d })}
                    className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors ${
                      filters.diet === d
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'border-slate-200 text-text-secondary hover:border-brand-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Cook time */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Cook time
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_OPTIONS.map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => setFilters({ maxReadyTime: value })}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      filters.maxReadyTime === value
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'border-slate-200 text-text-secondary hover:border-brand-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <button
                onClick={() => { resetFilters(); setOpen(false); }}
                className="w-full text-sm text-red-500 hover:text-red-600 font-medium pt-1 border-t border-slate-100"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
