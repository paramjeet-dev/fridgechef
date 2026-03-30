import { create } from 'zustand';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const DEFAULT_FILTERS = {
  cuisine: '',
  diet: '',
  maxReadyTime: null,
};

export const useRecipeStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────
  recipes: [],
  currentRecipe: null,
  similarRecipes: [],
  currentPage: 1,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  isLoadingDetail: false,
  filters: DEFAULT_FILTERS,
  lastIngredients: [],   // Ingredients used for current search (for re-fetch on filter change)

  // ── Actions ───────────────────────────────────────────────

  /**
   * Initial recipe search — replaces results.
   * Called when user navigates to Results page.
   */
  searchRecipes: async (ingredientNames) => {
    if (!ingredientNames?.length) return;

    set({ isLoading: true, recipes: [], currentPage: 1, hasMore: true, lastIngredients: ingredientNames });

    try {
      const { filters } = get();
      const { data } = await api.get('/recipes', {
        params: {
          ingredients: ingredientNames.join(','),
          page: 1,
          ...filters,
        },
      });

      set({
        recipes: data.recipes,
        hasMore: data.pagination?.hasMore ?? false,
        currentPage: 1,
      });
    } catch (error) {
      toast.error('Failed to load recipes. Please try again.');
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Load next page — appends to existing results (infinite scroll).
   */
  loadMore: async () => {
    const { hasMore, isLoadingMore, currentPage, lastIngredients, filters } = get();
    if (!hasMore || isLoadingMore) return;

    const nextPage = currentPage + 1;
    set({ isLoadingMore: true });

    try {
      const { data } = await api.get('/recipes', {
        params: {
          ingredients: lastIngredients.join(','),
          page: nextPage,
          ...filters,
        },
      });

      set((state) => ({
        recipes: [...state.recipes, ...data.recipes],
        hasMore: data.pagination?.hasMore ?? false,
        currentPage: nextPage,
      }));
    } catch {
      toast.error('Failed to load more recipes.');
    } finally {
      set({ isLoadingMore: false });
    }
  },

  fetchRecipeDetail: async (spoonacularId) => {
    set({ isLoadingDetail: true, currentRecipe: null });
    try {
      const { data } = await api.get(`/recipes/${spoonacularId}`);
      set({ currentRecipe: data.recipe });
    } catch (error) {
      toast.error('Failed to load recipe details.');
    } finally {
      set({ isLoadingDetail: false });
    }
  },

  fetchSimilarRecipes: async (spoonacularId) => {
    try {
      const { data } = await api.get(`/recipes/${spoonacularId}/similar`);
      set({ similarRecipes: data.recipes });
    } catch {
      // Silent fail — similar recipes are non-critical
      set({ similarRecipes: [] });
    }
  },

  setFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } });
    // Re-run search with new filters
    const { lastIngredients } = get();
    if (lastIngredients.length) {
      get().searchRecipes(lastIngredients);
    }
  },

  resetFilters: () => {
    set({ filters: DEFAULT_FILTERS });
    const { lastIngredients } = get();
    if (lastIngredients.length) {
      get().searchRecipes(lastIngredients);
    }
  },

  clearRecipes: () =>
    set({
      recipes: [],
      currentRecipe: null,
      similarRecipes: [],
      currentPage: 1,
      hasMore: true,
      lastIngredients: [],
    }),
}));
