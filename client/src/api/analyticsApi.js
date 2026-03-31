import api from './axiosInstance';

export const analyticsApi = {
  getStats:    () => api.get('/analytics/stats'),
  getActivity: () => api.get('/analytics/activity'),
};