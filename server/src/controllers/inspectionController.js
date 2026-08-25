const Inspection = require('../models/Inspection');
const Product = require('../models/Product');
const InspectionImage = require('../models/InspectionImage');
const imageStorageService = require('../services/imageStorageService');
const inMemoryStore = require('../utils/inMemoryStore');
const { isDbConnected } = require('../config/db');
const { getInspectionQuery, isMongoObjectId } = require('../utils/queryHelper');

// Initial seed in in-memory store
if (inMemoryStore.inspections.length === 0) {
  inMemoryStore.saveInspection({
    _id: 'insp-demo-001',
    inspectionId: 'INSP-2026-0001',
    officer: {
      _id: '66c8b0010000000000000002',
      name: 'Inspector Vikram Singh',
      badgeNumber: 'LM-OFF-742',
      jurisdiction: 'Delhi NCR Enforcement Division',
    },
    product: {
      _id: 'prod-demo-001',
      productName: 'NutriDelight Almond Butter 500g',
      brand: 'NutriDelight',
      category: 'Food',
      manufacturer: 'Apex Consumer Products Pvt. Ltd., Plot No. 45, Gurugram',
      identifiers: { barcode: '8901030889214' },
    },
    productDetailsSnapshot: {
      productName: 'NutriDelight Almond Butter 500g',
      brand: 'NutriDelight',
      category: 'Food',
      manufacturer: 'Apex Consumer Products Pvt. Ltd., Plot No. 45, Gurugram',
    },
    location: {
      storeName: 'Reliance Fresh Supermarket',
      address: 'Block A, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi NCR',
      inspectionType: 'SUPERMARKET',
    },
    inspectionDate: new Date().toISOString(),
    status: 'IMAGE_CAPTURED',
    overallResult: 'PENDING_SCREENING',
    confidenceScore: 0,
    remarks: 'Field inspection for packaged commodity scanning.',
    images: [],
  });
}

/**
 * @desc    Create a new inspection and product record
 * @route   POST /api/inspections
 * @access  Private (Officer, Admin)
 */
const createInspection = async (req, res, next) => {
  try {
    const {
      productName,
      brand,
      category = 'Food',
      manufacturer,
      packer,
      importer,
      barcode,
      location,
      storeName,
      address,
      city,
      state,
      inspectionType = 'RETAIL_STORE',
      remarks,
    } = req.body;

    if (!productName || productName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Product name is required for inspection creation.',
      });
    }

    const officerId = req.user?._id || '66c8b0010000000000000002';
    const inspectionId = `INSP-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const locationData = {
      storeName: storeName || (typeof location === 'string' ? location : location?.storeName) || 'Retail Store',
      address: address || (typeof location === 'object' ? location?.address : '') || '',
      city: city || (typeof location === 'object' ? location?.city : '') || 'Chennai',
      state: state || (typeof location === 'object' ? location?.state : '') || 'Tamil Nadu',
      inspectionType: inspectionType || 'RETAIL_STORE',
    };

    if (isDbConnected()) {
      // 1. Create Product
      const product = await Product.create({
        productName: productName.trim(),
        brand: brand?.trim() || 'Unbranded',
        category,
        manufacturer: manufacturer?.trim() || '',
        packer: packer?.trim() || '',
        importer: importer?.trim() || '',
        identifiers: {
          barcode: barcode?.trim() || '',
        },
      });

      // 2. Create Inspection
      const inspection = await Inspection.create({
        inspectionId,
        officer: officerId,
        product: product._id,
        productDetailsSnapshot: {
          productName: product.productName,
          brand: product.brand,
          category: product.category,
          manufacturer: product.manufacturer,
        },
        location: locationData,
        status: 'IMAGE_CAPTURED',
        overallResult: 'PENDING_SCREENING',
        remarks: remarks || '',
      });

      const populatedInspection = await Inspection.findById(inspection._id)
        .populate('product')
        .populate('officer', 'name email badgeNumber jurisdiction');

      return res.status(201).json({
        success: true,
        message: 'Inspection created successfully. Ready for package scanning.',
        data: populatedInspection,
      });
    }

    // In-memory fallback
    const memProduct = {
      _id: `prod-${Date.now()}`,
      productName: productName.trim(),
      brand: brand?.trim() || 'Unbranded',
      category,
      manufacturer: manufacturer?.trim() || '',
      packer: packer?.trim() || '',
      importer: importer?.trim() || '',
      identifiers: { barcode: barcode?.trim() || '' },
      createdAt: new Date(),
    };

    const memInspection = {
      _id: `insp-${Date.now()}`,
      inspectionId,
      officer: {
        _id: officerId,
        name: req.user?.name || 'Inspector Vikram Singh',
        badgeNumber: req.user?.badgeNumber || 'LM-OFF-742',
        jurisdiction: req.user?.jurisdiction || 'Field Enforcement Division',
      },
      product: memProduct,
      productDetailsSnapshot: {
        productName: memProduct.productName,
        brand: memProduct.brand,
        category: memProduct.category,
        manufacturer: memProduct.manufacturer,
      },
      location: locationData,
      inspectionDate: new Date().toISOString(),
      status: 'IMAGE_CAPTURED',
      overallResult: 'PENDING_SCREENING',
      confidenceScore: 0,
      remarks: remarks || '',
      images: [],
      createdAt: new Date().toISOString(),
    };

    inMemoryStore.saveInspection(memInspection);

    return res.status(201).json({
      success: true,
      message: 'Inspection created successfully (In-Memory). Ready for package scanning.',
      data: memInspection,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload one or multiple captured/scanned images for an inspection
 * @route   POST /api/inspections/:id/images
 * @access  Private (Officer, Admin)
 */
const uploadInspectionImages = async (req, res, next) => {
  try {
    const inspectionId = req.params.id;
    const files = req.files || (req.file ? [req.file] : []);
    const { imageType = 'FRONT', imageTypes } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files uploaded. Please capture or select packaging images.',
      });
    }

    // Parse imageTypes array if provided as JSON string
    let parsedTypes = [];
    if (imageTypes) {
      try {
        parsedTypes = typeof imageTypes === 'string' ? JSON.parse(imageTypes) : imageTypes;
      } catch (e) {
        parsedTypes = [imageType];
      }
    }

    const savedImages = [];

    // Find inspection
    let inspection = null;
    if (isDbConnected()) {
      inspection = await Inspection.findOne(getInspectionQuery(inspectionId));
    } else {
      inspection = inMemoryStore.getInspection(inspectionId);
    }

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: `Inspection session not found for ID: ${inspectionId}`,
      });
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = parsedTypes[i] || imageType || 'FRONT';

      const storageResult = await imageStorageService.saveImage(file);

      if (isDbConnected()) {
        const imageRecord = await InspectionImage.create({
          inspection: inspection._id,
          imageUrl: storageResult.url,
          imageType: type,
          originalName: storageResult.originalName,
          mimeType: storageResult.mimeType,
          sizeBytes: storageResult.sizeBytes,
          uploadedAt: new Date(),
        });
        savedImages.push(imageRecord);
      } else {
        const memImage = {
          _id: `img-${Date.now()}-${i}`,
          inspection: inspection._id || inspection.inspectionId,
          imageUrl: storageResult.url,
          imageType: type,
          originalName: storageResult.originalName,
          mimeType: storageResult.mimeType,
          sizeBytes: storageResult.sizeBytes,
          uploadedAt: new Date(),
        };
        inMemoryStore.addImage(memImage);
        savedImages.push(memImage);

        // Attach to in-memory inspection
        if (!inspection.images) inspection.images = [];
        inspection.images.push(memImage);
      }
    }

    // Ensure status is updated to IMAGE_CAPTURED
    if (isDbConnected() && inspection) {
      inspection.status = 'IMAGE_CAPTURED';
      await inspection.save();
    } else if (inspection) {
      inspection.status = 'IMAGE_CAPTURED';
    }

    return res.status(201).json({
      success: true,
      message: `${savedImages.length} packaging image(s) uploaded and linked to inspection.`,
      count: savedImages.length,
      data: savedImages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an image from an inspection
 * @route   DELETE /api/inspections/:id/images/:imageId
 * @access  Private (Officer, Admin)
 */
const deleteInspectionImage = async (req, res, next) => {
  try {
    const { id: inspectionId, imageId } = req.params;

    if (isDbConnected()) {
      const imageRecord = await InspectionImage.findOne({
        _id: imageId,
        inspection: inspectionId,
      });

      if (!imageRecord) {
        return res.status(404).json({
          success: false,
          message: 'Inspection image not found.',
        });
      }

      // Delete file from disk
      await imageStorageService.deleteImage(imageRecord.imageUrl);

      // Remove from DB
      await InspectionImage.findByIdAndDelete(imageId);

      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully from inspection.',
        imageId,
      });
    }

    // In-memory fallback
    const memInsp = inMemoryStore.getInspection(inspectionId);

    if (memInsp && memInsp.images) {
      const idx = memInsp.images.findIndex((img) => img._id === imageId);
      if (idx !== -1) {
        const [deletedImg] = memInsp.images.splice(idx, 1);
        await imageStorageService.deleteImage(deletedImg.imageUrl);
        return res.status(200).json({
          success: true,
          message: 'Image deleted successfully (In-Memory).',
          imageId,
        });
      }
    }

    res.status(404).json({
      success: false,
      message: 'Image not found in inspection.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get inspection by ID with product and images
 * @route   GET /api/inspections/:id
 * @access  Private
 */
const getInspectionById = async (req, res, next) => {
  try {
    const inspectionId = req.params.id;

    if (isDbConnected()) {
      const inspection = await Inspection.findOne(getInspectionQuery(inspectionId))
        .populate('product')
        .populate('officer', 'name email badgeNumber jurisdiction');

      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: 'Inspection not found.',
        });
      }

      // Fetch images
      const images = await InspectionImage.find({ inspection: inspection._id }).sort({ uploadedAt: 1 });

      const inspObject = inspection.toObject();
      inspObject.images = images;

      return res.status(200).json({
        success: true,
        data: inspObject,
      });
    }

    // In-memory fallback
    const memInsp = inMemoryStore.getInspection(inspectionId);

    if (!memInsp) {
      return res.status(404).json({
        success: false,
        message: 'Inspection record not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: memInsp,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all inspections
 * @route   GET /api/inspections
 * @access  Private
 */
const getInspections = async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const inspections = await Inspection.find()
        .populate('product')
        .populate('officer', 'name email badgeNumber jurisdiction')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: inspections.length,
        data: inspections,
      });
    }

    return res.status(200).json({
      success: true,
      count: inMemoryStore.inspections.length,
      data: inMemoryStore.inspections,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInspection,
  uploadInspectionImages,
  deleteInspectionImage,
  getInspectionById,
  getInspections,
};
