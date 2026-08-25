const express = require('express');
const router = express.Router();
const { getRules, createRule, toggleRuleStatus } = require('../controllers/ruleController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Rules can be viewed by all authenticated users, modified by Admin
router.get('/', protect, getRules);
router.post('/', protect, authorize('ADMIN'), createRule);
router.patch('/:id/toggle', protect, authorize('ADMIN'), toggleRuleStatus);

module.exports = router;
