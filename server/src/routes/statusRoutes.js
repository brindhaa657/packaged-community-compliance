const express = require('express');
const router = express.Router();
const { isDbConnected } = require('../config/db');

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'LegalMetrix - AI-Assisted Legal Metrology Compliance Checking System',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: isDbConnected() ? 'Connected' : 'Offline / Standalone Mode',
    complianceRulesEngine: 'Ready (Legal Metrology Rules 2011 standard)',
    ocrProvider: process.env.OCR_PROVIDER || 'mock',
  });
});

module.exports = router;
