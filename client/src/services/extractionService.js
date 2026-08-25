import api from './api';

export const extractionService = {
  /**
   * Process a Scan Session (Preprocessing -> OCR -> AI Extraction)
   */
  async processScanSession(inspectionId, options = {}) {
    const response = await api.post(`/inspections/${inspectionId}/process`, { options });
    return response.data;
  },

  /**
   * Fetch raw OCR results & bounding boxes for an inspection
   */
  async getOCRResults(inspectionId) {
    const response = await api.get(`/inspections/${inspectionId}/ocr`);
    return response.data;
  },

  /**
   * Fetch structured declarations for an inspection (by version)
   */
  async getDeclarations(inspectionId, version = null) {
    const url = version ? `/inspections/${inspectionId}/declarations?version=${version}` : `/inspections/${inspectionId}/declarations`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Officer updates / corrects a single declaration field
   */
  async updateDeclaration(declarationId, data) {
    const response = await api.patch(`/declarations/${declarationId}`, data);
    return response.data;
  },

  /**
   * Confirm and finalize extracted declarations
   */
  async confirmExtraction(inspectionId, confirmedDeclarations = null) {
    const response = await api.post(`/inspections/${inspectionId}/confirm-extraction`, { confirmedDeclarations });
    return response.data;
  },

  /**
   * Trigger re-scan on an existing inspection session
   */
  async triggerRescan(inspectionId, reason = '') {
    const response = await api.post(`/inspections/${inspectionId}/rescan`, { reason });
    return response.data;
  },

  /**
   * Load sample test packaged commodity with sample images
   */
  async loadSamplePackage() {
    const response = await api.post('/inspections/sample-package');
    return response.data;
  },
};
