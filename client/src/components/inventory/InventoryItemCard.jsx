import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInventoryStore } from '../../store/useInventoryStore';
import toast from 'react-hot-toast';

function ExpiryBadge({ expiryDate }) {
  if (!expiryDate) return null;
  const days = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
  if (days < 0)  return <span className="badge-orange">Expired</span>;
  if (days <= 3) return <span className="badge-orange">{days}d left</span>;
  if (days <= 7) return <span className="badge-slate">{days}d left</span>;
  return null;
}

// Toggle track: w-9 (36px) h-5 (20px)
// Knob: w-4 (16px) h-4 (16px), top-0.5 (2px)
// OFF: x=2 (2px from left), ON: x=18 (36-16-2=18)
function AvailabilityToggle({ isAvailable, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex w-9 h-5 flex-shrink-0 rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 ${
        isAvailable
          ? 'bg-gradient-to-r from-brand-600 to-cyan-600 border-transparent'
          : 'bg-white/10 border-white/20'
      }`}
      role="switch"
      aria-checked={isAvailable}
      aria-label={isAvailable ? 'Mark as unavailable' : 'Mark as available'}
    >
      <motion.span
        animate={{ x: isAvailable ? 16 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="pointer-events-none inline-block w-4 h-4 rounded-full bg-white shadow-sm ring-0"
        style={{ margin: '0px' }}
      />
    </button>
  );
}

export default function InventoryItemCard({ item, isSelected, onToggleSelect }) {
  const { updateItem, deleteItem } = useInventoryStore();
  const [isEditing,  setIsEditing]  = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFields, setEditFields] = useState({
    displayName: item.displayName ?? '',
    quantity:    item.quantity    ?? 1,
    unit:        item.unit        ?? '',
    category:    item.category    ?? 'other',
    expiryDate:  item.expiryDate  ? item.expiryDate.slice(0, 10) : '',
    notes:       item.notes       ?? '',
  });

  useEffect(() => {
    if (!isEditing) setEditFields({
      displayName: item.displayName ?? '',
      quantity:    item.quantity    ?? 1,
      unit:        item.unit        ?? '',
      category:    item.category    ?? 'other',
      expiryDate:  item.expiryDate  ? item.expiryDate.slice(0, 10) : '',
      notes:       item.notes       ?? '',
    });
  }, [item, isEditing]);

  const handleQty = (delta) => updateItem(item._id, { quantity: Math.max(0, (item.quantity ?? 1) + delta) });

  const handleSave = async () => {
    await updateItem(item._id, {
      ...editFields,
      quantity: Number(editFields.quantity),
      expiryDate: editFields.expiryDate || null,
    });
    setIsEditing(false);
    toast.success('Updated.');
  };

  // Pass the full aggregated item (which has _allIds) so the store deletes all duplicates
  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteItem(item);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDeleting ? 0.3 : item.isAvailable ? 1 : 0.5, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      className="card p-4"
    >
      {!isEditing ? (
        <>
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            {/* Checkbox + name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <input
                type="checkbox"
                checked={!!isSelected}
                onChange={onToggleSelect}
                className="w-4 h-4 flex-shrink-0 accent-violet-500 cursor-pointer rounded"
                aria-label={`Select ${item.displayName}`}
              />
              <div className="min-w-0">
                <p className="font-semibold text-text-primary truncate">{item.displayName}</p>
                {item.notes && (
                  <p className="text-xs text-text-muted italic truncate mt-0.5">{item.notes}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <ExpiryBadge expiryDate={item.expiryDate} />
              <button
                onClick={() => setIsEditing(true)}
                className="btn-ghost p-1.5 text-text-muted hover:text-brand-400"
                aria-label={`Edit ${item.displayName}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-ghost p-1.5 text-text-muted hover:text-red-400 disabled:opacity-40"
                aria-label={`Delete ${item.displayName}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Qty + toggle row */}
          <div className="flex items-center justify-between mt-3">
            {/* Qty stepper */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQty(-1)}
                className="w-6 h-6 rounded-full border border-white/15 flex items-center justify-center text-text-muted hover:border-brand-500/50 hover:text-brand-400 transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4"/>
                </svg>
              </button>
              <span className="text-sm font-semibold text-text-primary w-16 text-center tabular-nums">
                {item.quantity ?? 1}{item.unit ? ` ${item.unit}` : ''}
              </span>
              <button
                onClick={() => handleQty(1)}
                className="w-6 h-6 rounded-full border border-white/15 flex items-center justify-center text-text-muted hover:border-brand-500/50 hover:text-brand-400 transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>

            {/* Fixed availability toggle */}
            <AvailabilityToggle
              isAvailable={!!item.isAvailable}
              onToggle={() => updateItem(item._id, { isAvailable: !item.isAvailable })}
            />
          </div>
        </>
      ) : (
        /* Edit form */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold gradient-text">Edit item</p>
            <button onClick={() => setIsEditing(false)} className="btn-ghost p-1 text-xs">Cancel</button>
          </div>
          <input
            className="input text-sm py-2"
            value={editFields.displayName}
            autoFocus
            onChange={(e) => setEditFields((p) => ({ ...p, displayName: e.target.value }))}
            placeholder="Name"
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
              placeholder="Unit"
            />
          </div>
          <select
            className="input text-sm py-2"
            value={editFields.category}
            onChange={(e) => setEditFields((p) => ({ ...p, category: e.target.value }))}
          >
            {['vegetables','fruits','dairy','meat','seafood','grains','condiments','beverages','snacks','other'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="date"
            className="input text-sm py-2"
            value={editFields.expiryDate}
            onChange={(e) => setEditFields((p) => ({ ...p, expiryDate: e.target.value }))}
          />
          <input
            className="input text-sm py-2"
            value={editFields.notes}
            onChange={(e) => setEditFields((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Notes (optional)"
          />
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="btn-primary w-full text-sm py-2"
          >
            Save changes
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
