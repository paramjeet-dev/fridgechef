import { create } from 'zustand';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Snack removed ──────────────────────────────────────────────
export const MEAL_TYPES  = ['breakfast', 'lunch', 'dinner'];
export const MEAL_ICONS  = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };
export const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

export const useMealPlanStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────
  mealPlan:     null,
  isLoading:    false,
  isGenerating: false,
  isUpdating:   false,

  // ── Fetch ──────────────────────────────────────────────────
  fetchMealPlan: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/mealplan');
      set({ mealPlan: data.mealPlan });
    } catch {
      set({ mealPlan: null });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Generate ───────────────────────────────────────────────
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

  // ── Add a recipe to a slot ────────────────────────────────
  addRecipeToSlot: async (dayIndex, mealType, spoonacularId) => {
    set({ isUpdating: true });
    const prev = get().mealPlan;
    try {
      const { data } = await api.put('/mealplan/slot', { dayIndex, mealType, spoonacularId });
      set({ mealPlan: data.mealPlan });
    } catch (error) {
      set({ mealPlan: prev });
      toast.error(error.response?.data?.message || 'Failed to update slot.');
    } finally {
      set({ isUpdating: false });
    }
  },

  // ── Add a custom meal ──────────────────────────────────────
  setCustomMeal: async (dayIndex, mealType, customName) => {
    set({ isUpdating: true });
    const prev = get().mealPlan;
    try {
      const { data } = await api.put('/mealplan/slot', { dayIndex, mealType, customName });
      set({ mealPlan: data.mealPlan });
      toast.success('Custom meal added.');
    } catch (error) {
      set({ mealPlan: prev });
      toast.error(error.response?.data?.message || 'Failed to add meal.');
    } finally {
      set({ isUpdating: false });
    }
  },

  // ── Remove a slot ─────────────────────────────────────────
  removeSlot: async (dayIndex, mealType) => {
    const prev = get().mealPlan;
    // Optimistic update
    set((state) => ({
      mealPlan: {
        ...state.mealPlan,
        days: state.mealPlan.days.map((day) =>
          day.dayIndex === dayIndex
            ? { ...day, meals: { ...day.meals, [mealType]: null } }
            : day
        ),
      },
    }));
    try {
      const { data } = await api.delete('/mealplan/slot', { data: { dayIndex, mealType } });
      set({ mealPlan: data.mealPlan });
    } catch (error) {
      set({ mealPlan: prev });
      toast.error(error.response?.data?.message || 'Failed to remove meal.');
    }
  },

  // ── Toggle cooked ──────────────────────────────────────────
  toggleCooked: async (dayIndex, mealType) => {
    const prev = get().mealPlan;
    set((state) => ({
      mealPlan: {
        ...state.mealPlan,
        days: state.mealPlan.days.map((day) => {
          if (day.dayIndex !== dayIndex) return day;
          const slot = day.meals?.[mealType];
          if (!slot) return day;
          return {
            ...day,
            meals: { ...day.meals, [mealType]: { ...slot, isCooked: !slot.isCooked } },
          };
        }),
      },
    }));
    try {
      await api.patch('/mealplan/slot/cooked', { dayIndex, mealType });
    } catch (error) {
      set({ mealPlan: prev });
      toast.error('Failed to update.');
    }
  },

  // ── Delete entire plan — optimistic: null immediately ─────
  deleteMealPlan: async () => {
    const prev = get().mealPlan;
    // Clear UI immediately so user sees the empty state at once
    set({ mealPlan: null });
    try {
      await api.delete('/mealplan');
      toast.success('Meal plan deleted.');
    } catch (error) {
      // Roll back only if server fails
      set({ mealPlan: prev });
      toast.error(error.response?.data?.message || 'Failed to delete meal plan.');
    }
  },

  // ── Legacy ────────────────────────────────────────────────
  updateMealSlot: async (dayIndex, mealType, recipe) => {
    if (!recipe) return get().removeSlot(dayIndex, mealType);
    return get().addRecipeToSlot(dayIndex, mealType, recipe.spoonacularId);
  },

  clearMealPlan: () => set({ mealPlan: null }),
}));
