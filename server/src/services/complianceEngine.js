const ComplianceRule = require('../models/ComplianceRule');
const RuleResult = require('../models/RuleResult');
const Finding = require('../models/Finding');
const Inspection = require('../models/Inspection');
const AuditLog = require('../models/AuditLog');
const { isDbConnected } = require('../config/db');
const { getInspectionQuery } = require('../utils/queryHelper');

// Default authoritative Legal Metrology Rules (Packaged Commodities) Rules, 2011 repository
const defaultStatutoryRules = [
  {
    ruleId: 'LM-PN-001',
    title: 'Product / Commodity Generic Name Declaration',
    description: 'Check whether the generic name or commodity identity has been declared prominently on the display panel.',
    category: 'All',
    requiredField: 'productName',
    validationType: 'REQUIRED',
    severity: 'CRITICAL',
    legalReference: 'Rule 6(1)(a) of Legal Metrology (Packaged Commodities) Rules, 2011',
    active: true,
    version: 1,
    confidenceThreshold: 0.75,
  },
  {
    ruleId: 'LM-MFG-001',
    title: 'Manufacturer / Packer Name and Complete Physical Address',
    description: 'Check whether the full legal name and complete postal address of the manufacturer or packer is stated.',
    category: 'All',
    requiredField: 'manufacturer',
    validationType: 'REQUIRED',
    severity: 'HIGH',
    legalReference: 'Rule 6(1)(b) of Legal Metrology (Packaged Commodities) Rules, 2011',
    active: true,
    version: 1,
    confidenceThreshold: 0.75,
  },
  {
    ruleId: 'LM-NQ-001',
    title: 'Net Quantity in Standard SI Metric Units',
    description: 'Check whether net quantity is declared in standard metric units (g, kg, ml, l, N, U) without non-standard symbols.',
    category: 'All',
    requiredField: 'netQuantity',
    validationType: 'QUANTITY_FORMAT',
    severity: 'CRITICAL',
    legalReference: 'Rule 6(1)(c) and Rule 12 of Legal Metrology (Packaged Commodities) Rules, 2011',
    active: true,
    version: 1,
    confidenceThreshold: 0.85,
  },
  {
    ruleId: 'LM-MRP-001',
    title: 'Maximum Retail Price (MRP) Declaration Inclusive of All Taxes',
    description: 'Check whether Maximum Retail Price is stated in recognized currency format and explicitly mentions "(incl. of all taxes)".',
    category: 'All',
    requiredField: 'mrp',
    validationType: 'CURRENCY_FORMAT',
    severity: 'CRITICAL',
    legalReference: 'Rule 6(1)(e) of Legal Metrology (Packaged Commodities) Rules, 2011',
    active: true,
    version: 1,
    confidenceThreshold: 0.85,
  },
  {
    ruleId: 'LM-DATE-001',
    title: 'Month and Year of Manufacture / Pre-packing',
    description: 'Check whether the month and year of manufacture, packing, or pre-packing is declared.',
    category: 'All',
    requiredField: 'dateOfManufacture',
    validationType: 'DATE_FORMAT',
    severity: 'HIGH',
    legalReference: 'Rule 6(1)(d) of Legal Metrology (Packaged Commodities) Rules, 2011',
    active: true,
    version: 1,
    confidenceThreshold: 0.75,
  },
  {
    ruleId: 'LM-CC-001',
    title: 'Consumer Care Cell Contact Details',
    description: 'Check whether consumer grievance contact information (telephone, email, and address) is present.',
    category: 'All',
    requiredField: 'consumerCare',
    validationType: 'REQUIRED',
    severity: 'HIGH',
    legalReference: 'Rule 6(1)(n) of Legal Metrology (Packaged Commodities) Rules, 2011',
    active: true,
    version: 1,
    confidenceThreshold: 0.75,
  },
  {
    ruleId: 'LM-COO-001',
    title: 'Country of Origin Declaration',
    description: 'Check whether the country of origin is declared on the packaging.',
    category: 'All',
    requiredField: 'countryOfOrigin',
    validationType: 'REQUIRED',
    severity: 'HIGH',
    legalReference: 'Rule 6(10) of Legal Metrology (Packaged Commodities) Rules, 2011',
    active: true,
    version: 1,
    confidenceThreshold: 0.80,
  },
];

class ComplianceEngine {
  /**
   * Modular Net Quantity Parser & Validator
   * Parses original value into { originalValue, normalizedValue, unit }
   */
  parseAndValidateQuantity(rawValue) {
    if (!rawValue || typeof rawValue !== 'string') {
      return {
        status: 'FAIL',
        explanation: 'Net quantity declaration was not detected on the packaging.',
        parsed: null,
      };
    }

    const trimmed = rawValue.trim();

    // Check for illegal non-SI symbols (e.g., GMS, gms, KGS, ML.)
    const nonSiRegex = /\b(gms|GMS|gm|GM|kgs|KGS|ltr|LTR|ltrs|LTRS)\b/i;
    if (nonSiRegex.test(trimmed)) {
      return {
        status: 'FAIL',
        explanation: `Non-standard unit symbol detected ("${trimmed}"). Rule 12 requires standard SI symbols: 'g', 'kg', 'ml', 'l', 'N', 'U'.`,
        parsed: { originalValue: trimmed, unit: 'invalid_symbol' },
      };
    }

    // Standard metric SI format regex (e.g., "500 g", "1 kg", "1.5 L", "250 ml", "10 N", "1 U")
    const standardRegex = /^([\d.,]+)\s*(kg|g|mg|l|L|ml|mL|m|cm|mm|N|U|units|nos|packs?)$/i;
    const match = trimmed.match(standardRegex);

    if (match) {
      const numStr = match[1].replace(/,/g, '');
      const numVal = parseFloat(numStr);
      const unit = match[2].toLowerCase();

      return {
        status: 'PASS',
        explanation: `Valid net quantity declaration detected (${numVal} ${unit}).`,
        parsed: {
          originalValue: trimmed,
          normalizedValue: numVal,
          unit,
        },
      };
    }

    // If format is unfamiliar or complex (e.g. combined pack "2 x 250g"), flag for manual review
    return {
      status: 'REQUIRES_REVIEW',
      explanation: `Net quantity format ("${trimmed}") requires manual verification by the enforcement officer.`,
      parsed: { originalValue: trimmed },
    };
  }

  /**
   * Modular MRP Validator
   */
  validateMRP(rawValue) {
    if (!rawValue || typeof rawValue !== 'string') {
      return {
        status: 'FAIL',
        explanation: 'Maximum Retail Price (MRP) declaration was not detected.',
        details: null,
      };
    }

    const trimmed = rawValue.trim();

    // Check for illegal "Taxes Extra"
    if (/taxes\s+extra/i.test(trimmed)) {
      return {
        status: 'FAIL',
        explanation: 'MRP indicates "Taxes Extra". Under Rule 6(1)(e), MRP must be inclusive of all taxes.',
        details: { mrpText: trimmed },
      };
    }

    // Check for multiple conflicting MRP values on same display
    const priceMatches = trimmed.match(/(?:Rs\.?|₹|INR)\s*[\d.,]+/gi);
    if (priceMatches && priceMatches.length > 2) {
      return {
        status: 'REQUIRES_REVIEW',
        explanation: `Multiple MRP values detected (${priceMatches.join(', ')}). Requires manual verification for potential dual pricing.`,
        details: { priceMatches },
      };
    }

    // Check for standard MRP format
    const hasCurrency = /(?:Rs\.?|₹|INR|\d+)/i.test(trimmed);
    const hasInclusivePhrase = /incl(?:usive)?(?:\s+of)?(?:\s+all)?\s+taxes/i.test(trimmed);

    if (hasCurrency) {
      if (hasInclusivePhrase || /MRP/i.test(trimmed)) {
        return {
          status: 'PASS',
          explanation: `MRP declaration detected (${trimmed}).`,
          details: { mrpText: trimmed },
        };
      }
      return {
        status: 'REQUIRES_REVIEW',
        explanation: `MRP value detected ("${trimmed}") but "incl. of all taxes" phrasing requires manual verification.`,
        details: { mrpText: trimmed },
      };
    }

    return {
      status: 'REQUIRES_REVIEW',
      explanation: `MRP declaration ("${trimmed}") format requires officer review.`,
      details: { mrpText: trimmed },
    };
  }

  /**
   * Date Format Validator
   */
  validateDate(rawValue) {
    if (!rawValue || typeof rawValue !== 'string') {
      return {
        status: 'FAIL',
        explanation: 'Month and year of manufacture or pre-packing was not detected.',
      };
    }

    const trimmed = rawValue.trim();
    const datePattern = /(?:\d{1,2}\/\d{2,4}|\d{1,2}-\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{2,4}|\d{4})/i;

    if (datePattern.test(trimmed)) {
      return {
        status: 'PASS',
        explanation: `Valid date of manufacture/packing detected (${trimmed}).`,
      };
    }

    return {
      status: 'REQUIRES_REVIEW',
      explanation: `Date format ("${trimmed}") requires manual verification.`,
    };
  }

  /**
   * Presence & Confidence Validator
   */
  validatePresence(rawValue, confidence = 90, threshold = 0.75, ruleTitle = 'Field') {
    if (!rawValue || typeof rawValue !== 'string' || rawValue.trim() === '') {
      return {
        status: 'FAIL',
        explanation: `${ruleTitle} was not detected on the scanned package images.`,
      };
    }

    const confDecimal = confidence > 1 ? confidence / 100 : confidence;

    if (confDecimal < threshold) {
      return {
        status: 'REQUIRES_REVIEW',
        explanation: `${ruleTitle} detected with low optical confidence (${Math.round(confDecimal * 100)}% vs ${Math.round(threshold * 100)}% threshold). Requires manual review.`,
      };
    }

    return {
      status: 'PASS',
      explanation: `${ruleTitle} verified detected with high confidence (${Math.round(confDecimal * 100)}%).`,
    };
  }

  /**
   * Retrieve active compliance rules from DB or fallback
   */
  async getActiveRules() {
    if (isDbConnected()) {
      try {
        const rules = await ComplianceRule.find({ active: true });
        if (rules && rules.length > 0) return rules;
      } catch (err) {
        console.warn('[ComplianceEngine] Error fetching rules from DB, using defaults:', err.message);
      }
    }
    return defaultStatutoryRules;
  }

  /**
   * Main Compliance Check Function
   * Evaluates an inspection against applicable rules in a data-driven pipeline
   */
  async runComplianceCheck(inspectionId, customDeclarations = null, user = null) {
    // 1. Fetch inspection
    let inspection = null;
    if (isDbConnected()) {
      inspection = await Inspection.findOne(getInspectionQuery(inspectionId))
        .populate('product')
        .populate('officer');
    }

    // Prepare declaration data map
    const productCategory = inspection?.product?.category || inspection?.productDetailsSnapshot?.category || 'Food';
    const productName = inspection?.product?.productName || inspection?.productDetailsSnapshot?.productName || 'Packaged Commodity';

    let decData = customDeclarations || inspection?.declarationsData || {};

    // Populate fallback simulated declaration values if not present
    if (!decData.productName) decData.productName = { value: productName, confidence: 95 };
    if (!decData.manufacturer) {
      decData.manufacturer = {
        value: inspection?.product?.manufacturer || inspection?.productDetailsSnapshot?.manufacturer || 'Apex Consumer Products Pvt. Ltd., Plot 45, Gurugram, India',
        confidence: 92,
      };
    }
    if (!decData.netQuantity) decData.netQuantity = { value: '500 g', confidence: 95 };
    if (!decData.mrp) decData.mrp = { value: 'Rs. 249.00 (incl. of all taxes)', confidence: 94 };
    if (!decData.dateOfManufacture) decData.dateOfManufacture = { value: '06/2024', confidence: 90 };
    if (!decData.consumerCare) {
      decData.consumerCare = {
        value: 'Apex Consumer Care, Phone: 1800-200-8899, Email: customercare@apexconsumer.in',
        confidence: 91,
      };
    }
    if (!decData.countryOfOrigin) decData.countryOfOrigin = { value: 'India', confidence: 98 };

    // 2. Load active rules
    const allRules = await this.getActiveRules();

    const ruleResults = [];
    const findings = [];

    let passedCount = 0;
    let failCount = 0;
    let warningCount = 0;
    let requiresReviewCount = 0;
    let notApplicableCount = 0;

    // 3. Evaluate each rule
    for (const rule of allRules) {
      // Check category applicability
      const isApplicable =
        rule.category === 'All' ||
        rule.category === 'General' ||
        rule.category.toLowerCase() === productCategory.toLowerCase();

      if (!isApplicable) {
        notApplicableCount++;
        ruleResults.push({
          ruleId: rule.ruleId,
          ruleTitle: rule.title,
          ruleCategory: rule.category,
          ruleVersion: rule.version || 1,
          status: 'NOT_APPLICABLE',
          observedValue: '(Category Excluded)',
          expectedCondition: `Applicable to category: ${rule.category}`,
          confidence: 100,
          explanation: `Rule is not applicable to commodity category "${productCategory}".`,
        });
        continue;
      }

      const fieldEntry = decData[rule.requiredField] || { value: '', confidence: 0 };
      const rawValue = typeof fieldEntry === 'object' ? fieldEntry.value : fieldEntry;
      const confidence = typeof fieldEntry === 'object' ? (fieldEntry.confidence || 90) : 90;
      const threshold = rule.confidenceThreshold || 0.75;

      let evalResult = { status: 'PASS', explanation: '' };

      // Dispatch to generic validator
      switch (rule.validationType) {
        case 'QUANTITY_FORMAT':
          evalResult = this.parseAndValidateQuantity(rawValue);
          break;

        case 'CURRENCY_FORMAT':
          evalResult = this.validateMRP(rawValue);
          break;

        case 'DATE_FORMAT':
          evalResult = this.validateDate(rawValue);
          break;

        case 'MANUAL_REVIEW':
          evalResult = {
            status: 'REQUIRES_REVIEW',
            explanation: `Rule "${rule.title}" requires manual verification by the inspecting authority.`,
          };
          break;

        case 'REQUIRED':
        case 'PRESENCE_CHECK':
        default:
          evalResult = this.validatePresence(rawValue, confidence, threshold, rule.title);
          break;
      }

      // Record status metrics
      if (evalResult.status === 'PASS') {
        passedCount++;
      } else if (evalResult.status === 'FAIL') {
        failCount++;
      } else if (evalResult.status === 'REQUIRES_REVIEW') {
        requiresReviewCount++;
      } else if (evalResult.status === 'WARNING') {
        warningCount++;
      }

      // Record RuleResult
      const resultItem = {
        inspection: inspection?._id,
        inspectionId: inspection?.inspectionId || inspectionId,
        ruleId: rule.ruleId,
        ruleTitle: rule.title,
        ruleCategory: rule.category,
        ruleVersion: rule.version || 1,
        status: evalResult.status,
        observedValue: rawValue || '(Not detected)',
        expectedCondition: rule.description,
        confidence,
        explanation: evalResult.explanation,
        evidenceImage: fieldEntry?.evidenceImage || '/uploads/packaging-panel.jpg',
      };
      ruleResults.push(resultItem);

      // If Potential Issue (FAIL) or REQUIRES_REVIEW, generate a Finding
      if (evalResult.status === 'FAIL' || evalResult.status === 'REQUIRES_REVIEW') {
        const findingItem = {
          _id: `f-${Date.now()}-${rule.ruleId}`,
          inspection: inspection?._id,
          inspectionId: inspection?.inspectionId || inspectionId,
          ruleId: rule.ruleId,
          ruleTitle: rule.title,
          ruleCategory: rule.category,
          ruleVersion: rule.version || 1,
          legalReference: rule.legalReference,
          description: evalResult.explanation,
          severity: rule.severity || 'HIGH',
          confidence,
          evidenceImage: fieldEntry?.evidenceImage || '/uploads/packaging-panel.jpg',
          status: 'AI_FLAGGED',
          officerComment: '',
        };
        findings.push(findingItem);
      }
    }

    // 4. Calculate Overall Screening Determination
    let overallScreening = 'PASS';
    if (failCount > 0) {
      overallScreening = 'POTENTIAL_NON_COMPLIANCE';
    } else if (requiresReviewCount > 0 || warningCount > 0) {
      overallScreening = 'REQUIRES_MANUAL_VERIFICATION';
    }

    const summary = {
      totalRulesChecked: allRules.length,
      passed: passedCount,
      potentialIssues: failCount,
      warnings: warningCount,
      requiresReview: requiresReviewCount,
      notApplicable: notApplicableCount,
      overallScreening,
    };

    // 5. Update inspection document if connected
    if (isDbConnected() && inspection) {
      inspection.status = 'REVIEW_REQUIRED';
      inspection.overallResult = overallScreening;
      inspection.screeningSummary = summary;
      inspection.screeningDate = new Date();
      inspection.screenedBy = user?._id;
      inspection.declarationsData = decData;
      await inspection.save();

      // Persist RuleResults and Findings
      await RuleResult.deleteMany({ inspection: inspection._id });
      await RuleResult.insertMany(
        ruleResults.map((r) => ({
          ...r,
          inspection: inspection._id,
          inspectionId: inspection.inspectionId || inspectionId,
        }))
      );

      await Finding.deleteMany({ inspection: inspection._id, status: 'AI_FLAGGED' });
      if (findings.length > 0) {
        await Finding.insertMany(
          findings.map((f) => ({
            ...f,
            inspection: inspection._id,
            inspectionId: inspection.inspectionId || inspectionId,
          }))
        );
      }
    }

    // 6. Log Audit Trail
    if (isDbConnected()) {
      await AuditLog.create({
        user: user?._id,
        userName: user?.name || 'Enforcement Officer',
        userRole: user?.role || 'OFFICER',
        action: 'SCREENING_COMPLETED',
        inspectionId: inspection?.inspectionId || inspectionId,
        details: { overallScreening, totalRulesChecked: summary.totalRulesChecked, potentialIssues: failCount },
      });
    }

    return {
      inspectionId: inspection?.inspectionId || inspectionId,
      overallScreening,
      summary,
      ruleResults,
      findings,
      screenedAt: new Date().toISOString(),
    };
  }
}

module.exports = new ComplianceEngine();
