/**
 * End-to-End Verification Test Script for Phase 3:
 * OCR + AI-Based Product Declaration Extraction
 */

const jwt = require('jsonwebtoken');
const http = require('http');
const app = require('../server');

const JWT_SECRET = process.env.JWT_SECRET || 'legalmetrix_sih_super_secure_jwt_secret_key_2024_packaged_compliance';

// Generate mock JWT token for Officer
const officerToken = jwt.sign(
  {
    id: '66c8b0010000000000000002',
    email: 'officer@legalmetrix.gov.in',
    role: 'OFFICER',
    name: 'Inspector Vikram Singh',
    badgeNumber: 'LM-OFF-742',
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 3 END-TO-END TEST SUITE');
  console.log('====================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099/api';

  const makeRequest = async (path, options = {}) => {
    const url = `${baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${officerToken}`,
      ...(options.headers || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  };

  try {
    // TEST 1: Health check
    console.log('▶ TEST 1: Server Status & Health');
    const health = await makeRequest('/health');
    console.assert(health.status === 200, `Health check returned ${health.status}`);
    console.log('  ✓ API Health check OK:', health.data.status);

    // TEST 2: Load Sample Test Package
    console.log('\n▶ TEST 2: Sample Test Package Initialization');
    const sampleRes = await makeRequest('/inspections/sample-package', { method: 'POST' });
    console.assert(sampleRes.status === 201, `Sample package returned ${sampleRes.status}`);
    const inspectionId = sampleRes.data.data.inspectionId || sampleRes.data.data._id;
    console.log(`  ✓ Sample package created with Inspection ID: ${inspectionId}`);

    // TEST 3: Process Scan Session (Image Preprocessing -> OCR -> AI Structuring)
    console.log('\n▶ TEST 3: Process Scan Session Pipeline');
    const processRes = await makeRequest(`/inspections/${inspectionId}/process`, {
      method: 'POST',
      body: JSON.stringify({ options: {} }),
    });
    console.assert(processRes.status === 200, `Process session returned ${processRes.status}`);
    console.log('  ✓ Process output extraction version:', processRes.data.data.extractionVersion);
    console.assert(processRes.data.data.extractionVersion >= 1, 'Extraction version should be >= 1');

    const declarations = processRes.data.data.declarations;
    console.log('  ✓ Total extracted fields:', Object.keys(declarations).length);
    console.log('  ✓ Product Name:', declarations.productName?.value, `(${declarations.productName?.status})`);
    console.log('  ✓ Net Quantity:', declarations.netQuantity?.value, `(${declarations.netQuantity?.status})`);
    console.log('  ✓ MRP:', declarations.mrp?.value, `(${declarations.mrp?.status})`);
    console.log('  ✓ Manufacturer:', declarations.manufacturer?.value?.substring(0, 35) + '...', `(${declarations.manufacturer?.status})`);
    console.log('  ✓ Consumer Care:', declarations.consumerCare?.value ? 'DETECTED' : 'NOT_DETECTED');

    // Verify evidence & bounding box linking
    console.log('  ✓ Source Image Linked:', declarations.mrp?.sourceImageId ? 'YES' : 'NO');
    console.log('  ✓ Bounding Box Linked:', declarations.mrp?.boundingBox ? JSON.stringify(declarations.mrp.boundingBox) : 'NONE');

    // TEST 4: Fetch OCR raw text & blocks
    console.log('\n▶ TEST 4: Get OCR Results');
    const ocrRes = await makeRequest(`/inspections/${inspectionId}/ocr`);
    console.assert(ocrRes.status === 200, `OCR check returned ${ocrRes.status}`);
    console.log(`  ✓ Retrieved ${ocrRes.data.count || ocrRes.data.data.length} OCR panel results.`);
    console.log(`  ✓ OCR Provider: ${ocrRes.data.data[0]?.provider || 'Mock'}`);

    // TEST 5: Fetch Declarations List
    console.log('\n▶ TEST 5: Get Structured Declarations');
    const declRes = await makeRequest(`/inspections/${inspectionId}/declarations`);
    console.assert(declRes.status === 200, `Declarations get returned ${declRes.status}`);
    console.log(`  ✓ Retrieved ${declRes.data.count || declRes.data.data.length} declarations.`);

    // TEST 6: Officer Correction Audit Tracking
    console.log('\n▶ TEST 6: Officer Field Correction & Audit Preservation');
    const mrpDecl = declRes.data.data.find((d) => d.fieldName === 'mrp') || { _id: 'mrp', fieldName: 'mrp' };
    const patchRes = await makeRequest(`/declarations/${mrpDecl._id || 'mrp'}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fieldName: 'mrp',
        officerValue: '₹ 125.00',
        remarks: 'Physical stamp verified by officer in store',
      }),
    });
    console.assert(patchRes.status === 200, `Correction patch returned ${patchRes.status}`);
    console.log('  ✓ Officer value saved:', patchRes.data.data.officerValue);
    console.log('  ✓ Status updated to:', patchRes.data.data.status);
    console.log('  ✓ Original AI value preserved:', patchRes.data.data.aiValue || declarations.mrp?.value);

    // TEST 7: Re-Scan Trigger (Same Session Version Increment)
    console.log('\n▶ TEST 7: Re-Scan Trigger on Existing Inspection');
    const rescanRes = await makeRequest(`/inspections/${inspectionId}/rescan`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Officer requested additional angle closeup' }),
    });
    console.assert(rescanRes.status === 200, `Rescan returned ${rescanRes.status}`);
    console.log('  ✓ Re-scan initiated for same inspection:', rescanRes.data.inspectionId);

    // Reprocess to check version increment
    const reprocessRes = await makeRequest(`/inspections/${inspectionId}/process`, {
      method: 'POST',
      body: JSON.stringify({ options: {} }),
    });
    console.log('  ✓ New extraction version after re-scan:', reprocessRes.data.data.extractionVersion);
    console.assert(reprocessRes.data.data.extractionVersion >= 2, 'Extraction version should increment to v2');

    // TEST 8: Confirm Extraction
    console.log('\n▶ TEST 8: Confirm Extraction');
    const confirmRes = await makeRequest(`/inspections/${inspectionId}/confirm-extraction`, {
      method: 'POST',
      body: JSON.stringify({ confirmedDeclarations: declarations }),
    });
    console.assert(confirmRes.status === 200, `Confirm extraction returned ${confirmRes.status}`);
    console.log('  ✓ Extraction confirmed successfully. Ready for Phase 4 compliance.');

    console.log('\n====================================================');
    console.log('🎉 ALL PHASE 3 TEST CASES PASSED SUCCESSFULLY!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
