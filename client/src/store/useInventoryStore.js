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

export const useInventoryStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────
  inventory: [],
  grouped: {},
  total: 0,
  isLoading: false,
  isSubmitting: false,
  searchQuery: '',
  activeCategory: '',   // '' = all

  // ── Fetch ──────────────────────────────────────────────────
  fetchInventory: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await inventoryApi.getAll(params);
      set({
        inventory: data.inventory,
        grouped: data.grouped,
        total: data.total,
      });
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
      await get().fetchInventory();
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add item.');
      return { success: false };
    } finally {
      set({ isSubmitting: false });
    }
  },

  // ── Batch add ─────────────────────────────────────────────
  batchAdd: async (items) => {
    set({ isSubmitting: true });
    try {
      const { data } = await inventoryApi.batchAdd(items);
      toast.success(data.message);
      await get().fetchInventory();
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add items.');
      return { success: false };
    } finally {
      set({ isSubmitting: false });
    }
  },

  // ── Update ────────────────────────────────────────────────
  updateItem: async (id, updates) => {
    // Optimistic update in the flat list
    const prev = get().inventory;
    set({
      inventory: prev.map((item) =>
        item._id === id ? { ...item, ...updates } : item
      ),
    });
    try {
      await inventoryApi.update(id, updates);
    } catch (error) {
      set({ inventory: prev }); // rollback
      toast.error(error.response?.data?.message || 'Failed to update item.');
    }
  },

  // ── Delete one ────────────────────────────────────────────
  deleteItem: async (id) => {
    const prev = get().inventory;
    set({ inventory: prev.filter((i) => i._id !== id) });
    try {
      const { data } = await inventoryApi.remove(id);
      toast.success(data.message);
      // Re-fetch to sync grouped state
      get().fetchInventory();
    } catch (error) {
      set({ inventory: prev }); // rollback
      toast.error(error.response?.data?.message || 'Failed to remove item.');
    }
  },

  // ── Bulk delete ───────────────────────────────────────────
  bulkDelete: async (ids) => {
    set({ isSubmitting: true });
    try {
      const { data } = await inventoryApi.bulkRemove(ids);
      toast.success(data.message);
      await get().fetchInventory();
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove items.');
      return { success: false };
    } finally {
      set({ isSubmitting: false });
    }
  },

  // ── UI filters ────────────────────────────────────────────
  setSearch: (q) => set({ searchQuery: q }),
  setCategory: (cat) => set({ activeCategory: cat }),
}));