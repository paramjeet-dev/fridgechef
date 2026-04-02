import { create } from 'zustand';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const useIngredientStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────
  ingredients: [],
  isTogglingId: null,

  // ── Actions ───────────────────────────────────────────────

  setIngredients: (ingredients) => set({ ingredients }),

  /**
   * Optimistic toggle — flips the UI immediately, syncs with server,
   * rolls back on failure.
   */
  toggleAvailability: async (uploadId, ingredientId) => {
    const { ingredients } = get();
    const ingredient = ingredients.find((i) => i.id === ingredientId || i._id === ingredientId);
    if (!ingredient) return;

    const id = ingredient.id || ingredient._id;

    set((state) => ({
      isTogglingId: id,
      ingredients: state.ingredients.map((i) =>
        (i.id === id || i._id === id) ? { ...i, isAvailable: !i.isAvailable } : i
      ),
    }));

    try {
      await api.patch(`/uploads/${uploadId}/ingredients/${id}/toggle`);
    } catch {
      // Roll back
      set((state) => ({
        ingredients: state.ingredients.map((i) =>
          (i.id === id || i._id === id) ? { ...i, isAvailable: ingredient.isAvailable } : i
        ),
      }));
      toast.error('Failed to update ingredient. Please try again.');
    } finally {
      set({ isTogglingId: null });
    }
  },

  clearIngredients: () => set({ ingredients: [] }),
}));
