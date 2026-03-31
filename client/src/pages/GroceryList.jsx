import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axiosInstance';
import { LoadingSpinner, EmptyState } from '../components/shared/index';

const AISLE_ICONS = {
  produce: '🥦', dairy: '🥛', meat: '🥩', seafood: '🐟',
  pantry: '🫙', beverages: '🧃', frozen: '🧊', bakery: '🍞', other: '📦',
};

const AISLE_ORDER = ['produce', 'dairy', 'meat', 'seafood', 'pantry', 'beverages', 'frozen', 'bakery', 'other'];

const STORAGE_KEY = 'fridgechef_grocery_checked';

function loadChecked() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []); }
  catch { return new Set(); }
}
function saveChecked(set) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); } catch {}
}

function GroceryItem({ item, checked, onToggle }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: checked ? 0.45 : 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0"
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(item.normalised)}
        className="w-4 h-4 accent-brand-500 cursor-pointer flex-shrink-0"
        aria-label={`Mark ${item.name} as purchased`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-text-primary capitalize ${checked ? 'line-through text-text-muted' : ''}`}>
          {item.name}
        </p>
        {item.usedIn?.length > 0 && (
          <p className="text-xs text-text-muted truncate">
            For: {item.usedIn.join(', ')}
          </p>
        )}
      </div>
      {(item.amount || item.unit) && (
        <span className="text-xs text-text-muted flex-shrink-0">
          {item.amount ? Number(item.amount).toFixed(item.amount % 1 === 0 ? 0 : 1) : ''} {item.unit}
        </span>
      )}
      <a
        href={item.shoppingUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700
                   border border-brand-200 hover:border-brand-400 hover:bg-brand-50
                   px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
        aria-label={`Buy ${item.name} on BigBasket`}
      >
        Buy
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </motion.li>
  );
}

export default function GroceryList() {
  const [items, setItems]     = useState([]);
  const [grouped, setGrouped] = useState({});
  const [total, setTotal]     = useState(0);
  const [isLoading, setLoad]  = useState(true);
  const [error, setError]     = useState(null);
  const [checked, setChecked] = useState(loadChecked);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/grocery');
        setItems(data.items);
        setGrouped(data.grouped);
        setTotal(data.total);
      } catch {
        setError('Failed to load grocery list.');
      } finally {
        setLoad(false);
      }
    })();
  }, []);

  const toggleItem = useCallback((key) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      saveChecked(next);
      return next;
    });
  }, []);

  const clearChecked = () => {
    setChecked(new Set());
    saveChecked(new Set());
  };

  const checkedCount = [...checked].filter((k) => items.some((i) => i.normalised === k)).length;
  const remaining = total - checkedCount;

  const sortedAisles = AISLE_ORDER.filter((a) => grouped[a]?.length > 0);
  const otherAisles  = Object.keys(grouped).filter((a) => !AISLE_ORDER.includes(a) && grouped[a]?.length > 0);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Grocery list</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {isLoading ? 'Loading…'
              : total === 0 ? 'Nothing to buy this week'
              : `${remaining} item${remaining !== 1 ? 's' : ''} to buy · ${checkedCount} in cart`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {checkedCount > 0 && (
            <button onClick={clearChecked} className="btn-secondary text-sm">
              Clear cart
            </button>
          )}
          <Link to="/mealplan" className="btn-primary text-sm">
            Edit meal plan
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">Shopping progress</span>
            <span className="text-sm font-bold text-brand-600">{checkedCount}/{total}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand-500 rounded-full"
              animate={{ width: total > 0 ? `${(checkedCount / total) * 100}%` : '0%' }}
              transition={{ duration: 0.4 }}
            />
          </div>
          {checkedCount === total && total > 0 && (
            <p className="text-xs text-brand-600 font-medium mt-2 text-center">
              🎉 All done! Your cart is ready.
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon="🛒"
          title="Nothing to buy"
          description="Either your meal plan is empty, or you already have all the ingredients in your fridge inventory."
          action={<Link to="/mealplan" className="btn-primary">Set up meal plan</Link>}
        />
      ) : (
        <div className="space-y-6">
          {[...sortedAisles, ...otherAisles].map((aisle) => {
            const aisleItems = grouped[aisle] || [];
            const aisleChecked = aisleItems.filter((i) => checked.has(i.normalised)).length;
            return (
              <div key={aisle} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">{AISLE_ICONS[aisle] || '📦'}</span>
                    <h2 className="text-sm font-semibold text-text-primary capitalize">{aisle}</h2>
                    <span className="text-xs text-text-muted">
                      ({aisleItems.length - aisleChecked} left)
                    </span>
                  </div>
                </div>
                <ul role="list">
                  <AnimatePresence>
                    {aisleItems.map((item) => (
                      <GroceryItem
                        key={item.normalised}
                        item={item}
                        checked={checked.has(item.normalised)}
                        onToggle={toggleItem}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}