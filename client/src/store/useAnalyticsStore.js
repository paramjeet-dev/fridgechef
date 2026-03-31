import { create } from 'zustand';
import { analyticsApi } from '../api/analyticsApi';
import toast from 'react-hot-toast';

export const useAnalyticsStore = create((set) => ({
  stats:      null,
  activity:   [],
  isLoading:  false,
  isLoadingActivity: false,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const { data } = await analyticsApi.getStats();
      set({ stats: data.stats });
    } catch {
      toast.error('Failed to load stats.');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchActivity: async () => {
    set({ isLoadingActivity: true });
    try {
      const { data } = await analyticsApi.getActivity();
      set({ activity: data.events });
    } catch {
      // silent — activity is non-critical
    } finally {
      set({ isLoadingActivity: false });
    }
  },
}));