const mongoose = require('mongoose');

const declarationSchema = new mongoose.Schema(
  {
    inspection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection',
      required: true,
    },
    scanSessionId: {
      type: String,
    },
    fieldName: {
      type: String,
      required: true,
    },
    fieldLabel: {
      type: String,
    },
    legalRule: {
      type: String,
    },
    aiValue: {
      type: String,
      default: null,
    },
    officerValue: {
      type: String,
      default: null,
    },
    extractedValue: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['DETECTED', 'NOT_DETECTED', 'UNCERTAIN', 'OFFICER_CORRECTED', 'CONFIRMED', 'AUTO_EXTRACTED'],
      default: 'DETECTED',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    sourceImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InspectionImage',
    },
    sourceImageId: {
      type: String,
    },
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
    },
    extractionVersion: {
      type: Number,
      default: 1,
    },
    verificationStatus: {
      type: String,
      enum: ['AUTO_EXTRACTED', 'VERIFIED_CORRECT', 'CORRECTED_BY_OFFICER', 'REJECTED_MISSING', 'NOT_APPLICABLE'],
      default: 'AUTO_EXTRACTED',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Declaration', declarationSchema);
