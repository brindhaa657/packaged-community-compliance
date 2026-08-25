const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema(
  {
    inspectionId: {
      type: String,
      unique: true,
      required: true,
      default: () => `INSP-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    },
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productDetailsSnapshot: {
      productName: String,
      brand: String,
      category: String,
      manufacturer: String,
    },
    location: {
      storeName: { type: String, trim: true, default: 'Retail Store' },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
      inspectionType: {
        type: String,
        enum: ['RETAIL_STORE', 'SUPERMARKET', 'WAREHOUSE', 'E_COMMERCE', 'MARKET_SURVEILLANCE'],
        default: 'RETAIL_STORE',
      },
    },
    inspectionDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'IMAGE_CAPTURED',
        'PROCESSING',
        'PENDING_OFFICER_REVIEW',
        'EXTRACTION_CONFIRMED',
        'REVIEW_REQUIRED',
        'IMAGE_UPLOADED',
        'ANALYZING',
        'SUPERVISOR_REVIEW',
        'COMPLETED',
        'DISMISSED',
      ],
      default: 'IMAGE_CAPTURED',
    },
    currentExtractionVersion: {
      type: Number,
      default: 1,
    },
    extractionStatus: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'CONFIRMED', 'FAILED'],
      default: 'NOT_STARTED',
    },
    ocrSummary: {
      totalImagesProcessed: { type: Number, default: 0 },
      ocrConfidenceAverage: { type: Number, default: 0 },
      processedAt: Date,
    },
    overallResult: {
      type: String,
      enum: ['PASS', 'POTENTIAL_NON_COMPLIANCE', 'REQUIRES_MANUAL_VERIFICATION', 'PENDING_SCREENING', 'COMPLIANT'],
      default: 'PENDING_SCREENING',
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    screeningSummary: {
      totalRulesChecked: { type: Number, default: 0 },
      passed: { type: Number, default: 0 },
      potentialIssues: { type: Number, default: 0 },
      warnings: { type: Number, default: 0 },
      requiresReview: { type: Number, default: 0 },
      notApplicable: { type: Number, default: 0 },
      overallScreening: {
        type: String,
        enum: ['PASS', 'POTENTIAL_NON_COMPLIANCE', 'REQUIRES_MANUAL_VERIFICATION', 'PENDING'],
        default: 'PENDING',
      },
    },
    screeningDate: Date,
    screenedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    declarationsData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    remarks: {
      type: String,
      trim: true,
    },
    officerSignature: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      notes: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Inspection', inspectionSchema);
