const mongoose = require('mongoose');

const ruleResultSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['PASS', 'FAIL', 'WARNING', 'NOT_APPLICABLE', 'REQUIRES_REVIEW'],
      required: true,
    },
    observedValue: {
      type: String,
      default: '',
    },
    expectedCondition: {
      type: String,
      default: '',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    evidenceImage: {
      type: String, // URL or ID of image
    },
    evidenceRegion: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RuleResult', ruleResultSchema);
