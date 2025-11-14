import api from '../utils/api';

export const unitService = {
  getAll: () => api.get('/units'),
  getBySubject: (subjectId) => api.get(`/units/by-subject/${subjectId}`),
  getById: (id) => api.get(`/units/${id}`),
  create: (data) => api.post('/units', data),
  update: (id, data) => api.put(`/units/${id}`, data),
  delete: (id) => api.delete(`/units/${id}`)
};
