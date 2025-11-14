import api from '../utils/api';

export const gradeService = {
  getAll: () => api.get('/grades'),
  getByLevel: (levelId) => api.get(`/grades/by-level/${levelId}`),
  getById: (id) => api.get(`/grades/${id}`),
  create: (data) => api.post('/grades', data),
  update: (id, data) => api.put(`/grades/${id}`, data),
  delete: (id) => api.delete(`/grades/${id}`)
};
