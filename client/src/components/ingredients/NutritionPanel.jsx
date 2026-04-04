import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function MacroBar({ label, value, unit, color, max }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-muted">{label}</span>
        <span className="font-medium text-text-secondary">{value}{unit}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

function MicroRow({ label, value, unit }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-xs font-medium text-text-secondary">{value}{unit}</span>
    </div>
  );
}

export default function NutritionPanel({ nutrition }) {
  const [open, setOpen] = useState(false);
  if (!nutrition) return null;

  const { calories, protein, carbs, fat, fiber, sugar,
    sodium, potassium, cholesterol, saturatedFat,
    vitaminA, vitaminC, calcium, iron, servingDescription } = nutrition;

  return (
    <div className="mt-3">
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
        aria-expanded={open}>
        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
        </svg>
        {open ? 'Hide nutrition' : 'Full nutrition info'}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
            <div className="mt-3 space-y-4">
              {servingDescription && <p className="text-xs text-text-muted">Per {servingDescription}</p>}

              <div className="flex items-center justify-between bg-gradient-to-r from-brand-600/20 to-cyan-600/20
                              border border-brand-500/20 rounded-xl px-4 py-3">
                <span className="text-sm font-semibold text-brand-300">Calories</span>
                <span className="text-xl font-bold gradient-text">{Math.round(calories)}</span>
              </div>

              <div className="space-y-3">
                <MacroBar label="Protein" value={protein?.toFixed(1)} unit="g" color="bg-blue-500"   max={50}  />
                <MacroBar label="Carbs"   value={carbs?.toFixed(1)}   unit="g" color="bg-amber-500"  max={150} />
                <MacroBar label="Fat"     value={fat?.toFixed(1)}     unit="g" color="bg-rose-500"   max={65}  />
                <MacroBar label="Fiber"   value={fiber?.toFixed(1)}   unit="g" color="bg-emerald-500" max={30} />
                <MacroBar label="Sugar"   value={sugar?.toFixed(1)}   unit="g" color="bg-pink-500"   max={50}  />
              </div>

              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Micronutrients</p>
                <MicroRow label="Sodium"        value={sodium}                     unit="mg" />
                <MicroRow label="Potassium"     value={potassium}                  unit="mg" />
                <MicroRow label="Cholesterol"   value={cholesterol}                unit="mg" />
                <MicroRow label="Saturated Fat" value={saturatedFat?.toFixed(1)}  unit="g"  />
                <MicroRow label="Vitamin A"     value={vitaminA}                   unit="mcg"/>
                <MicroRow label="Vitamin C"     value={vitaminC}                   unit="mg" />
                <MicroRow label="Calcium"       value={calcium}                    unit="mg" />
                <MicroRow label="Iron"          value={iron}                       unit="mg" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}