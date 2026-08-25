const mongoose = require('mongoose');

const ocrResultSchema = new mongoose.Schema(
  {
    inspection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection',
      required: true,
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InspectionImage',
    },
    sourceImageId: {
      type: String,
    },
    rawText: {
      type: String,
      default: '',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    blocks: [
      {
        text: String,
        confidence: Number,
        boundingBox: {
          x: Number,
          y: Number,
          width: Number,
          height: Number,
        },
      },
    ],
    provider: {
      type: String,
      default: 'Mock-OCR-Engine-v2011 [MOCK / TEST DATA]',
    },
    processingStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'COMPLETED',
    },
    extractionVersion: {
      type: Number,
      default: 1,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('OCRResult', ocrResultSchema);
