import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useInventoryStore, CATEGORY_ICONS } from '../store/useInventoryStore';
import InventoryItemCard from '../components/inventory/InventoryItemCard';
import AddItemModal from '../components/inventory/AddItemModal';
import { LoadingSpinner, EmptyState } from '../components/shared/index';

export default function Inventory() {
  const {
    inventory, grouped, total,
    isLoading, isSubmitting,
    fetchInventory, bulkDelete,
    searchQuery, setSearch,
  } = useInventoryStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds,  setSelectedIds]  = useState(new Set());

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const expiringCount = inventory.filter((item) => {
    if (!item.expiryDate) return false;
    const days = Math.ceil((new Date(item.expiryDate) - new Date()) / 86400000);
    return days >= 0 && days <= 3;
  }).length;

  // Selection helpers — work on the primary _id of each aggregated card
  const toggleSelect   = (id) => setSelectedIds((prev) => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const clearSelection = () => setSelectedIds(new Set());
  const selectAll      = () => setSelectedIds(new Set(inventory.map((i) => i._id)));

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    if (!window.confirm(`Remove ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''} (and all their duplicates)?`)) return;

    // Collect ALL raw _ids from every selected aggregated card
    const allRawIds = inventory
      .filter((i) => selectedIds.has(i._id))
      .flatMap((i) => i._allIds ?? [i._id]);

    await bulkDelete(allRawIds);
    clearSelection();
  };

  const sections = Object.entries(grouped)
    .filter(([, items]) => items.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 overflow-hidden">
      <div className="blob w-64 h-64 bg-cyan-500/10 top-0 right-0 animate-blob" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            My <span className="gradient-text">Fridge</span>
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {total} item{total !== 1 ? 's' : ''}
            {expiringCount > 0 && (
              <span className="ml-2 text-amber-400 font-medium">· {expiringCount} expiring soon ⚠️</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/upload" className="btn-secondary text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Scan
          </Link>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Add item
          </motion.button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
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
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between glass rounded-xl px-4 py-3 mb-4 border border-brand-500/20"
          >
            <span className="text-sm font-medium text-brand-300">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <button onClick={clearSelection} className="text-xs text-text-muted hover:text-text-primary font-medium">
                Clear
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isSubmitting}
                className="text-xs font-semibold text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
              >
                Remove selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" label="Loading fridge…" />
        </div>
      ) : inventory.length === 0 ? (
        <EmptyState
          icon="🧊"
          title={searchQuery ? 'No matching items' : 'Your fridge is empty'}
          description={searchQuery ? `No ingredients match "${searchQuery}".` : 'Add items manually or scan your fridge.'}
          action={!searchQuery && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">+ Add your first item</button>
          )}
        />
      ) : (
        <>
          {inventory.length > 1 && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-text-muted">{inventory.length} items</span>
              <button
                onClick={selectedIds.size === inventory.length ? clearSelection : selectAll}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                {selectedIds.size === inventory.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
          )}

          <div className="space-y-8">
            {sections.map(([category, items]) => (
              <section key={category}>
                {/* Category header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl" aria-hidden="true">{CATEGORY_ICONS[category] || '📦'}</span>
                  <h2 className="text-base font-bold text-text-primary capitalize">{category}</h2>
                  <span className="badge-slate">{items.length}</span>
                </div>

                <motion.div layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <InventoryItemCard
                        key={item._id}
                        item={item}
                        isSelected={selectedIds.has(item._id)}
                        onToggleSelect={() => toggleSelect(item._id)}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </section>
            ))}
          </div>
        </>
      )}

      <AddItemModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </main>
  );
}
