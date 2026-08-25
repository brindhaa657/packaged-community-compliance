const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
      default: 'System / Enforcement Officer',
    },
    userRole: {
      type: String,
      default: 'OFFICER',
    },
    action: {
      type: String,
      enum: [
        'INSPECTION_PROCESSED',
        'DECLARATION_CORRECTED',
        'EXTRACTION_CONFIRMED',
        'RESCAN_TRIGGERED',
        'SCREENING_STARTED',
        'SCREENING_COMPLETED',
        'FINDING_GENERATED',
        'FINDING_CONFIRMED',
        'FINDING_REJECTED',
        'RULE_MODIFIED',
        'RULE_CREATED',
        'RULE_TOGGLED',
        'OFFICER_CORRECTION',
        'RESCAN_REQUESTED',
      ],
      required: true,
    },
    inspectionId: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
