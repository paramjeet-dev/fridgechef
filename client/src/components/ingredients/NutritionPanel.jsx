import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Macro bar ─────────────────────────────────────────────────
function MacroBar({ label, value, unit, color, max }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="font-medium text-text-primary">{value}{unit}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ── Micronutrient row ─────────────────────────────────────────
function MicroRow({ label, value, unit }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="text-xs font-medium text-text-primary">{value}{unit}</span>
    </div>
  );
}

export default function NutritionPanel({ nutrition }) {
  const [open, setOpen] = useState(false);
  if (!nutrition) return null;

  const { calories, protein, carbs, fat, fiber, sugar,
    sodium, potassium, cholesterol,
    saturatedFat, vitaminA, vitaminC, calcium, iron,
    servingDescription } = nutrition;

  return (
    <div className="mt-3">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
        aria-expanded={open}
        aria-controls="nutrition-panel"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {open ? 'Hide nutrition' : 'Full nutrition info'}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="nutrition-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-4">
              {/* Serving size */}
              {servingDescription && (
                <p className="text-xs text-text-muted">Per {servingDescription}</p>
              )}

              {/* Calories highlight */}
              <div className="flex items-center justify-between bg-brand-50 rounded-xl px-4 py-3">
                <span className="text-sm font-semibold text-brand-700">Calories</span>
                <span className="text-xl font-bold text-brand-600">{Math.round(calories)}</span>
              </div>

              {/* Macro bars */}
              <div className="space-y-3">
                <MacroBar label="Protein"  value={protein?.toFixed(1)} unit="g" color="bg-blue-400"   max={50} />
                <MacroBar label="Carbs"    value={carbs?.toFixed(1)}   unit="g" color="bg-amber-400"  max={150} />
                <MacroBar label="Fat"      value={fat?.toFixed(1)}     unit="g" color="bg-rose-400"   max={65} />
                <MacroBar label="Fiber"    value={fiber?.toFixed(1)}   unit="g" color="bg-green-400"  max={30} />
                <MacroBar label="Sugar"    value={sugar?.toFixed(1)}   unit="g" color="bg-pink-400"   max={50} />
              </div>

              {/* Micronutrients */}
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Micronutrients
                </p>
                <div className="divide-y divide-slate-50">
                  <MicroRow label="Sodium"       value={sodium}      unit="mg" />
                  <MicroRow label="Potassium"    value={potassium}   unit="mg" />
                  <MicroRow label="Cholesterol"  value={cholesterol} unit="mg" />
                  <MicroRow label="Saturated Fat" value={saturatedFat?.toFixed(1)} unit="g" />
                  <MicroRow label="Vitamin A"    value={vitaminA}    unit="mcg" />
                  <MicroRow label="Vitamin C"    value={vitaminC}    unit="mg" />
                  <MicroRow label="Calcium"      value={calcium}     unit="mg" />
                  <MicroRow label="Iron"         value={iron}        unit="mg" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
