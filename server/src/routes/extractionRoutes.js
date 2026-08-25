const express = require('express');
const router = express.Router();

const {
  processScanSession,
  getOCRResults,
  getDeclarations,
  updateDeclarationField,
  confirmExtraction,
  triggerRescan,
  loadSamplePackage,
} = require('../controllers/extractionController');

const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// All extraction routes require JWT authentication
router.use(protect);

// Sample package test workflow
router.post('/inspections/sample-package', authorize('OFFICER', 'ADMIN'), loadSamplePackage);

// Process Scan Session (Preprocessing -> OCR -> AI Extraction)
router.post('/inspections/:id/process', authorize('OFFICER', 'ADMIN'), processScanSession);
router.post('/scans/:id/process', authorize('OFFICER', 'ADMIN'), processScanSession);

// Get OCR results & bounding boxes
router.get('/inspections/:id/ocr', getOCRResults);
router.get('/scans/:id/ocr', getOCRResults);

// Get extracted declarations
router.get('/inspections/:id/declarations', getDeclarations);
router.get('/scans/:id/declarations', getDeclarations);

// Officer correction for a declaration field
router.patch('/declarations/:id', authorize('OFFICER', 'SUPERVISOR', 'ADMIN'), updateDeclarationField);

// Re-scan workflow on existing session
router.post('/inspections/:id/rescan', authorize('OFFICER', 'ADMIN'), triggerRescan);
router.post('/scans/:id/rescan', authorize('OFFICER', 'ADMIN'), triggerRescan);

// Confirm verified declarations
router.post('/inspections/:id/confirm-extraction', authorize('OFFICER', 'ADMIN'), confirmExtraction);
router.post('/scans/:id/confirm-extraction', authorize('OFFICER', 'ADMIN'), confirmExtraction);

module.exports = router;
