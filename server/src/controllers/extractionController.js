const Inspection = require('../models/Inspection');
const InspectionImage = require('../models/InspectionImage');
const OCRResult = require('../models/OCRResult');
const Declaration = require('../models/Declaration');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

const imageProcessingService = require('../services/imageProcessingService');
const ocrService = require('../services/ocrService');
const declarationExtractionService = require('../services/declarationExtractionService');

const { isDbConnected } = require('../config/db');
const { getInspectionQuery, isMongoObjectId } = require('../utils/queryHelper');

const inMemoryStore = require('../utils/inMemoryStore');

// In-Memory Storage for Offline / Standalone Testing
let inMemoryOCRResults = inMemoryStore.ocrResults;
let inMemoryDeclarations = inMemoryStore.declarations;
let inMemoryExtractionsHistory = inMemoryStore.extractionsHistory;

/**
 * @desc    Process a Scan Session (Preprocess -> OCR -> AI Declaration Extraction)
 * @route   POST /api/inspections/:id/process
 * @access  Private (Officer, Admin)
 */
const processScanSession = async (req, res, next) => {
  try {
    const { id: inspectionId } = req.params;
    const { options = {} } = req.body;

    let inspection = null;
    let images = [];

    if (isDbConnected()) {
      inspection = await Inspection.findOne(getInspectionQuery(inspectionId))
        .populate('product')
        .populate('officer');

      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: `Inspection session not found for ID: ${inspectionId}`,
        });
      }

      images = await InspectionImage.find({ inspection: inspection._id }).sort({ uploadedAt: 1 });
    } else {
      // In-memory fallback
      inspection = inMemoryStore.getInspection(inspectionId) || {
        _id: inspectionId,
        inspectionId: inspectionId.startsWith('INSP-') ? inspectionId : `INSP-${Date.now().toString(36).toUpperCase()}`,
        status: 'IMAGE_CAPTURED',
        currentExtractionVersion: 1,
        productDetailsSnapshot: {
          productName: 'Premium Basmati Rice',
          brand: 'ABC Foods',
          category: 'Food',
        },
      };

      // Retrieve uploaded images for this session
      const memImages = inMemoryStore.getImages(inspection._id) || inMemoryStore.getImages(inspection.inspectionId) || [];
      if (memImages.length > 0) {
        images = memImages;
      } else if (inspection.images && inspection.images.length > 0) {
        images = inspection.images;
      } else {
        images = [
          {
            _id: 'img-front-01',
            inspection: inspectionId,
            imageUrl: '/uploads/sample-rice-front.jpg',
            imageType: 'FRONT',
            originalName: 'rice-front-panel.jpg',
          },
          {
            _id: 'img-back-02',
            inspection: inspectionId,
            imageUrl: '/uploads/sample-rice-back.jpg',
            imageType: 'BACK',
            originalName: 'rice-back-declarations.jpg',
          },
          {
            _id: 'img-mrp-03',
            inspection: inspectionId,
            imageUrl: '/uploads/sample-rice-mrp.jpg',
            imageType: 'MRP_CLOSEUP',
            originalName: 'rice-mrp-closeup.jpg',
          },
        ];
      }
    }

    if (!images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No packaging images found in this scan session. Please capture package images first.',
      });
    }

    // Determine extraction version
    const nextVersion = (inspection.currentExtractionVersion || 0) + 1;

    // STEP 1: Image Preprocessing
    const preprocessedImages = await imageProcessingService.preprocessImages(images);

    // STEP 2: OCR Service across all images in session
    const productContext = {
      productName: inspection.product?.productName || inspection.productDetailsSnapshot?.productName || 'Premium Basmati Rice',
      brand: inspection.product?.brand || inspection.productDetailsSnapshot?.brand || 'ABC Foods',
      manufacturer: inspection.product?.manufacturer || inspection.productDetailsSnapshot?.manufacturer,
      isImported: Boolean(options.isImported),
    };

    const ocrOutputs = await ocrService.processImages(preprocessedImages, productContext);

    // STEP 3: AI Structured Declaration Extraction
    const extractedDeclarationsMap = await declarationExtractionService.extractDeclarations(ocrOutputs, productContext);

    // Format declarations into records
    const declarationRecords = [];
    Object.entries(extractedDeclarationsMap).forEach(([fieldName, fieldData]) => {
      declarationRecords.push({
        inspectionId: inspection.inspectionId || inspectionId,
        scanSessionId: inspection.inspectionId || inspectionId,
        fieldName,
        fieldLabel: fieldData.fieldLabel || fieldName,
        legalRule: fieldData.legalRule || '',
        aiValue: fieldData.value,
        officerValue: null,
        extractedValue: fieldData.value || '',
        status: fieldData.status,
        confidence: Math.round((fieldData.confidence || 0) * 100),
        sourceImageId: fieldData.sourceImageId,
        boundingBox: fieldData.boundingBox,
        extractionVersion: nextVersion,
        verificationStatus: fieldData.status === 'DETECTED' ? 'AUTO_EXTRACTED' : 'REJECTED_MISSING',
      });
    });

    // STEP 4: Persist in DB or In-Memory
    if (isDbConnected()) {
      // Save OCR Results
      for (const ocr of ocrOutputs) {
        await OCRResult.create({
          inspection: inspection._id,
          sourceImageId: ocr.sourceImageId,
          rawText: ocr.rawText,
          confidence: Math.round((ocr.confidence || 0) * 100),
          blocks: ocr.blocks,
          provider: ocr.provider,
          processingStatus: ocr.processingStatus,
          extractionVersion: nextVersion,
        });
      }

      // Save Declarations
      for (const decl of declarationRecords) {
        await Declaration.create({
          inspection: inspection._id,
          scanSessionId: inspection.inspectionId,
          fieldName: decl.fieldName,
          fieldLabel: decl.fieldLabel,
          legalRule: decl.legalRule,
          aiValue: decl.aiValue,
          officerValue: decl.officerValue,
          extractedValue: decl.extractedValue,
          status: decl.status,
          confidence: decl.confidence,
          sourceImageId: decl.sourceImageId,
          boundingBox: decl.boundingBox,
          extractionVersion: nextVersion,
          verificationStatus: decl.verificationStatus,
        });
      }

      // Update Inspection record
      inspection.status = 'PENDING_OFFICER_REVIEW';
      inspection.currentExtractionVersion = nextVersion;
      inspection.extractionStatus = 'PENDING_REVIEW';
      inspection.ocrSummary = {
        totalImagesProcessed: ocrOutputs.length,
        ocrConfidenceAverage: Math.round(
          ocrOutputs.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / (ocrOutputs.length || 1) * 100
        ),
        processedAt: new Date(),
      };
      inspection.declarationsData = extractedDeclarationsMap;
      await inspection.save();

      // Audit Log
      await AuditLog.create({
        user: req.user?._id,
        userName: req.user?.name || 'Enforcement Officer',
        userRole: req.user?.role || 'OFFICER',
        action: 'INSPECTION_PROCESSED',
        inspectionId: inspection.inspectionId,
        details: {
          extractionVersion: nextVersion,
          imagesProcessed: ocrOutputs.length,
          fieldsExtracted: Object.keys(extractedDeclarationsMap).length,
        },
      });
    } else {
      // In-memory caching
      inMemoryOCRResults[inspectionId] = ocrOutputs;
      inMemoryDeclarations[inspectionId] = declarationRecords;
      if (!inMemoryExtractionsHistory[inspectionId]) {
        inMemoryExtractionsHistory[inspectionId] = {};
      }
      inMemoryExtractionsHistory[inspectionId][`v${nextVersion}`] = declarationRecords;

      inspection.status = 'PENDING_OFFICER_REVIEW';
      inspection.currentExtractionVersion = nextVersion;
      inspection.declarationsData = extractedDeclarationsMap;
    }

    return res.status(200).json({
      success: true,
      message: `Product processing completed successfully (Extraction Version: ${nextVersion}). Ready for officer review.`,
      data: {
        inspectionId: inspection.inspectionId || inspectionId,
        extractionVersion: nextVersion,
        status: 'PENDING_OFFICER_REVIEW',
        declarations: extractedDeclarationsMap,
        declarationList: declarationRecords,
        ocrResults: ocrOutputs,
        images: preprocessedImages,
      },
    });
  } catch (error) {
    console.error('Process scan session error:', error);
    next(error);
  }
};

/**
 * @desc    Get OCR raw text and bounding boxes for an inspection
 * @route   GET /api/inspections/:id/ocr
 * @access  Private
 */
const getOCRResults = async (req, res, next) => {
  try {
    const { id: inspectionId } = req.params;

    if (isDbConnected()) {
      const inspection = await Inspection.findOne(getInspectionQuery(inspectionId));
      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      const ocrResults = await OCRResult.find({ inspection: inspection._id })
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: ocrResults.length,
        data: ocrResults,
      });
    }

    const memOcr = inMemoryOCRResults[inspectionId] || [];
    return res.status(200).json({
      success: true,
      count: memOcr.length,
      data: memOcr,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get extracted declarations for an inspection
 * @route   GET /api/inspections/:id/declarations
 * @access  Private
 */
const getDeclarations = async (req, res, next) => {
  try {
    const { id: inspectionId } = req.params;
    const { version } = req.query;

    if (isDbConnected()) {
      const inspection = await Inspection.findOne(getInspectionQuery(inspectionId));
      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      const targetVersion = version ? parseInt(version, 10) : inspection.currentExtractionVersion || 1;
      const declarations = await Declaration.find({
        inspection: inspection._id,
        extractionVersion: targetVersion,
      });

      return res.status(200).json({
        success: true,
        inspectionId: inspection.inspectionId,
        currentVersion: inspection.currentExtractionVersion || 1,
        requestedVersion: targetVersion,
        count: declarations.length,
        data: declarations,
      });
    }

    const memDecls = inMemoryDeclarations[inspectionId] || [];
    return res.status(200).json({
      success: true,
      inspectionId,
      currentVersion: 1,
      count: memDecls.length,
      data: memDecls,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Officer edits / corrects an extracted declaration field
 * @route   PATCH /api/declarations/:id
 * @access  Private (Officer, Admin)
 */
const updateDeclarationField = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { officerValue, remarks, fieldName } = req.body;

    if (officerValue === undefined || officerValue === null) {
      return res.status(400).json({
        success: false,
        message: 'Officer value is required for field correction.',
      });
    }

    if (isDbConnected()) {
      let declaration = null;
      if (isMongoObjectId(id)) {
        declaration = await Declaration.findById(id);
      } else {
        declaration = await Declaration.findOne({
          $or: [{ _id: id }, { fieldName: id }, { fieldName: fieldName }],
        }).sort({ createdAt: -1 });
      }

      if (!declaration) {
        return res.status(404).json({
          success: false,
          message: 'Declaration record not found for modification.',
        });
      }

      // Preserve original AI extraction, store officer correction
      declaration.officerValue = String(officerValue).trim();
      declaration.status = 'OFFICER_CORRECTED';
      declaration.verificationStatus = 'CORRECTED_BY_OFFICER';
      await declaration.save();

      // Update snapshot in Inspection if available
      const inspection = await Inspection.findById(declaration.inspection);
      if (inspection && inspection.declarationsData && inspection.declarationsData[declaration.fieldName]) {
        inspection.declarationsData[declaration.fieldName].officerValue = declaration.officerValue;
        inspection.declarationsData[declaration.fieldName].status = 'OFFICER_CORRECTED';
        inspection.markModified('declarationsData');
        await inspection.save();
      }

      // Log correction in audit
      await AuditLog.create({
        user: req.user?._id,
        userName: req.user?.name || 'Enforcement Officer',
        userRole: req.user?.role || 'OFFICER',
        action: 'DECLARATION_CORRECTED',
        inspectionId: inspection?.inspectionId || declaration.scanSessionId,
        details: {
          fieldName: declaration.fieldName,
          aiValue: declaration.aiValue,
          officerValue: declaration.officerValue,
          status: 'OFFICER_CORRECTED',
        },
      });

      return res.status(200).json({
        success: true,
        message: `Declaration for ${declaration.fieldName} updated by Officer.`,
        data: declaration,
      });
    }

    // In-memory update
    return res.status(200).json({
      success: true,
      message: 'Declaration updated by Officer (In-Memory).',
      data: {
        _id: id,
        officerValue,
        status: 'OFFICER_CORRECTED',
        verificationStatus: 'CORRECTED_BY_OFFICER',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm and finalize declaration extraction
 * @route   POST /api/inspections/:id/confirm-extraction
 * @access  Private (Officer, Admin)
 */
const confirmExtraction = async (req, res, next) => {
  try {
    const { id: inspectionId } = req.params;
    const { confirmedDeclarations } = req.body;

    if (isDbConnected()) {
      const inspection = await Inspection.findOne(getInspectionQuery(inspectionId));
      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      inspection.status = 'EXTRACTION_CONFIRMED';
      inspection.extractionStatus = 'CONFIRMED';
      if (confirmedDeclarations) {
        inspection.declarationsData = confirmedDeclarations;
      }
      await inspection.save();

      await AuditLog.create({
        user: req.user?._id,
        userName: req.user?.name || 'Enforcement Officer',
        userRole: req.user?.role || 'OFFICER',
        action: 'EXTRACTION_CONFIRMED',
        inspectionId: inspection.inspectionId,
        details: { confirmedAt: new Date() },
      });

      return res.status(200).json({
        success: true,
        message: 'Product declarations confirmed by Officer. Ready for Compliance Screening.',
        data: inspection,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Extraction confirmed (In-Memory).',
      inspectionId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger a re-scan on an existing inspection session
 * @route   POST /api/inspections/:id/rescan
 * @access  Private (Officer, Admin)
 */
const triggerRescan = async (req, res, next) => {
  try {
    const { id: inspectionId } = req.params;
    const { reason = 'Officer requested additional packaging imagery' } = req.body;

    if (isDbConnected()) {
      const inspection = await Inspection.findOne(getInspectionQuery(inspectionId));
      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      inspection.status = 'IMAGE_CAPTURED'; // Return to image capture state
      await inspection.save();

      await AuditLog.create({
        user: req.user?._id,
        userName: req.user?.name || 'Enforcement Officer',
        userRole: req.user?.role || 'OFFICER',
        action: 'RESCAN_TRIGGERED',
        inspectionId: inspection.inspectionId,
        details: { reason },
      });

      return res.status(200).json({
        success: true,
        message: 'Re-scan initiated on the same inspection session. You can now capture additional panels.',
        inspectionId: inspection.inspectionId,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Re-scan initiated (In-Memory).',
      inspectionId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Quick Test Workflow: Load Sample Packaged Commodity with Test Data
 * @route   POST /api/inspections/sample-package
 * @access  Private (Officer, Admin)
 */
const loadSamplePackage = async (req, res, next) => {
  try {
    const officerId = req.user?._id || '66c8b0010000000000000002';
    const inspectionId = `INSP-TEST-${Date.now().toString(36).toUpperCase()}`;

    const sampleProductData = {
      productName: 'Premium Basmati Rice (1 kg)',
      brand: 'ABC Foods [TEST DATA]',
      category: 'Food',
      manufacturer: 'ABC Foods Pvt Ltd, Plot No. 45, Guindy, Chennai, Tamil Nadu - 600032 [TEST DATA]',
      identifiers: { barcode: '8901030889214' },
    };

    if (isDbConnected()) {
      const product = await Product.create(sampleProductData);
      const inspection = await Inspection.create({
        inspectionId,
        officer: officerId,
        product: product._id,
        productDetailsSnapshot: sampleProductData,
        location: {
          storeName: 'State Central Supermarket [TEST LOCATION]',
          city: 'Chennai',
          state: 'Tamil Nadu',
          inspectionType: 'SUPERMARKET',
        },
        status: 'IMAGE_CAPTURED',
        remarks: 'Sample packaged commodity loaded for Phase 3 OCR + AI extraction testing.',
      });

      // Attach sample panel images
      const sampleImages = [
        {
          inspection: inspection._id,
          imageUrl: '/uploads/sample-rice-front.jpg',
          imageType: 'FRONT',
          originalName: 'premium-rice-front-panel.jpg',
          sizeBytes: 2150000,
        },
        {
          inspection: inspection._id,
          imageUrl: '/uploads/sample-rice-back.jpg',
          imageType: 'BACK',
          originalName: 'premium-rice-back-declarations.jpg',
          sizeBytes: 2850000,
        },
        {
          inspection: inspection._id,
          imageUrl: '/uploads/sample-rice-mrp.jpg',
          imageType: 'MRP_CLOSEUP',
          originalName: 'premium-rice-mrp-panel.jpg',
          sizeBytes: 1950000,
        },
      ];

      await InspectionImage.insertMany(sampleImages);

      return res.status(201).json({
        success: true,
        message: 'Sample test package loaded successfully. Ready to run [PROCESS PRODUCT].',
        data: {
          inspectionId: inspection.inspectionId,
          _id: inspection._id,
          product: sampleProductData,
          imagesCount: sampleImages.length,
        },
      });
    }

    // In-Memory
    const memInspection = {
      _id: `insp-test-${Date.now()}`,
      inspectionId,
      product: sampleProductData,
      productDetailsSnapshot: sampleProductData,
      status: 'IMAGE_CAPTURED',
      images: [
        { _id: 'img-1', imageUrl: '/uploads/sample-rice-front.jpg', imageType: 'FRONT' },
        { _id: 'img-2', imageUrl: '/uploads/sample-rice-back.jpg', imageType: 'BACK' },
        { _id: 'img-3', imageUrl: '/uploads/sample-rice-mrp.jpg', imageType: 'MRP_CLOSEUP' },
      ],
    };

    return res.status(201).json({
      success: true,
      message: 'Sample test package loaded (In-Memory). Ready to process.',
      data: memInspection,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processScanSession,
  getOCRResults,
  getDeclarations,
  updateDeclarationField,
  confirmExtraction,
  triggerRescan,
  loadSamplePackage,
};
