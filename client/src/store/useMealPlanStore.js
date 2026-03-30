import { create } from 'zustand';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const useMealPlanStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────
  mealPlan: null,
  isLoading: false,
  isGenerating: false,

  // ── Actions ───────────────────────────────────────────────

  fetchMealPlan: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/mealplan');
      set({ mealPlan: data.mealPlan });
    } catch {
      // No plan yet — that's fine
      set({ mealPlan: null });
    } finally {
      set({ isLoading: false });
    }
  },

  generateMealPlan: async ({ targetCalories, diet } = {}) => {
    set({ isGenerating: true });
    try {
      const { data } = await api.post('/mealplan/generate', { targetCalories, diet });
      set({ mealPlan: data.mealPlan });
      toast.success('Meal plan generated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate meal plan.');
    } finally {
      set({ isGenerating: false });
    }
  },

  updateMealSlot: async (dayIndex, mealType, recipe) => {
    const prev = get().mealPlan;

    // Optimistic update
    set((state) => ({
      mealPlan: {
        ...state.mealPlan,
        days: state.mealPlan.days.map((day) =>
          day.dayIndex === dayIndex
            ? { ...day, meals: { ...day.meals, [mealType]: recipe } }
            : day
        ),
      },
    }));

    try {
      await api.put('/mealplan', { dayIndex, mealType, recipeId: recipe?._id ?? null });
    } catch {
      set({ mealPlan: prev }); // Roll back
      toast.error('Failed to update meal plan.');
    }
  },

  clearMealPlan: () => set({ mealPlan: null }),
}));
