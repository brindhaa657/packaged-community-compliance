import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async seedDemoUsers() {
    const response = await api.post('/auth/seed');
    return response.data;
  },

  async getDemoCredentials() {
    const response = await api.get('/auth/demo-credentials');
    return response.data;
  },

  async getHealthStatus() {
    const response = await api.get('/health');
    return response.data;
  },
};
