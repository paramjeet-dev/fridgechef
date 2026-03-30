import { motion } from 'framer-motion';

const BB_SEARCH_BASE = 'https://www.bigbasket.com/ps/?q=';

function buildBulkUrl(items) {
  // One combined BigBasket search for the first item works best
  // (BigBasket doesn't support multi-item search in one URL reliably)
  // Instead open the first missing item and inform the user
  const query = items.map((i) => encodeURIComponent(i.name)).join('%20');
  return `${BB_SEARCH_BASE}${query}`;
}

export default function ShoppingLinks({ missedIngredients = [] }) {
  if (!missedIngredients.length) {
    return (
      <div className="card p-4 text-center">
        <span className="text-2xl" aria-hidden="true">🎉</span>
        <p className="mt-2 text-sm font-medium text-brand-600">
          You have everything for this recipe!
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Missing ingredients and shopping links">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-text-primary">
            Missing ingredients ({missedIngredients.length})
          </h4>

          {/* Bulk: open BigBasket for all */}
          <a
            href={`${BB_SEARCH_BASE}${missedIngredients.map(i => encodeURIComponent(i.name)).join(',')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            aria-label="Add all missing ingredients to BigBasket search"
          >
            Add all to cart
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <ul className="space-y-2" role="list">
          {missedIngredients.map((item, i) => (
            <motion.li
              key={item.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary capitalize truncate">
                    {item.name}
                  </p>
                  {(item.amount || item.unit) && (
                    <p className="text-xs text-text-muted">
                      {item.amount} {item.unit}
                    </p>
                  )}
                </div>
              </div>

              <a
                href={item.shoppingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700
                           border border-brand-200 hover:border-brand-400 hover:bg-brand-50
                           px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                aria-label={`Buy ${item.name} on BigBasket`}
              >
                <span>Buy</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
