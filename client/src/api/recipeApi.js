import api from './axiosInstance';

export const recipeApi = {
  search: (params) => api.get('/recipes', { params }),
  getById: (id) => api.get(`/recipes/${id}`),
  getSimilar: (id) => api.get(`/recipes/${id}/similar`),
};

export const favoriteApi = {
  getAll: () => api.get('/favorites'),
  add: (spoonacularId, notes) => api.post('/favorites', { spoonacularId, notes }),
  remove: (spoonacularId) => api.delete(`/favorites/${spoonacularId}`),
};

export const uploadApi = {
  create: (formData) =>
    api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => api.get('/uploads', { params }),
  getById: (id) => api.get(`/uploads/${id}`),
  delete: (id) => api.delete(`/uploads/${id}`),
  toggleIngredient: (uploadId, ingredientId) =>
    api.patch(`/uploads/${uploadId}/ingredients/${ingredientId}/toggle`),
};
