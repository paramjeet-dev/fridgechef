import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventoryStore } from '../../store/useInventoryStore';

const BLANK = {
  name: '', displayName: '', quantity: 1, unit: '',
  category: 'other', expiryDate: '', notes: '',
};

const CATEGORIES = ['vegetables','fruits','dairy','meat','seafood','grains','condiments','beverages','snacks','other'];

export default function AddItemModal({ open, onClose }) {
  const { addItem, isSubmitting } = useInventoryStore();
  const [fields, setFields] = useState(BLANK);
  const [error, setError] = useState('');

  const set = (k) => (e) => {
    setFields((p) => ({ ...p, [k]: e.target.value }));
    if (k === 'name') setFields((p) => ({ ...p, name: e.target.value, displayName: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fields.name.trim()) { setError('Name is required.'); return; }
    const result = await addItem({
      ...fields,
      displayName: fields.displayName || fields.name,
    });
    if (result.success) {
      setFields(BLANK);
      onClose();
    }
  };

  const handleClose = () => { setFields(BLANK); setError(''); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Add ingredient"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-modal z-10"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-display font-bold text-text-primary">Add to fridge</h2>
              <button onClick={handleClose} className="btn-ghost p-1" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Ingredient name <span className="text-red-400">*</span>
                </label>
                <input
                  className={`input ${error ? 'border-red-400' : ''}`}
                  placeholder="e.g. Tomato"
                  value={fields.name}
                  onChange={(e) => {
                    setFields((p) => ({ ...p, name: e.target.value, displayName: e.target.value }));
                    setError('');
                  }}
                  autoFocus
                />
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
              </div>

              {/* Quantity + unit */}
              <div className="flex gap-3">
                <div className="w-28">
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="input"
                    value={fields.quantity}
                    onChange={set('quantity')}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Unit</label>
                  <input
                    className="input"
                    placeholder="kg, cups, pieces…"
                    value={fields.unit}
                    onChange={set('unit')}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
                <select className="input" value={fields.category} onChange={set('category')}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>

              {/* Expiry date */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Expiry date <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <input type="date" className="input" value={fields.expiryDate} onChange={set('expiryDate')} />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Notes <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <input
                  className="input"
                  placeholder="Brand, store, etc."
                  value={fields.notes}
                  onChange={set('notes')}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Adding…
                  </>
                ) : '+ Add to fridge'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}