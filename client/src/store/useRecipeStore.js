import { create } from 'zustand';
import api from '../api/axiosInstance';
import { getDifficulty } from '../utils/difficultyScorer';
import toast from 'react-hot-toast';

const DEFAULT_FILTERS = {
  cuisine: '',
  diet: '',
  maxReadyTime: null,
  difficulty: null,   // 'easy' | 'medium' | 'hard' | null
};

export const useRecipeStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────
  recipes: [],
  filteredRecipes: [],   // After client-side difficulty filter
  currentRecipe: null,
  similarRecipes: [],
  currentPage: 1,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  isLoadingDetail: false,
  filters: DEFAULT_FILTERS,
  lastIngredients: [],

  // ── Difficulty filter (client-side after fetch) ───────────
  _applyDifficultyFilter: (recipes, difficulty) => {
    if (!difficulty) return recipes;
    return recipes.filter((r) => getDifficulty(r) === difficulty);
  },

  // ── Search ────────────────────────────────────────────────
  searchRecipes: async (ingredientNames) => {
    if (!ingredientNames?.length) return;
    set({ isLoading: true, recipes: [], filteredRecipes: [], currentPage: 1, hasMore: true, lastIngredients: ingredientNames });

    try {
      const { filters } = get();
      const { data } = await api.get('/recipes', {
        params: {
          ingredients: ingredientNames.join(','),
          page: 1,
          ...(filters.cuisine && { cuisine: filters.cuisine }),
          ...(filters.diet && { diet: filters.diet }),
          ...(filters.maxReadyTime && { maxReadyTime: filters.maxReadyTime }),
        },
      });
      const filtered = get()._applyDifficultyFilter(data.recipes, filters.difficulty);
      set({ recipes: data.recipes, filteredRecipes: filtered, hasMore: data.pagination?.hasMore ?? false, currentPage: 1 });
    } catch {
      toast.error('Failed to load recipes. Please try again.');
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Load more ─────────────────────────────────────────────
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
          ...(filters.cuisine && { cuisine: filters.cuisine }),
          ...(filters.diet && { diet: filters.diet }),
          ...(filters.maxReadyTime && { maxReadyTime: filters.maxReadyTime }),
        },
      });
      const newFiltered = get()._applyDifficultyFilter(data.recipes, filters.difficulty);
      set((state) => ({
        recipes: [...state.recipes, ...data.recipes],
        filteredRecipes: [...state.filteredRecipes, ...newFiltered],
        hasMore: data.pagination?.hasMore ?? false,
        currentPage: nextPage,
      }));
    } catch {
      toast.error('Failed to load more recipes.');
    } finally {
      set({ isLoadingMore: false });
    }
  },

  // ── Detail ────────────────────────────────────────────────
  fetchRecipeDetail: async (spoonacularId) => {
    set({ isLoadingDetail: true, currentRecipe: null });
    try {
      const { data } = await api.get(`/recipes/${spoonacularId}`);
      set({ currentRecipe: data.recipe });
    } catch {
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
      set({ similarRecipes: [] });
    }
  },

  // ── Filters ───────────────────────────────────────────────
  setFilters: (newFilters) => {
    const merged = { ...get().filters, ...newFilters };
    set({ filters: merged });

    // Difficulty is client-side only — re-filter without re-fetching
    if ('difficulty' in newFilters) {
      const filtered = get()._applyDifficultyFilter(get().recipes, merged.difficulty);
      set({ filteredRecipes: filtered });
      return;
    }
    // Other filters require a server re-fetch
    const { lastIngredients } = get();
    if (lastIngredients.length) get().searchRecipes(lastIngredients);
  },

  resetFilters: () => {
    set({ filters: DEFAULT_FILTERS });
    const { lastIngredients, recipes } = get();
    set({ filteredRecipes: recipes });
    if (lastIngredients.length) get().searchRecipes(lastIngredients);
  },

  clearRecipes: () => set({
    recipes: [], filteredRecipes: [], currentRecipe: null,
    similarRecipes: [], currentPage: 1, hasMore: true, lastIngredients: [],
  }),
}));