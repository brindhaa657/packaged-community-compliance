const express = require('express');
const router = express.Router();
const {
  getComplianceRules,
  getComplianceRuleById,
  createComplianceRule,
  updateComplianceRule,
  toggleRuleStatus,
  runInspectionScreening,
  getInspectionCompliance,
  getInspectionFindings,
  verifyFinding,
  rejectFinding,
  requestRescan,
} = require('../controllers/complianceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// All compliance and finding routes require JWT authentication
router.use(protect);

// 1. Compliance Rules Management
router.route('/compliance/rules')
  .get(getComplianceRules)
  .post(authorize('ADMIN'), createComplianceRule);

router.route('/compliance/rules/:id')
  .get(getComplianceRuleById)
  .put(authorize('ADMIN'), updateComplianceRule);

router.patch('/compliance/rules/:id/toggle', authorize('ADMIN'), toggleRuleStatus);

// 2. Inspection Compliance Screening & Findings
router.post('/inspections/:id/screen', authorize('OFFICER', 'ADMIN'), runInspectionScreening);
router.get('/inspections/:id/compliance', getInspectionCompliance);
router.get('/inspections/:id/findings', getInspectionFindings);
router.post('/inspections/:id/request-rescan', authorize('OFFICER', 'ADMIN'), requestRescan);

// 3. Finding Verification & Rejection
router.patch('/findings/:id/verify', authorize('OFFICER', 'SUPERVISOR', 'ADMIN'), verifyFinding);
router.patch('/findings/:id/reject', authorize('OFFICER', 'SUPERVISOR', 'ADMIN'), rejectFinding);

module.exports = router;
