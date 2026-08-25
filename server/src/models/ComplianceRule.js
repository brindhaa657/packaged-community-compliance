const mongoose = require('mongoose');

const complianceRuleSchema = new mongoose.Schema(
  {
    ruleId: {
      type: String,
      required: [true, 'Rule ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Rule title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Rule description is required'],
    },
    category: {
      type: String,
      default: 'All', // 'All', 'Food', 'Beverages', 'Cosmetics', 'Household Products', 'Personal Care', 'Packaged Goods', 'Other'
    },
    requiredField: {
      type: String,
      required: [true, 'Target field is required'],
      trim: true,
    },
    validationType: {
      type: String,
      enum: [
        'REQUIRED',
        'OPTIONAL',
        'FORMAT',
        'RANGE',
        'TEXT_PRESENT',
        'DATE_FORMAT',
        'CURRENCY_FORMAT',
        'QUANTITY_FORMAT',
        'MANUAL_REVIEW',
        'PRESENCE_CHECK',
        'UNIT_VERIFICATION',
        'REGEX_PATTERN',
      ],
      default: 'REQUIRED',
    },
    validationParameters: {
      regex: String,
      expectedUnits: [String],
      minValue: Number,
      maxValue: Number,
      requiredSubfields: [String],
      customLogicKey: String,
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'],
      default: 'HIGH',
    },
    legalReference: {
      type: String,
      default: 'Rule 6 of Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    active: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    applicableFrom: {
      type: Date,
      default: Date.now,
    },
    applicableTo: {
      type: Date,
    },
    confidenceThreshold: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.80, // Configurable software threshold
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ComplianceRule', complianceRuleSchema);
