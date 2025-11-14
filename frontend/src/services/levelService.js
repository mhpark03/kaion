import api from '../utils/api';

export const levelService = {
  getAll: () => api.get('/levels'),
  getById: (id) => api.get(`/levels/${id}`),
  create: (data) => api.post('/levels', data),
  update: (id, data) => api.put(`/levels/${id}`, data),
  delete: (id) => api.delete(`/levels/${id}`),
  reorder: (id, direction) => api.put(`/levels/${id}/reorder?direction=${direction}`)
};
