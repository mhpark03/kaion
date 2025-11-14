import api from '../utils/api';

export const subUnitService = {
  getAll: () => api.get('/sub-units'),
  getByUnit: (unitId) => api.get(`/sub-units/by-unit/${unitId}`),
  getById: (id) => api.get(`/sub-units/${id}`),
  create: (data) => api.post('/sub-units', data),
  update: (id, data) => api.put(`/sub-units/${id}`, data),
  delete: (id) => api.delete(`/sub-units/${id}`),
  reorder: (id, direction) => api.put(`/sub-units/${id}/reorder?direction=${direction}`)
};
