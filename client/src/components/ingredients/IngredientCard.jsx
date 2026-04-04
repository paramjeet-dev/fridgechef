import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import { useIngredientStore } from '../../store/useIngredientStore';
import NutritionPanel from './NutritionPanel';

const IngredientCard = forwardRef(({ ingredient, uploadId }, ref) => {
  const { toggleAvailability, isTogglingId } = useIngredientStore();
  const id = ingredient.id || ingredient._id;
  const isToggling = isTogglingId === id;
  const { displayName, isAvailable, nutrition, suggestedServingDescription } = ingredient;

  return (
    <motion.article
      ref={ref} layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isAvailable ? 1 : 0.45, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.3 }}
      className={`card p-4 ${isAvailable ? '' : 'grayscale-[30%]'}`}
      aria-label={`${displayName} — ${isAvailable ? 'available' : 'unavailable'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary capitalize truncate">{displayName}</h3>
          {suggestedServingDescription && (
            <p className="text-xs text-text-muted mt-0.5 truncate">{suggestedServingDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-text-muted hidden sm:block">{isAvailable ? 'Have it' : 'Skip'}</span>
          <button
            onClick={() => toggleAvailability(uploadId, id)}
            disabled={isToggling}
            className={`relative w-10 h-5 rounded-full transition-all duration-200 disabled:cursor-wait
              ${isAvailable ? 'bg-gradient-to-r from-brand-600 to-cyan-600 shadow-glow-sm' : 'bg-white/10 border border-white/15'}`}
            role="switch" aria-checked={isAvailable}
            aria-label={`Mark ${displayName} as ${isAvailable ? 'unavailable' : 'available'}`}
          >
            <motion.span layout animate={{ x: isAvailable ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
          </button>
        </div>
      </div>

      {nutrition && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[
            { label: `${Math.round(nutrition.calories)} cal`, cls: 'badge-green' },
            { label: `${nutrition.protein?.toFixed(1)}g protein`, cls: 'badge-cyan' },
            { label: `${nutrition.carbs?.toFixed(1)}g carbs`, cls: 'badge-slate' },
            { label: `${nutrition.fat?.toFixed(1)}g fat`, cls: 'badge-slate' },
          ].map(({ label, cls }) => (
            <span key={label} className={cls}>{label}</span>
          ))}
        </div>
      )}
      <NutritionPanel nutrition={nutrition} />
    </motion.article>
  );
});

IngredientCard.displayName = 'IngredientCard';
export default IngredientCard;