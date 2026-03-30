import { create } from 'zustand';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

export const useAuthStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────
  user: null,
  isAuthenticated: false,
  isLoading: false,       // For login/register buttons
  isHydrating: true,      // True until getMe() resolves on app boot

  // ── Actions ───────────────────────────────────────────────

  /**
   * Called once on app mount (in Navbar / App).
   * Attempts to restore session via the existing httpOnly cookie.
   * If the cookie is expired/missing, clears auth silently.
   */
  hydrate: async () => {
    set({ isHydrating: true });
    try {
      const { data } = await authApi.getMe();
      set({ user: data.user, isAuthenticated: true });
    } catch {
      // No valid session — that's fine, user just isn't logged in
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isHydrating: false });
    }
  },

  register: async ({ email, password, displayName }) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.register({ email, password, displayName });
      set({ user: data.user, isAuthenticated: true });
      toast.success(`Welcome, ${data.user.displayName}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      return { success: false, message };
    } finally {
      set({ isLoading: false });
    }
  },

  login: async ({ email, password }) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login({ email, password });
      set({ user: data.user, isAuthenticated: true });
      toast.success(`Welcome back, ${data.user.displayName}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Check your credentials.';
      toast.error(message);
      return { success: false, message };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the server call fails, clear client state
    }
    get().clearAuth();
    toast.success('Logged out.');
  },

  updatePreferences: async (preferences) => {
    try {
      const { data } = await authApi.updatePreferences(preferences);
      set((state) => ({
        user: { ...state.user, preferences: data.preferences },
      }));
      toast.success('Preferences saved.');
    } catch (error) {
      toast.error('Failed to save preferences.');
    }
  },

  // Called by axios interceptor on hard 401 (refresh failed)
  clearAuth: () => set({ user: null, isAuthenticated: false }),
}));
