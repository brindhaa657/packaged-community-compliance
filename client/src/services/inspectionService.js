import api from './api';

export const inspectionService = {
  async createInspection(data) {
    const response = await api.post('/inspections', data);
    return response.data;
  },

  async uploadImages(inspectionId, files, imageType = 'FRONT') {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach((file) => formData.append('images', file));
    } else {
      formData.append('images', files);
    }
    formData.append('imageType', imageType);

    const response = await api.post(`/inspections/${inspectionId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async runAnalysis(inspectionId, options = {}) {
    const response = await api.post(`/inspections/${inspectionId}/analyze`, options);
    return response.data;
  },

  async getInspectionById(id) {
    const response = await api.get(`/inspections/${id}`);
    return response.data;
  },

  async getInspections() {
    const response = await api.get('/inspections');
    return response.data;
  },

  async verifyFinding(inspectionId, findingId, status, officerComment) {
    const response = await api.patch(`/inspections/${inspectionId}/findings/${findingId}`, {
      status,
      officerComment,
    });
    return response.data;
  },

  async finalizeInspection(inspectionId, finalResult, remarks, officerNotes) {
    const response = await api.post(`/inspections/${inspectionId}/finalize`, {
      finalResult,
      remarks,
      officerNotes,
    });
    return response.data;
  },

  async getReport(inspectionId) {
    const response = await api.get(`/inspections/${inspectionId}/report`);
    return response.data;
  },
};
