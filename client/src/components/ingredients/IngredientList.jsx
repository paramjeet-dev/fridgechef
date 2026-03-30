import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useIngredientStore } from '../../store/useIngredientStore';
import IngredientCard from './IngredientCard';
import { EmptyState } from '../shared/index';

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,  // Each card appears 60ms after the previous
    },
  },
};

export default function IngredientList({ uploadId }) {
  const navigate = useNavigate();
  const ingredients = useIngredientStore((s) => s.ingredients);
  const availableIngredients = useIngredientStore((s) => s.availableIngredients());

  if (ingredients.length === 0) {
    return (
      <EmptyState
        icon="🔬"
        title="No ingredients detected"
        description="We couldn't identify any ingredients in your photos. Try again with clearer, better-lit images."
        action={
          <button
            onClick={() => navigate('/upload')}
            className="btn-primary"
          >
            Try again
          </button>
        }
      />
    );
  }

  // Totals across all available ingredients
  const totals = availableIngredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.nutrition?.calories || 0),
      protein:  acc.protein  + (ing.nutrition?.protein  || 0),
      carbs:    acc.carbs    + (ing.nutrition?.carbs     || 0),
      fat:      acc.fat      + (ing.nutrition?.fat       || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <section aria-label="Detected ingredients">
      {/* Header row with count and CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary">
            {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''} detected
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {availableIngredients.length} available · toggle any you don't have
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/results/${uploadId}`)}
          disabled={availableIngredients.length === 0}
          className="btn-primary flex-shrink-0 flex items-center gap-2"
          aria-disabled={availableIngredients.length === 0}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Find recipes
        </motion.button>
      </div>

      {/* Nutrition summary bar */}
      {availableIngredients.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 mb-6 grid grid-cols-4 gap-2 text-center"
          aria-label="Total nutrition from available ingredients"
        >
          {[
            { label: 'Calories', value: Math.round(totals.calories), unit: '' },
            { label: 'Protein',  value: totals.protein.toFixed(1),   unit: 'g' },
            { label: 'Carbs',    value: totals.carbs.toFixed(1),     unit: 'g' },
            { label: 'Fat',      value: totals.fat.toFixed(1),       unit: 'g' },
          ].map(({ label, value, unit }) => (
            <div key={label}>
              <p className="text-lg font-bold text-text-primary">{value}{unit}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Cards grid with stagger animation */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {ingredients.map((ingredient) => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              uploadId={uploadId}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
