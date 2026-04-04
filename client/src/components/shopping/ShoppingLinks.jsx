import { motion } from 'framer-motion';

export default function ShoppingLinks({ missedIngredients = [] }) {
  if (!missedIngredients.length) {
    return (
      <div className="card p-5 text-center">
        <div className="text-3xl mb-2">🎉</div>
        <p className="text-sm font-semibold gradient-text">You have everything for this recipe!</p>
      </div>
    );
  }

  const bulkUrl = `https://www.bigbasket.com/ps/?q=${
    missedIngredients.map((i) => encodeURIComponent(i.name)).join(',')
  }`;

  return (
    <section aria-label="Missing ingredients">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-text-primary">
            Missing ingredients
            <span className="ml-2 badge-orange">{missedIngredients.length}</span>
          </h4>
          <a href={bulkUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs font-semibold gradient-text hover:opacity-80 flex items-center gap-1 transition-opacity">
            Add all to cart
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>
        </div>

        <ul className="space-y-2.5" role="list">
          {missedIngredients.map((item, i) => (
            <motion.li key={item.name}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {item.image && (
                  <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-white/5 flex-shrink-0" aria-hidden="true"/>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary capitalize truncate">{item.name}</p>
                  {(item.amount || item.unit) && (
                    <p className="text-xs text-text-muted">{item.amount} {item.unit}</p>
                  )}
                </div>
              </div>
              <a href={item.shoppingUrl} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 text-xs font-semibold text-cyan-400 hover:text-cyan-300
                           border border-cyan-500/30 hover:border-cyan-400/50 hover:bg-cyan-500/10
                           px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                aria-label={`Buy ${item.name}`}>
                Buy
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}