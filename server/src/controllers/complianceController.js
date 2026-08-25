const ComplianceRule = require('../models/ComplianceRule');
const RuleResult = require('../models/RuleResult');
const Finding = require('../models/Finding');
const Inspection = require('../models/Inspection');
const AuditLog = require('../models/AuditLog');
const complianceEngine = require('../services/complianceEngine');
const { isDbConnected } = require('../config/db');
const { getInspectionQuery, getRuleQuery, getFindingQuery, isMongoObjectId } = require('../utils/queryHelper');

// In-memory compliance data store for seamless standalone evaluation
let inMemoryRuleResults = {};
let inMemoryFindings = {};
let inMemoryAuditLogs = [];

/**
 * @desc    Get all compliance rules
 * @route   GET /api/compliance/rules
 * @access  Private
 */
const getComplianceRules = async (req, res, next) => {
  try {
    const { category, active } = req.query;
    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (active !== undefined) filter.active = active === 'true';

    if (isDbConnected()) {
      const rules = await ComplianceRule.find(filter).sort({ ruleId: 1 });
      return res.status(200).json({ success: true, count: rules.length, data: rules });
    }

    const defaultRules = await complianceEngine.getActiveRules();
    return res.status(200).json({ success: true, count: defaultRules.length, data: defaultRules });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single compliance rule by ID
 * @route   GET /api/compliance/rules/:id
 * @access  Private
 */
const getComplianceRuleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let rule = null;

    if (isDbConnected()) {
      rule = await ComplianceRule.findOne(getRuleQuery(id));
    } else {
      const defaultRules = await complianceEngine.getActiveRules();
      rule = defaultRules.find((r) => r.ruleId === id || r._id === id);
    }

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Compliance rule not found' });
    }

    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new compliance rule (Admin only)
 * @route   POST /api/compliance/rules
 * @access  Private (Admin)
 */
const createComplianceRule = async (req, res, next) => {
  try {
    const { ruleId, title, description, category, requiredField, validationType, severity, legalReference, confidenceThreshold } = req.body;

    if (!ruleId || !title || !requiredField) {
      return res.status(400).json({ success: false, message: 'Rule ID, Title, and Target Field are required.' });
    }

    if (isDbConnected()) {
      const existing = await ComplianceRule.findOne({ ruleId: ruleId.toUpperCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: `Rule ID ${ruleId} already exists.` });
      }

      const rule = await ComplianceRule.create({
        ...req.body,
        ruleId: ruleId.toUpperCase(),
        version: 1,
      });

      await AuditLog.create({
        user: req.user?._id,
        userName: req.user?.name || 'Administrator',
        userRole: req.user?.role || 'ADMIN',
        action: 'RULE_CREATED',
        details: { ruleId: rule.ruleId, title: rule.title, version: 1 },
      });

      return res.status(201).json({ success: true, message: 'Rule created successfully', data: rule });
    }

    const memRule = {
      _id: `rule-${Date.now()}`,
      ruleId: ruleId.toUpperCase(),
      title,
      description,
      category: category || 'All',
      requiredField,
      validationType: validationType || 'REQUIRED',
      severity: severity || 'HIGH',
      legalReference: legalReference || 'Legal Metrology Rules, 2011',
      confidenceThreshold: confidenceThreshold || 0.80,
      active: true,
      version: 1,
      createdAt: new Date(),
    };

    return res.status(201).json({ success: true, message: 'Rule created successfully (In-Memory)', data: memRule });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update and version a compliance rule (Admin only)
 * @route   PUT /api/compliance/rules/:id
 * @access  Private (Admin)
 */
const updateComplianceRule = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const rule = await ComplianceRule.findOne(getRuleQuery(id));
      if (!rule) {
        return res.status(404).json({ success: false, message: 'Rule not found' });
      }

      // Increment version upon update for historical traceability
      rule.title = req.body.title || rule.title;
      rule.description = req.body.description || rule.description;
      rule.category = req.body.category || rule.category;
      rule.requiredField = req.body.requiredField || rule.requiredField;
      rule.validationType = req.body.validationType || rule.validationType;
      rule.severity = req.body.severity || rule.severity;
      rule.legalReference = req.body.legalReference || rule.legalReference;
      rule.confidenceThreshold = req.body.confidenceThreshold !== undefined ? req.body.confidenceThreshold : rule.confidenceThreshold;
      rule.version = (rule.version || 1) + 1;

      await rule.save();

      await AuditLog.create({
        user: req.user?._id,
        userName: req.user?.name || 'Administrator',
        userRole: req.user?.role || 'ADMIN',
        action: 'RULE_MODIFIED',
        details: { ruleId: rule.ruleId, newVersion: rule.version },
      });

      return res.status(200).json({ success: true, message: `Rule updated to version ${rule.version}`, data: rule });
    }

    return res.status(200).json({ success: true, message: 'Rule updated (In-Memory)', data: req.body });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle rule active state
 * @route   PATCH /api/compliance/rules/:id/toggle
 * @access  Private (Admin)
 */
const toggleRuleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const rule = await ComplianceRule.findOne(getRuleQuery(id));
      if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });

      rule.active = !rule.active;
      await rule.save();

      await AuditLog.create({
        user: req.user?._id,
        userName: req.user?.name || 'Administrator',
        userRole: req.user?.role || 'ADMIN',
        action: 'RULE_TOGGLED',
        details: { ruleId: rule.ruleId, active: rule.active },
      });

      return res.status(200).json({ success: true, message: `Rule ${rule.active ? 'activated' : 'deactivated'}`, data: rule });
    }

    return res.status(200).json({ success: true, message: 'Rule toggled (In-Memory)' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Run compliance screening check on an inspection
 * @route   POST /api/inspections/:id/screen
 * @access  Private (Officer, Admin)
 */
const runInspectionScreening = async (req, res, next) => {
  try {
    const { id: inspectionId } = req.params;
    const { declarationsData } = req.body;

    const screeningOutcome = await complianceEngine.runComplianceCheck(
      inspectionId,
      declarationsData,
      req.user
    );

    // Save in-memory cache
    inMemoryRuleResults[inspectionId] = screeningOutcome.ruleResults;
    inMemoryFindings[inspectionId] = screeningOutcome.findings;

    res.status(200).json({
      success: true,
      message: 'Compliance screening completed successfully',
      data: screeningOutcome,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get inspection compliance summary & rule results
 * @route   GET /api/inspections/:id/compliance
 * @access  Private
 */
const getInspectionCompliance = async (req, res, next) => {
  try {
    const { id: inspectionId } = req.params;

    let inspection = null;
    let ruleResults = [];
    let findings = [];
    let auditLogs = [];

    if (isDbConnected()) {
      inspection = await Inspection.findOne(getInspectionQuery(inspectionId))
        .populate('product')
        .populate('officer');

      if (inspection) {
        ruleResults = await RuleResult.find({ inspection: inspection._id });
        findings = await Finding.find({ inspection: inspection._id });
        auditLogs = await AuditLog.find({ inspectionId: inspection.inspectionId }).sort({ timestamp: -1 });
      }
    }

    // Fallback if results are stored in memory
    if (ruleResults.length === 0 && inMemoryRuleResults[inspectionId]) {
      ruleResults = inMemoryRuleResults[inspectionId];
      findings = inMemoryFindings[inspectionId] || [];
    }

    // If no screening has been run yet, run initial screening
    if (ruleResults.length === 0) {
      const outcome = await complianceEngine.runComplianceCheck(inspectionId, null, req.user);
      ruleResults = outcome.ruleResults;
      findings = outcome.findings;
    }

    res.status(200).json({
      success: true,
      data: {
        inspection,
        screeningSummary: inspection?.screeningSummary || {
          totalRulesChecked: ruleResults.length,
          passed: ruleResults.filter((r) => r.status === 'PASS').length,
          potentialIssues: ruleResults.filter((r) => r.status === 'FAIL').length,
          requiresReview: ruleResults.filter((r) => r.status === 'REQUIRES_REVIEW').length,
          notApplicable: ruleResults.filter((r) => r.status === 'NOT_APPLICABLE').length,
          overallScreening: inspection?.overallResult || 'REQUIRES_MANUAL_VERIFICATION',
        },
        ruleResults,
        findings,
        auditLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get findings for an inspection
 * @route   GET /api/inspections/:id/findings
 * @access  Private
 */
const getInspectionFindings = async (req, res, next) => {
  try {
    const { id: inspectionId } = req.params;

    if (isDbConnected()) {
      const findings = await Finding.find(
        isMongoObjectId(inspectionId)
          ? { $or: [{ inspection: inspectionId }, { inspectionId }] }
          : { inspectionId }
      );
      return res.status(200).json({ success: true, count: findings.length, data: findings });
    }

    const memFindings = inMemoryFindings[inspectionId] || [];
    return res.status(200).json({ success: true, count: memFindings.length, data: memFindings });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Officer verifies & confirms finding
 * @route   PATCH /api/findings/:id/verify
 * @access  Private (Officer, Admin)
 */
const verifyFinding = async (req, res, next) => {
  try {
    const { id: findingId } = req.params;
    const { officerComment } = req.body;

    if (isDbConnected()) {
      const finding = await Finding.findOne(getFindingQuery(findingId));
      if (!finding) return res.status(404).json({ success: false, message: 'Finding record not found' });

      finding.status = 'OFFICER_CONFIRMED';
      finding.officerComment = officerComment || finding.officerComment || 'Confirmed by Enforcement Officer';
      finding.verifiedBy = req.user?._id;
      finding.verifiedAt = new Date();
      await finding.save();

      await AuditLog.create({
        user: req.user?._id,
        userName: req.user?.name || 'Enforcement Officer',
        userRole: req.user?.role || 'OFFICER',
        action: 'FINDING_CONFIRMED',
        inspectionId: finding.inspectionId,
        details: { findingId: finding._id, ruleId: finding.ruleId, comment: finding.officerComment },
      });

      return res.status(200).json({ success: true, message: 'Finding confirmed by Officer', data: finding });
    }

    return res.status(200).json({
      success: true,
      message: 'Finding confirmed (In-Memory)',
      data: { _id: findingId, status: 'OFFICER_CONFIRMED', officerComment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Officer rejects finding
 * @route   PATCH /api/findings/:id/reject
 * @access  Private (Officer, Admin)
 */
const rejectFinding = async (req, res, next) => {
  try {
    const { id: findingId } = req.params;
    const { officerComment } = req.body;

    if (isDbConnected()) {
      const finding = await Finding.findOne(getFindingQuery(findingId));
      if (!finding) return res.status(404).json({ success: false, message: 'Finding record not found' });

      finding.status = 'OFFICER_REJECTED';
      finding.officerComment = officerComment || 'Rejected by Officer upon physical verification';
      finding.verifiedBy = req.user?._id;
      finding.verifiedAt = new Date();
      await finding.save();

      await AuditLog.create({
        user: req.user?._id,
        userName: req.user?.name || 'Enforcement Officer',
        userRole: req.user?.role || 'OFFICER',
        action: 'FINDING_REJECTED',
        inspectionId: finding.inspectionId,
        details: { findingId: finding._id, ruleId: finding.ruleId, comment: finding.officerComment },
      });

      return res.status(200).json({ success: true, message: 'Finding marked as rejected/compliant', data: finding });
    }

    return res.status(200).json({
      success: true,
      message: 'Finding rejected (In-Memory)',
      data: { _id: findingId, status: 'OFFICER_REJECTED', officerComment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Officer requests re-scan for additional packaging evidence
 * @route   POST /api/inspections/:id/request-rescan
 * @access  Private (Officer, Admin)
 */
const requestRescan = async (req, res, next) => {
  try {
    const { id: inspectionId } = req.params;
    const { findingId, reason } = req.body;

    if (isDbConnected()) {
      const inspection = await Inspection.findOne(getInspectionQuery(inspectionId));
      if (inspection) {
        inspection.status = 'IMAGE_CAPTURED'; // Return to image capture state on same inspection
        await inspection.save();
      }

      if (findingId) {
        const finding = await Finding.findOne(getFindingQuery(findingId));
        if (finding) {
          finding.status = 'REQUIRES_MORE_EVIDENCE';
          finding.officerComment = reason || 'Re-scan requested for clear declaration evidence';
          await finding.save();
        }
      }

      await AuditLog.create({
        user: req.user?._id,
        userName: req.user?.name || 'Enforcement Officer',
        userRole: req.user?.role || 'OFFICER',
        action: 'RESCAN_REQUESTED',
        inspectionId: inspection?.inspectionId || inspectionId,
        details: { reason: reason || 'Officer requested additional packaging imagery' },
      });

      return res.status(200).json({
        success: true,
        message: 'Re-scan requested. Ready to capture additional images for this inspection.',
        inspectionId: inspection?.inspectionId || inspectionId,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Re-scan requested (In-Memory)',
      inspectionId,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
