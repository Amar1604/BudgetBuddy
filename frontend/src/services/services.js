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
  getMonthlyFinancial: (params) => api.get('/reports/monthly-financial/', { params }),
  getExpenseReport: (params) => api.get('/reports/expenses/', { params }),
  getSavingsReport: () => api.get('/reports/savings/'),
  getCombinedSummary: (params) => api.get('/reports/combined-summary/', { params }),
  exportExpenseCSV: (params) => api.get('/reports/expenses/', { params: { ...params, export: 'csv' }, responseType: 'blob' }),
  exportCombinedCSV: (params) => api.get('/reports/combined-summary/', { params: { ...params, export: 'csv' }, responseType: 'blob' }),
};

export const profileAPI = {
  get: () => api.get('/profile/'),
  update: (data) => api.patch('/profile/me/', data, {
    headers: { 'Content-Type': undefined }
  }),
  changePassword: (data) => api.post('/auth/change-password/', data),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
};

export const analyticsAPI = {
  getFinancialSummary: (params) => api.get('/analytics/financial-summary/', { params }),
  getCategoryExpenses: (params) => api.get('/analytics/category-expenses/', { params }),
  getMonthlyTrends: (params) => api.get('/analytics/monthly-trends/', { params }),
  getExpenseExtremes: () => api.get('/analytics/expense-extremes/'),
  getDashboard: (params) => api.get('/analytics/dashboard/', { params }),
};


