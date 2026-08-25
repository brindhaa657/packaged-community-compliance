const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    inspection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection',
      required: true,
    },
    reportNumber: {
      type: String,
      unique: true,
      default: () => `REP-LM-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    reportType: {
      type: String,
      enum: ['PRELIMINARY_SCREENING', 'OFFICIAL_ENFORCEMENT_NOTICE', 'DETAILED_AUDIT', 'SUPERVISOR_SUMMARY'],
      default: 'PRELIMINARY_SCREENING',
    },
    format: {
      type: String,
      enum: ['PDF', 'JSON', 'HTML', 'DOCX'],
      default: 'PDF',
    },
    filePath: {
      type: String,
    },
    status: {
      type: String,
      enum: ['GENERATED', 'ARCHIVED', 'SIGNED'],
      default: 'GENERATED',
    },
    summary: {
      totalDeclarationsChecked: Number,
      passedDeclarations: Number,
      potentialViolations: Number,
      requiresManualReview: Number,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Report', reportSchema);
