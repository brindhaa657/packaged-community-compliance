const mongoose = require('mongoose');

const inspectionImageSchema = new mongoose.Schema(
  {
    inspection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection',
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    processedUrl: {
      type: String,
    },
    imageType: {
      type: String,
      enum: [
        'FRONT',
        'BACK',
        'SIDE',
        'TOP',
        'BOTTOM',
        'MRP_CLOSEUP',
        'BARCODE_MRP_PANEL',
        'NUTRITION_PANEL',
        'OTHER',
      ],
      default: 'FRONT',
    },
    originalName: String,
    mimeType: String,
    sizeBytes: Number,
    width: Number,
    height: Number,
    preprocessingStatus: {
      type: String,
      default: 'ORIGINAL_PRESERVED',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InspectionImage', inspectionImageSchema);
