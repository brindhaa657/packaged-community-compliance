const express = require('express');
const router = express.Router();
const {
  createInspection,
  uploadInspectionImages,
  deleteInspectionImage,
  getInspectionById,
  getInspections,
} = require('../controllers/inspectionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const upload = require('../middleware/upload');

// Protect all inspection routes with JWT authentication
router.use(protect);

router.route('/')
  .post(authorize('OFFICER', 'ADMIN'), createInspection)
  .get(getInspections);

router.route('/:id')
  .get(getInspectionById);

router.post(
  '/:id/images',
  authorize('OFFICER', 'ADMIN'),
  upload.array('images', 10),
  uploadInspectionImages
);

router.delete(
  '/:id/images/:imageId',
  authorize('OFFICER', 'ADMIN'),
  deleteInspectionImage
);

module.exports = router;
