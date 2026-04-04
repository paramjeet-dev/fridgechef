import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecipeStore } from '../../store/useRecipeStore';

const CUISINES = ['Indian','Italian','Mexican','Chinese','Japanese','Mediterranean','American','Thai'];
const DIETS    = ['vegetarian','vegan','gluten free','ketogenic','paleo'];
const TIME_OPTIONS = [
  { label: 'Any time', value: null },
  { label: '< 15 min', value: 15 },
  { label: '< 30 min', value: 30 },
  { label: '< 60 min', value: 60 },
];
const DIFFICULTY_OPTIONS = [
  { label: 'Any',    value: null     },
  { label: '🟢 Easy',   value: 'easy'   },
  { label: '🟡 Medium', value: 'medium' },
  { label: '🔴 Hard',   value: 'hard'   },
];

function FilterPill({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
        active
          ? 'bg-gradient-to-r from-brand-600/80 to-cyan-600/60 text-white border-brand-500/50'
          : 'bg-white/5 border-white/10 text-text-muted hover:border-brand-500/40 hover:text-text-secondary'
      }`}>
      {label}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export default function RecipeFilters() {
  const { filters, setFilters, resetFilters } = useRecipeStore();
  const [open, setOpen] = useState(false);
  const hasActive = filters.cuisine || filters.diet || filters.maxReadyTime || filters.difficulty;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        className={`btn-secondary flex items-center gap-2 text-sm ${hasActive ? 'border-brand-500/50 text-brand-300' : ''}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        Filters
        {hasActive && <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-76 glass rounded-2xl p-4 z-20 space-y-4 border border-white/10"
            role="dialog" aria-label="Recipe filters"
          >
            <Section title="Cuisine">
              {CUISINES.map((c) => (
                <FilterPill key={c} label={c}
                  active={filters.cuisine === c.toLowerCase()}
                  onClick={() => setFilters({ cuisine: filters.cuisine === c.toLowerCase() ? '' : c.toLowerCase() })} />
              ))}
            </Section>
            <Section title="Diet">
              {DIETS.map((d) => (
                <FilterPill key={d} label={d}
                  active={filters.diet === d}
                  onClick={() => setFilters({ diet: filters.diet === d ? '' : d })} />
              ))}
            </Section>
            <Section title="Difficulty">
              {DIFFICULTY_OPTIONS.map(({ label, value }) => (
                <FilterPill key={label} label={label}
                  active={filters.difficulty === value}
                  onClick={() => setFilters({ difficulty: value })} />
              ))}
            </Section>
            <Section title="Cook time">
              {TIME_OPTIONS.map(({ label, value }) => (
                <FilterPill key={label} label={label}
                  active={filters.maxReadyTime === value}
                  onClick={() => setFilters({ maxReadyTime: value })} />
              ))}
            </Section>
            {hasActive && (
              <button onClick={() => { resetFilters(); setOpen(false); }}
                className="w-full text-sm text-red-400 hover:text-red-300 font-medium pt-1 border-t border-white/10 transition-colors">
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}