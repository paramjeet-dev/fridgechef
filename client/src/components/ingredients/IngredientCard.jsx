import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import { useIngredientStore } from '../../store/useIngredientStore';
import NutritionPanel from './NutritionPanel';

const IngredientCard = forwardRef(({ ingredient, uploadId }, ref) => {
  const { toggleAvailability, isTogglingId } = useIngredientStore();
  const isToggling = isTogglingId === ingredient.id;

  const { id, displayName, name, isAvailable, nutrition, suggestedServingDescription } = ingredient;

  return (
    <motion.article
      ref={ref} // ✅ THIS is the key fix
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isAvailable ? 1 : 0.55, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`card p-4 transition-shadow duration-200 ${
        isAvailable ? 'hover:shadow-card-hover' : 'grayscale-[40%]'
      }`}
      aria-label={`${displayName} — ${isAvailable ? 'available' : 'unavailable'}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary capitalize truncate">
            {displayName}
          </h3>
          {suggestedServingDescription && (
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {suggestedServingDescription}
            </p>
          )}
        </div>

        {/* Availability toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-text-muted hidden sm:block">
            {isAvailable ? 'Have it' : 'Skip'}
          </span>
          <button
            onClick={() => toggleAvailability(uploadId, id)}
            disabled={isToggling}
            className={`
              relative w-10 h-5 rounded-full transition-colors duration-200
              focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
              disabled:cursor-wait
              ${isAvailable ? 'bg-brand-500' : 'bg-slate-200'}
            `}
            role="switch"
            aria-checked={isAvailable}
            aria-label={`Mark ${displayName} as ${isAvailable ? 'unavailable' : 'available'}`}
          >
            <motion.span
              layout
              animate={{ x: isAvailable ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>
      </div>

      {/* Macro summary chips */}
      {nutrition && (
        <div className="flex flex-wrap gap-1.5 mt-3" aria-label="Nutritional summary">
          {[
            { label: `${Math.round(nutrition.calories)} cal`, color: 'badge-green' },
            { label: `${nutrition.protein?.toFixed(1)}g protein`, color: 'badge-slate' },
            { label: `${nutrition.carbs?.toFixed(1)}g carbs`, color: 'badge-slate' },
            { label: `${nutrition.fat?.toFixed(1)}g fat`, color: 'badge-slate' },
          ].map(({ label, color }) => (
            <span key={label} className={color}>{label}</span>
          ))}
        </div>
      )}

      {/* Expandable full nutrition */}
      <NutritionPanel nutrition={nutrition} />
    </motion.article>
  );
});

export default IngredientCard;