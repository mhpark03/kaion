import api from '../utils/api';

export const questionService = {
  getAll: (params) => api.get('/questions', { params }),
  getById: (id) => api.get(`/questions/${id}`),
  create: (data) => api.post('/questions', data),
  createWithImage: (formData) => api.post('/questions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  update: (id, data) => api.put(`/questions/${id}`, data),
  updateWithImage: (id, formData) => api.put(`/questions/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  delete: (id) => api.delete(`/questions/${id}`)
};
