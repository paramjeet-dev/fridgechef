import { create } from 'zustand';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const useIngredientStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────
  ingredients: [],
  isTogglingId: null,   // Track which ingredient is being toggled (loading state per card)

  // ── Derived (computed inline, not stored) ─────────────────
  // Usage: const available = useIngredientStore(s => s.availableIngredients())
  availableIngredients: () => get().ingredients.filter((i) => i.isAvailable),
  availableNames: () =>
    get().ingredients
      .filter((i) => i.isAvailable)
      .map((i) => i.name),

  // ── Actions ───────────────────────────────────────────────

  setIngredients: (ingredients) => set({ ingredients }),

  /**
   * Optimistic toggle — flips the UI immediately, syncs with server,
   * rolls back on failure.
   */
  toggleAvailability: async (uploadId, ingredientId) => {
    const { ingredients } = get();
    const ingredient = ingredients.find((i) => i.id === ingredientId);
    if (!ingredient) return;

    // Optimistic update
    set((state) => ({
      isTogglingId: ingredientId,
      ingredients: state.ingredients.map((i) =>
        i.id === ingredientId ? { ...i, isAvailable: !i.isAvailable } : i
      ),
    }));

    try {
      await api.patch(`/uploads/${uploadId}/ingredients/${ingredientId}/toggle`);
    } catch (error) {
      // Roll back
      set((state) => ({
        ingredients: state.ingredients.map((i) =>
          i.id === ingredientId ? { ...i, isAvailable: ingredient.isAvailable } : i
        ),
      }));
      toast.error('Failed to update ingredient. Please try again.');
    } finally {
      set({ isTogglingId: null });
    }
  },

  clearIngredients: () => set({ ingredients: [] }),
}));
