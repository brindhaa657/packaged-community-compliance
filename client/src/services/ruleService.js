import api from './api';

export const ruleService = {
  async getRules() {
    const response = await api.get('/rules');
    return response.data;
  },

  async createRule(ruleData) {
    const response = await api.post('/rules', ruleData);
    return response.data;
  },

  async toggleRule(ruleId) {
    const response = await api.patch(`/rules/${ruleId}/toggle`);
    return response.data;
  },
};
