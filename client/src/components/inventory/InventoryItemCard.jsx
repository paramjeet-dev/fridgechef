import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInventoryStore, CATEGORY_ICONS } from '../../store/useInventoryStore';
import toast from 'react-hot-toast';

function ExpiryBadge({ expiryDate }) {
  if (!expiryDate) return null;
  const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0)  return <span className="badge-orange">Expired</span>;
  if (days <= 3) return <span className="badge-orange">{days}d left</span>;
  if (days <= 7) return <span className="badge-slate">{days}d left</span>;
  return null;
}

export default function InventoryItemCard({ item }) {
  const { updateItem, deleteItem } = useInventoryStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // editFields always stays in sync with the latest item from the store
  const [editFields, setEditFields] = useState(() => ({
    displayName: item.displayName ?? '',
    quantity:    item.quantity    ?? 1,
    unit:        item.unit        ?? '',
    category:    item.category    ?? 'other',
    expiryDate:  item.expiryDate  ? item.expiryDate.slice(0, 10) : '',
    notes:       item.notes       ?? '',
  }));

  // Re-sync edit fields whenever the item changes in the store
  useEffect(() => {
    if (!isEditing) {
      setEditFields({
        displayName: item.displayName ?? '',
        quantity:    item.quantity    ?? 1,
        unit:        item.unit        ?? '',
        category:    item.category    ?? 'other',
        expiryDate:  item.expiryDate  ? item.expiryDate.slice(0, 10) : '',
        notes:       item.notes       ?? '',
      });
    }
  }, [item, isEditing]);

  const icon = CATEGORY_ICONS[item.category] || '📦';

  const handleQuantityChange = (delta) => {
    const newQty = Math.max(0, (item.quantity ?? 1) + delta);
    updateItem(item._id, { quantity: newQty });
  };

  const handleSave = async () => {
    await updateItem(item._id, {
      ...editFields,
      quantity:   Number(editFields.quantity),
      expiryDate: editFields.expiryDate || null,
    });
    setIsEditing(false);
    toast.success('Updated.');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteItem(item._id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDeleting ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`card p-4 ${!item.isAvailable ? 'opacity-50' : ''}`}
    >
      {!isEditing ? (
        /* ── View mode ───────────────────────────────────── */
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl flex-shrink-0" aria-hidden="true">{icon}</span>
              <div className="min-w-0">
                <p className="font-semibold text-text-primary truncate">{item.displayName}</p>
                <p className="text-xs text-text-muted capitalize">{item.category || 'other'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ExpiryBadge expiryDate={item.expiryDate} />
              <button
                onClick={() => setIsEditing(true)}
                className="btn-ghost p-1.5 text-text-muted hover:text-text-primary"
                aria-label={`Edit ${item.displayName}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-ghost p-1.5 text-text-muted hover:text-red-500"
                aria-label={`Delete ${item.displayName}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quantity controls + availability */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center
                           text-text-secondary hover:border-brand-400 hover:text-brand-600 transition-colors"
                aria-label="Decrease quantity"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-text-primary w-14 text-center">
                {item.quantity ?? 1}{item.unit ? ` ${item.unit}` : ''}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center
                           text-text-secondary hover:border-brand-400 hover:text-brand-600 transition-colors"
                aria-label="Increase quantity"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => updateItem(item._id, { isAvailable: !item.isAvailable })}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200
                          focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
                          ${item.isAvailable ? 'bg-brand-500' : 'bg-slate-200'}`}
              role="switch"
              aria-checked={item.isAvailable}
              aria-label={`Mark ${item.displayName} as ${item.isAvailable ? 'unavailable' : 'available'}`}
            >
              <motion.span
                layout
                animate={{ x: item.isAvailable ? 18 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>

          {item.notes && (
            <p className="text-xs text-text-muted mt-2 italic truncate">{item.notes}</p>
          )}
        </>
      ) : (
        /* ── Edit mode ───────────────────────────────────── */
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-text-primary">Edit item</p>
            <button onClick={() => setIsEditing(false)} className="btn-ghost p-1 text-xs">Cancel</button>
          </div>

          <input
            className="input text-sm py-2"
            value={editFields.displayName}
            onChange={(e) => setEditFields((p) => ({ ...p, displayName: e.target.value }))}
            placeholder="Name"
            autoFocus
          />

          <div className="flex gap-2">
            <input
              type="number" min="0"
              className="input text-sm py-2 w-24"
              value={editFields.quantity}
              onChange={(e) => setEditFields((p) => ({ ...p, quantity: e.target.value }))}
              placeholder="Qty"
            />
            <input
              className="input text-sm py-2 flex-1"
              value={editFields.unit}
              onChange={(e) => setEditFields((p) => ({ ...p, unit: e.target.value }))}
              placeholder="Unit (kg, cups…)"
            />
          </div>

          <select
            className="input text-sm py-2"
            value={editFields.category}
            onChange={(e) => setEditFields((p) => ({ ...p, category: e.target.value }))}
          >
            {['vegetables','fruits','dairy','meat','seafood','grains','condiments','beverages','snacks','other'].map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>

          <input
            type="date" className="input text-sm py-2"
            value={editFields.expiryDate}
            onChange={(e) => setEditFields((p) => ({ ...p, expiryDate: e.target.value }))}
          />

          <input
            className="input text-sm py-2"
            value={editFields.notes}
            onChange={(e) => setEditFields((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Notes (optional)"
          />

          <button onClick={handleSave} className="btn-primary w-full text-sm py-2">
            Save changes
          </button>
        </div>
      )}
    </motion.div>
  );
}
