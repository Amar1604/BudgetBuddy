import api from './axios';

export const incomeAPI = {
  list: () => api.get('/incomes/'),
  create: (data) => api.post('/incomes/', data),
  update: (id, data) => api.patch(`/incomes/${id}/`, data),
  remove: (id) => api.delete(`/incomes/${id}/`),
};

export const expenseAPI = {
  list: () => api.get('/expenses/'),
  create: (data) => api.post('/expenses/', data),
  update: (id, data) => api.patch(`/expenses/${id}/`, data),
  remove: (id) => api.delete(`/expenses/${id}/`),
};

export const budgetAPI = {
  list: () => api.get('/budgets/'),
  create: (data) => api.post('/budgets/', data),
  update: (id, data) => api.patch(`/budgets/${id}/`, data),
  remove: (id) => api.delete(`/budgets/${id}/`),
};

export const savingsAPI = {
  list: () => api.get('/savings-goals/'),
  create: (data) => api.post('/savings-goals/', data),
  update: (id, data) => api.patch(`/savings-goals/${id}/`, data),
  remove: (id) => api.delete(`/savings-goals/${id}/`),
};

export const notificationAPI = {
  list: () => api.get('/notifications/'),
  markRead: (id) => api.patch(`/notifications/${id}/`, { is_read: true }),
  markAllRead: async () => {
    const { data } = await api.get('/notifications/');
    return Promise.all(
      data.filter((n) => !n.is_read).map((n) => api.patch(`/notifications/${n.id}/`, { is_read: true }))
    );
  },
  remove: (id) => api.delete(`/notifications/${id}/`),
};

export const reportAPI = {
  list: () => api.get('/reports/'),
  create: (data) => api.post('/reports/', data),
  remove: (id) => api.delete(`/reports/${id}/`),
};

export const profileAPI = {
  get: () => api.get('/profile/'),
  update: (data) => api.patch('/profile/me/', data),
};
