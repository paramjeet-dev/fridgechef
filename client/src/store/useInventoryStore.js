import { create } from 'zustand';
import { inventoryApi } from '../api/inventoryApi';
import toast from 'react-hot-toast';

export const CATEGORIES = [
  'vegetables', 'fruits', 'dairy', 'meat', 'seafood',
  'grains', 'condiments', 'beverages', 'snacks', 'other',
];

export const CATEGORY_ICONS = {
  vegetables: '🥦', fruits: '🍎', dairy: '🥛', meat: '🥩',
  seafood: '🐟', grains: '🌾', condiments: '🫙', beverages: '🧃',
  snacks: '🍿', other: '📦',
};

// Merge multiple docs with the same ingredient name into one entry
function aggregateByName(items) {
  const map = new Map();
  for (const item of items) {
    const key = (item.name || '').toLowerCase().trim();
    if (!map.has(key)) {
      map.set(key, { ...item, quantity: item.quantity ?? 1 });
    } else {
      const prev = map.get(key);
      map.set(key, {
        ...prev,
        quantity: (prev.quantity ?? 1) + (item.quantity ?? 1),
        expiryDate:
          item.expiryDate &&
          (!prev.expiryDate || new Date(item.expiryDate) > new Date(prev.expiryDate))
            ? item.expiryDate
            : prev.expiryDate,
      });
    }
  }
  return Array.from(map.values());
}

function buildGrouped(inventory) {
  const grouped = {};
  for (const item of inventory) {
    const cat = item.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }
  return grouped;
}

function applySearch(items, query) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(
    (i) =>
      (i.name || '').toLowerCase().includes(q) ||
      (i.displayName || '').toLowerCase().includes(q)
  );
}

export const useInventoryStore = create((set, get) => ({
  // raw items from server (before search filter)
  _rawInventory: [],
  inventory: [],
  grouped: {},
  total: 0,
  isLoading: false,
  isSubmitting: false,
  searchQuery: '',

  // ── Internal helper ───────────────────────────────────────
  _recompute: (raw, query) => {
    const aggregated = aggregateByName(raw);
    const filtered = applySearch(aggregated, query);
    set({
      _rawInventory: raw,
      inventory: filtered,
      grouped: buildGrouped(filtered),
      total: filtered.length,
    });
  },

  // ── Fetch ─────────────────────────────────────────────────
  fetchInventory: async () => {
    set({ isLoading: true });
    try {
      const { data } = await inventoryApi.getAll();
      get()._recompute(data.inventory || [], get().searchQuery);
    } catch {
      toast.error('Failed to load inventory.');
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Add one ───────────────────────────────────────────────
  addItem: async (formData) => {
    set({ isSubmitting: true });
    try {
      const { data } = await inventoryApi.add(formData);
      toast.success(data.message);
      const raw = [...get()._rawInventory, data.ingredient];
      get()._recompute(raw, get().searchQuery);
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add item.');
      return { success: false };
    } finally {
      set({ isSubmitting: false });
    }
  },

  // ── Update (real-time: updates local state immediately) ───
  updateItem: async (id, updates) => {
    const prevRaw = get()._rawInventory;
    const newRaw = prevRaw.map((item) =>
      item._id === id ? { ...item, ...updates } : item
    );
    get()._recompute(newRaw, get().searchQuery);
    try {
      await inventoryApi.update(id, updates);
    } catch (error) {
      get()._recompute(prevRaw, get().searchQuery); // rollback
      toast.error(error.response?.data?.message || 'Failed to update item.');
    }
  },

  // ── Delete one (real-time) ────────────────────────────────
  deleteItem: async (id) => {
    const prevRaw = get()._rawInventory;
    const newRaw = prevRaw.filter((i) => i._id !== id);
    get()._recompute(newRaw, get().searchQuery);
    try {
      const { data } = await inventoryApi.remove(id);
      toast.success(data.message);
    } catch (error) {
      get()._recompute(prevRaw, get().searchQuery); // rollback
      toast.error(error.response?.data?.message || 'Failed to remove item.');
    }
  },

  // ── Bulk delete ───────────────────────────────────────────
  bulkDelete: async (ids) => {
    set({ isSubmitting: true });
    const prevRaw = get()._rawInventory;
    const idSet = new Set(ids);
    const newRaw = prevRaw.filter((i) => !idSet.has(i._id));
    get()._recompute(newRaw, get().searchQuery);
    try {
      const { data } = await inventoryApi.bulkRemove(ids);
      toast.success(data.message);
      return { success: true };
    } catch (error) {
      get()._recompute(prevRaw, get().searchQuery); // rollback
      toast.error(error.response?.data?.message || 'Failed to remove items.');
      return { success: false };
    } finally {
      set({ isSubmitting: false });
    }
  },

  // ── Search (client-side, instant) ─────────────────────────
  setSearch: (q) => {
    set({ searchQuery: q });
    get()._recompute(get()._rawInventory, q);
  },
}));
