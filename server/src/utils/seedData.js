require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const ComplianceRule = require('../models/ComplianceRule');

const seedData = async () => {
  console.log('[Seed] Initializing LegalMetrix foundational data...');
  await connectDB();

  try {
    // 1. Seed Users
    const demoUsers = [
      {
        name: 'Rajesh Sharma (Admin)',
        email: 'admin@legalmetrix.gov.in',
        password: 'Admin@123',
        role: 'ADMIN',
        badgeNumber: 'LM-ADM-001',
        jurisdiction: 'National Headquarters - New Delhi',
      },
      {
        name: 'Inspector Vikram Singh',
        email: 'officer@legalmetrix.gov.in',
        password: 'Officer@123',
        role: 'OFFICER',
        badgeNumber: 'LM-OFF-742',
        jurisdiction: 'Delhi NCR Enforcement Division',
      },
      {
        name: 'Dr. Ananya Iyer (Supervisor)',
        email: 'supervisor@legalmetrix.gov.in',
        password: 'Supervisor@123',
        role: 'SUPERVISOR',
        badgeNumber: 'LM-SUP-108',
        jurisdiction: 'Northern Regional Zone',
      },
    ];

    for (const u of demoUsers) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        await User.create(u);
        console.log(`[Seed User] Created: ${u.email} (${u.role})`);
      } else {
        user.password = u.password;
        await user.save();
        console.log(`[Seed User] Synced: ${u.email}`);
      }
    }

    // 2. Seed Initial Legal Metrology (Packaged Commodities) Rules, 2011
    const rules = [
      {
        ruleId: 'LMR-2011-R06-01',
        title: 'Mandatory Commodity Name Declaration',
        description: 'The name and generic identity of the commodity contained in the package must be prominently declared on the principal display panel.',
        category: 'MANDATORY_DECLARATIONS',
        requiredField: 'PRODUCT_NAME',
        validationType: 'PRESENCE_CHECK',
        severity: 'CRITICAL',
        legalReference: 'Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011',
      },
      {
        ruleId: 'LMR-2011-R06-02',
        title: 'Manufacturer / Packer Complete Name and Address',
        description: 'The name and complete physical address of the manufacturer or packer must be stated clearly.',
        category: 'MANUFACTURER_PACKER_IDENTITY',
        requiredField: 'MANUFACTURER_NAME_ADDRESS',
        validationType: 'PRESENCE_CHECK',
        severity: 'HIGH',
        legalReference: 'Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
      },
      {
        ruleId: 'LMR-2011-R06-03',
        title: 'Net Quantity in Standard Units of Weights & Measures',
        description: 'Net quantity must be declared in standard SI metric units (g, kg, ml, l, m, number) using correct casing and symbols.',
        category: 'NET_QUANTITY_UNITS',
        requiredField: 'NET_QUANTITY',
        validationType: 'UNIT_VERIFICATION',
        validationParameters: {
          expectedUnits: ['g', 'kg', 'ml', 'l', 'L', 'm', 'cm', 'N', 'U'],
        },
        severity: 'CRITICAL',
        legalReference: 'Rule 6(1)(c) & Rule 12, Legal Metrology (Packaged Commodities) Rules, 2011',
      },
      {
        ruleId: 'LMR-2011-R06-04',
        title: 'Maximum Retail Price (MRP) Inclusive of All Taxes',
        description: 'MRP must be declared clearly with the phrase "Maximum or Max. Retail Price ... incl. of all taxes" or "MRP Rs. ... incl. of all taxes".',
        category: 'MRP_AND_PRICING',
        requiredField: 'MAXIMUM_RETAIL_PRICE_MRP',
        validationType: 'REGEX_PATTERN',
        severity: 'CRITICAL',
        legalReference: 'Rule 6(1)(e), Legal Metrology (Packaged Commodities) Rules, 2011',
      },
      {
        ruleId: 'LMR-2011-R06-05',
        title: 'Month and Year of Manufacture / Packing',
        description: 'The month and year in which the commodity is manufactured, packed or pre-packed must be declared prominently.',
        category: 'MANDATORY_DECLARATIONS',
        requiredField: 'DATE_OF_MANUFACTURE_PACKING_IMPORT',
        validationType: 'PRESENCE_CHECK',
        severity: 'HIGH',
        legalReference: 'Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011',
      },
      {
        ruleId: 'LMR-2011-R06-06',
        title: 'Consumer Care Cell Details',
        description: 'Name, address, telephone number and email address of the person/office who can be contacted in case of consumer complaints.',
        category: 'CONSUMER_CARE',
        requiredField: 'CONSUMER_CARE_DETAILS',
        validationType: 'PRESENCE_CHECK',
        severity: 'HIGH',
        legalReference: 'Rule 6(1)(n), Legal Metrology (Packaged Commodities) Rules, 2011',
      },
      {
        ruleId: 'LMR-2011-R06-07',
        title: 'Country of Origin Declaration for Imported Goods',
        description: 'Country of origin or manufacturer must be clearly stated on all packages, particularly imported commodities.',
        category: 'COUNTRY_OF_ORIGIN',
        requiredField: 'COUNTRY_OF_ORIGIN',
        validationType: 'PRESENCE_CHECK',
        severity: 'HIGH',
        legalReference: 'Rule 6(10) & 2017 Amendment, Legal Metrology (Packaged Commodities) Rules, 2011',
      },
    ];

    for (const r of rules) {
      await ComplianceRule.findOneAndUpdate({ ruleId: r.ruleId }, r, { upsert: true, new: true });
      console.log(`[Seed Rule] Configured rule: ${r.ruleId} - ${r.title}`);
    }

    console.log('[Seed] Foundational setup complete.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
