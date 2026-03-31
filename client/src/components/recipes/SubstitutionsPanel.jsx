import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosInstance';
import { LoadingSpinner } from '../shared/index';

export default function SubstitutionsPanel({ spoonacularId }) {
  const [open, setOpen]         = useState(false);
  const [substitutes, setSubs]  = useState(null);  // null = not loaded yet
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState(null);

  const handleOpen = async () => {
    setOpen((o) => !o);
    if (substitutes !== null) return;  // Already loaded

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/recipes/${spoonacularId}/substitutes`);
      setSubs(data.substitutes || []);
    } catch {
      setError('Could not load substitutes.');
      setSubs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5">
      <button
        onClick={handleOpen}
        className="flex items-center justify-between w-full"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🔄</span>
          <span className="text-sm font-semibold text-text-primary">Ingredient substitutions</span>
        </div>
        <svg className={`w-4 h-4 text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-slate-100 pt-4">
              {isLoading && (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" label="Loading substitutes…" />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500 text-center py-2">{error}</p>
              )}

              {!isLoading && substitutes?.length === 0 && (
                <p className="text-sm text-text-muted text-center py-2">
                  No substitutes found for this recipe's ingredients.
                </p>
              )}

              {!isLoading && substitutes?.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs text-text-muted">
                    Common swaps if you're missing an ingredient:
                  </p>
                  {substitutes.map(({ ingredientName, substitutes: subs }) => (
                    <div key={ingredientName}>
                      <p className="text-sm font-semibold text-text-primary capitalize mb-1.5">
                        {ingredientName}
                      </p>
                      <ul className="space-y-1.5 ml-2">
                        {subs.map((sub, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                            <span className="text-brand-500 flex-shrink-0 mt-0.5">→</span>
                            <span>{sub}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}