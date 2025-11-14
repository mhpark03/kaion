import api from '../utils/api';

export const conceptService = {
  getAll: () => api.get('/concepts'),
  getById: (id) => api.get(`/concepts/${id}`),
  create: (data) => api.post('/concepts', data),
  update: (id, data) => api.put(`/concepts/${id}`, data),
  delete: (id) => api.delete(`/concepts/${id}`),
  reorder: (id, direction) => api.put(`/concepts/${id}/reorder?direction=${direction}`)
};
