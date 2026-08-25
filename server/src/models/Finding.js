const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema(
  {
    inspection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection',
      required: true,
    },
    inspectionId: {
      type: String,
      required: true,
    },
    rule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ComplianceRule',
    },
    ruleId: {
      type: String,
      required: true,
    },
    ruleTitle: {
      type: String,
      required: true,
    },
    ruleCategory: {
      type: String,
      default: 'All',
    },
    ruleVersion: {
      type: Number,
      default: 1,
    },
    legalReference: {
      type: String,
      default: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'],
      default: 'HIGH',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    evidenceImage: {
      type: String,
    },
    evidenceRegion: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
    },
    status: {
      type: String,
      enum: [
        'AI_FLAGGED',
        'OFFICER_CONFIRMED',
        'OFFICER_REJECTED',
        'REQUIRES_MORE_EVIDENCE',
        'POTENTIAL_VIOLATION',
        'COMPLIANT',
      ],
      default: 'AI_FLAGGED',
    },
    officerComment: {
      type: String,
      trim: true,
      default: '',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Finding', findingSchema);
