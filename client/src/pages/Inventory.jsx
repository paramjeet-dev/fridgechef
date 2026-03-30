import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useInventoryStore, CATEGORIES, CATEGORY_ICONS } from '../store/useInventoryStore';
import { useDebounce } from '../hooks/useDebounce';
import InventoryItemCard from '../components/inventory/InventoryItemCard';
import AddItemModal from '../components/inventory/AddItemModal';
import { LoadingSpinner, EmptyState } from '../components/shared/index';

export default function Inventory() {
  const {
    inventory, grouped, total, isLoading,
    fetchInventory, bulkDelete, isSubmitting,
    searchQuery, setSearch, activeCategory, setCategory,
  } = useInventoryStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const debouncedSearch = useDebounce(searchQuery, 350);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchInventory({
      search: debouncedSearch || undefined,
      category: activeCategory || undefined,
    });
  }, [debouncedSearch, activeCategory, fetchInventory]);

  // Derived: filtered items (client-side category filter for instant feedback)
  const displayItems = activeCategory
    ? (grouped[activeCategory] || [])
    : inventory;

  // ── Selection helpers ──────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(displayItems.map((i) => i._id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    const confirmed = window.confirm(`Remove ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''} from your fridge?`);
    if (!confirmed) return;
    await bulkDelete([...selectedIds]);
    clearSelection();
  };

  // ── Expiry summary ─────────────────────────────────────────
  const expiringCount = inventory.filter((item) => {
    if (!item.expiryDate) return false;
    const days = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 3;
  }).length;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">My Fridge</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {total} item{total !== 1 ? 's' : ''} in your fridge
            {expiringCount > 0 && (
              <span className="ml-2 text-accent-500 font-medium">
                · {expiringCount} expiring soon
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/upload" className="btn-secondary text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Scan
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add item
          </button>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────── */}
      <div className="relative mb-4">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="input pl-10"
          placeholder="Search ingredients…"
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Category filter pills ────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {[{ value: '', label: 'All' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              activeCategory === value
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white text-text-secondary border-slate-200 hover:border-brand-300'
            }`}
          >
            {value && <span aria-hidden="true">{CATEGORY_ICONS[value]}</span>}
            <span className="capitalize">{label}</span>
            {value && grouped[value]?.length > 0 && (
              <span className={`text-xs ${activeCategory === value ? 'text-white/80' : 'text-text-muted'}`}>
                {grouped[value].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Bulk action bar ──────────────────────────────────── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 mb-4"
          >
            <span className="text-sm font-medium text-brand-700">
              {selectedIds.size} selected
            </span>
            <div className="flex gap-2">
              <button onClick={clearSelection} className="text-xs text-brand-600 hover:text-brand-800 font-medium">
                Clear
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isSubmitting}
                className="text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Remove selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" label="Loading fridge…" />
        </div>
      ) : displayItems.length === 0 ? (
        <EmptyState
          icon="🧊"
          title={searchQuery ? 'No matching items' : 'Your fridge is empty'}
          description={
            searchQuery
              ? `No ingredients match "${searchQuery}".`
              : 'Add items manually or scan your fridge to get started.'
          }
          action={
            !searchQuery && (
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                + Add your first item
              </button>
            )
          }
        />
      ) : activeCategory ? (
        /* Single category grid */
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">{CATEGORY_ICONS[activeCategory]}</span>
              <h2 className="text-base font-semibold text-text-primary capitalize">{activeCategory}</h2>
              <span className="text-sm text-text-muted">({displayItems.length})</span>
            </div>
            {displayItems.length > 1 && (
              <button onClick={selectedIds.size === displayItems.length ? clearSelection : selectAll}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                {selectedIds.size === displayItems.length ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {displayItems.map((item) => (
                <div key={item._id} className="relative">
                  {/* Selection checkbox */}
                  <input
                    type="checkbox"
                    className="absolute top-3 left-3 z-10 w-4 h-4 accent-brand-500 cursor-pointer"
                    checked={selectedIds.has(item._id)}
                    onChange={() => toggleSelect(item._id)}
                    aria-label={`Select ${item.displayName}`}
                  />
                  <div className={selectedIds.has(item._id) ? 'ring-2 ring-brand-400 rounded-2xl' : ''}>
                    <InventoryItemCard item={item} />
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>
      ) : (
        /* All categories grouped */
        <div className="space-y-8">
          {Object.entries(grouped)
            .filter(([, items]) => items.length > 0)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, items]) => (
              <section key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl" aria-hidden="true">{CATEGORY_ICONS[category]}</span>
                  <h2 className="text-base font-semibold text-text-primary capitalize">{category}</h2>
                  <span className="text-sm text-text-muted">({items.length})</span>
                </div>
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <div key={item._id} className="relative">
                        <input
                          type="checkbox"
                          className="absolute top-3 left-3 z-10 w-4 h-4 accent-brand-500 cursor-pointer"
                          checked={selectedIds.has(item._id)}
                          onChange={() => toggleSelect(item._id)}
                          aria-label={`Select ${item.displayName}`}
                        />
                        <div className={selectedIds.has(item._id) ? 'ring-2 ring-brand-400 rounded-2xl' : ''}>
                          <InventoryItemCard item={item} />
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </section>
            ))}
        </div>
      )}

      {/* ── Add modal ─────────────────────────────────────────── */}
      <AddItemModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </main>
  );
}