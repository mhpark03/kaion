import api from '../utils/api';

export const unitService = {
  getAll: () => api.get('/units'),
  getByGrade: (gradeId) => api.get(`/units/by-grade/${gradeId}`),
  getById: (id) => api.get(`/units/${id}`),
  create: (data) => api.post('/units', data),
  update: (id, data) => api.put(`/units/${id}`, data),
  delete: (id) => api.delete(`/units/${id}`)
};
