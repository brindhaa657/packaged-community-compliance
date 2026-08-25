import api from './api';

export const complianceService = {
  // Rules Management
  async getRules(params = {}) {
    const response = await api.get('/compliance/rules', { params });
    return response.data;
  },

  async getRuleById(id) {
    const response = await api.get(`/compliance/rules/${id}`);
    return response.data;
  },

  async createRule(ruleData) {
    const response = await api.post('/compliance/rules', ruleData);
    return response.data;
  },

  async updateRule(id, ruleData) {
    const response = await api.put(`/compliance/rules/${id}`, ruleData);
    return response.data;
  },

  async toggleRule(id) {
    const response = await api.patch(`/compliance/rules/${id}/toggle`);
    return response.data;
  },

  // Compliance Screening
  async runScreening(inspectionId, declarationsData = {}) {
    const response = await api.post(`/inspections/${inspectionId}/screen`, {
      declarationsData,
    });
    return response.data;
  },

  async getInspectionCompliance(inspectionId) {
    const response = await api.get(`/inspections/${inspectionId}/compliance`);
    return response.data;
  },

  async getInspectionFindings(inspectionId) {
    const response = await api.get(`/inspections/${inspectionId}/findings`);
    return response.data;
  },

  // Officer Verification Actions
  async verifyFinding(findingId, officerComment = '') {
    const response = await api.patch(`/findings/${findingId}/verify`, {
      officerComment,
    });
    return response.data;
  },

  async rejectFinding(findingId, officerComment = '') {
    const response = await api.patch(`/findings/${findingId}/reject`, {
      officerComment,
    });
    return response.data;
  },

  async requestRescan(inspectionId, findingId = null, reason = '') {
    const response = await api.post(`/inspections/${inspectionId}/request-rescan`, {
      findingId,
      reason,
    });
    return response.data;
  },
};
