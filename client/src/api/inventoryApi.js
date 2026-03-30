import api from './axiosInstance';

export const inventoryApi = {
  getAll:      (params) => api.get('/inventory', { params }),
  add:         (data)   => api.post('/inventory', data),
  batchAdd:    (items)  => api.post('/inventory/batch', { items }),
  update:      (id, data) => api.patch(`/inventory/${id}`, data),
  remove:      (id)     => api.delete(`/inventory/${id}`),
  bulkRemove:  (ids)    => api.delete('/inventory', { data: { ids } }),
};