const ComplianceRule = require('../models/ComplianceRule');
const { isDbConnected } = require('../config/db');
const { getRuleQuery } = require('../utils/queryHelper');

// In-memory fallback rules
let inMemoryRules = [
  {
    _id: 'rule-mem-1',
    ruleId: 'LMR-2011-R06-01',
    title: 'Mandatory Commodity Name Declaration',
    description: 'The name and generic identity of the commodity contained in the package must be prominently declared on the principal display panel.',
    category: 'MANDATORY_DECLARATIONS',
    requiredField: 'PRODUCT_NAME',
    validationType: 'PRESENCE_CHECK',
    severity: 'CRITICAL',
    legalReference: { ruleNumber: 'Rule 6(1)(a)', actName: 'Legal Metrology (Packaged Commodities) Rules, 2011' },
    active: true,
  },
  {
    _id: 'rule-mem-2',
    ruleId: 'LMR-2011-R06-02',
    title: 'Manufacturer / Packer Complete Name and Address',
    description: 'The name and complete physical address of the manufacturer or packer must be stated clearly.',
    category: 'MANUFACTURER_PACKER_IDENTITY',
    requiredField: 'MANUFACTURER_NAME_ADDRESS',
    validationType: 'PRESENCE_CHECK',
    severity: 'HIGH',
    legalReference: { ruleNumber: 'Rule 6(1)(b)', actName: 'Legal Metrology (Packaged Commodities) Rules, 2011' },
    active: true,
  },
  {
    _id: 'rule-mem-3',
    ruleId: 'LMR-2011-R06-03',
    title: 'Net Quantity in Standard Units of Weights & Measures',
    description: 'Net quantity must be declared in standard SI metric units (g, kg, ml, l, m, number) using correct casing and symbols.',
    category: 'NET_QUANTITY_UNITS',
    requiredField: 'NET_QUANTITY',
    validationType: 'UNIT_VERIFICATION',
    severity: 'CRITICAL',
    legalReference: { ruleNumber: 'Rule 6(1)(c) & Rule 12', actName: 'Legal Metrology (Packaged Commodities) Rules, 2011' },
    active: true,
  },
  {
    _id: 'rule-mem-4',
    ruleId: 'LMR-2011-R06-04',
    title: 'Maximum Retail Price (MRP) Inclusive of All Taxes',
    description: 'MRP must be declared clearly with the phrase "Maximum or Max. Retail Price ... incl. of all taxes" or "MRP Rs. ... incl. of all taxes".',
    category: 'MRP_AND_PRICING',
    requiredField: 'MAXIMUM_RETAIL_PRICE_MRP',
    validationType: 'REGEX_PATTERN',
    severity: 'CRITICAL',
    legalReference: { ruleNumber: 'Rule 6(1)(e)', actName: 'Legal Metrology (Packaged Commodities) Rules, 2011' },
    active: true,
  },
  {
    _id: 'rule-mem-5',
    ruleId: 'LMR-2011-R06-05',
    title: 'Month and Year of Manufacture / Packing',
    description: 'The month and year in which the commodity is manufactured, packed or pre-packed must be declared prominently.',
    category: 'MANDATORY_DECLARATIONS',
    requiredField: 'DATE_OF_MANUFACTURE_PACKING_IMPORT',
    validationType: 'PRESENCE_CHECK',
    severity: 'HIGH',
    legalReference: { ruleNumber: 'Rule 6(1)(d)', actName: 'Legal Metrology (Packaged Commodities) Rules, 2011' },
    active: true,
  },
  {
    _id: 'rule-mem-6',
    ruleId: 'LMR-2011-R06-06',
    title: 'Consumer Care Cell Details',
    description: 'Name, address, telephone number and email address of the person/office who can be contacted in case of consumer complaints.',
    category: 'CONSUMER_CARE',
    requiredField: 'CONSUMER_CARE_DETAILS',
    validationType: 'PRESENCE_CHECK',
    severity: 'HIGH',
    legalReference: { ruleNumber: 'Rule 6(1)(n)', actName: 'Legal Metrology (Packaged Commodities) Rules, 2011' },
    active: true,
  },
  {
    _id: 'rule-mem-7',
    ruleId: 'LMR-2011-R06-07',
    title: 'Country of Origin Declaration for Imported Goods',
    description: 'Country of origin or manufacturer must be clearly stated on all packages, particularly imported commodities.',
    category: 'COUNTRY_OF_ORIGIN',
    requiredField: 'COUNTRY_OF_ORIGIN',
    validationType: 'PRESENCE_CHECK',
    severity: 'HIGH',
    legalReference: { ruleNumber: 'Rule 6(10) & 2017 Amendment', actName: 'Legal Metrology (Packaged Commodities) Rules, 2011' },
    active: true,
  },
];

const getRules = async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const rules = await ComplianceRule.find();
      return res.status(200).json({ success: true, data: rules });
    }
    return res.status(200).json({ success: true, data: inMemoryRules });
  } catch (error) {
    next(error);
  }
};

const createRule = async (req, res, next) => {
  try {
    const { ruleId, title, description, category, requiredField, validationType, severity, legalReference } = req.body;

    if (isDbConnected()) {
      const rule = await ComplianceRule.create(req.body);
      return res.status(201).json({ success: true, data: rule });
    }

    const newRule = {
      _id: `rule-mem-${Date.now()}`,
      ruleId: ruleId || `LMR-CUSTOM-${Date.now()}`,
      title,
      description,
      category: category || 'MANDATORY_DECLARATIONS',
      requiredField: requiredField || 'OTHER_MANDATORY_INFO',
      validationType: validationType || 'PRESENCE_CHECK',
      severity: severity || 'HIGH',
      legalReference: legalReference || { ruleNumber: 'Custom Rule', actName: 'Legal Metrology Rules 2011' },
      active: true,
    };
    inMemoryRules.push(newRule);
    return res.status(201).json({ success: true, data: newRule });
  } catch (error) {
    next(error);
  }
};

const toggleRuleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const rule = await ComplianceRule.findOne(getRuleQuery(id));
      if (rule) {
        rule.active = !rule.active;
        await rule.save();
        return res.status(200).json({ success: true, data: rule });
      }
    }

    const memRule = inMemoryRules.find((r) => r._id === id || r.ruleId === id);
    if (memRule) {
      memRule.active = !memRule.active;
      return res.status(200).json({ success: true, data: memRule });
    }

    res.status(404).json({ success: false, message: 'Rule not found' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRules,
  createRule,
  toggleRuleStatus,
};
