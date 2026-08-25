/**
 * Unified In-Memory Store for Standalone / Offline Development & Testing
 */

class InMemoryStore {
  constructor() {
    this.inspections = [];
    this.images = [];
    this.ocrResults = {};
    this.declarations = {};
    this.extractionsHistory = {};
  }

  getInspection(id) {
    return this.inspections.find((i) => i._id === id || i.inspectionId === id);
  }

  saveInspection(inspection) {
    const idx = this.inspections.findIndex(
      (i) => i._id === inspection._id || i.inspectionId === inspection.inspectionId
    );
    if (idx !== -1) {
      this.inspections[idx] = { ...this.inspections[idx], ...inspection };
      return this.inspections[idx];
    }
    this.inspections.unshift(inspection);
    return inspection;
  }

  getImages(inspectionId) {
    return this.images.filter(
      (img) => img.inspection === inspectionId || img.inspectionId === inspectionId
    );
  }

  addImage(img) {
    this.images.push(img);
  }
}

module.exports = new InMemoryStore();
