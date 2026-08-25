/**
 * Phase 3 End-to-End API Routes Verification Script
 */

const express = require('express');
const request = require('http');

// Load environment variables
require('dotenv').config();

const app = require('../server');

async function testExtractionEndpoints() {
  console.log('\n========================================================');
  console.log('🌐 TESTING PHASE 3 API ROUTE INTEGRATION');
  console.log('========================================================\n');

  // Let's test using supertest or direct invocation of controllers
  const {
    processScanSession,
    getOCRResults,
    getDeclarations,
    updateDeclarationField,
    confirmExtraction,
    triggerRescan,
    loadSamplePackage,
  } = require('../controllers/extractionController');

  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
    }
  }

  // Mock Req / Res helpers
  const createMockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  try {
    // 1. Test loadSamplePackage
    console.log('🔹 1. Testing POST /api/inspections/sample-package...');
    const req1 = { user: { _id: 'test-officer-1', name: 'Officer Test', role: 'OFFICER' } };
    const res1 = createMockRes();
    await loadSamplePackage(req1, res1, (err) => { if (err) throw err; });

    assert(res1.statusCode === 201, 'Returns HTTP 201 Created');
    assert(res1.jsonData.success === true, 'Response indicates success');
    const inspectionId = res1.jsonData.data.inspectionId || res1.jsonData.data._id;
    assert(Boolean(inspectionId), `Sample inspection session created: ${inspectionId}`);

    // 2. Test processScanSession
    console.log('\n🔹 2. Testing POST /api/inspections/:id/process...');
    const req2 = {
      params: { id: inspectionId },
      body: { options: { isImported: false } },
      user: { _id: 'test-officer-1', name: 'Officer Test', role: 'OFFICER' },
    };
    const res2 = createMockRes();
    await processScanSession(req2, res2, (err) => { if (err) throw err; });

    assert(res2.statusCode === 200, 'Returns HTTP 200 OK');
    assert(res2.jsonData.success === true, 'Processing scan session succeeded');
    assert(Boolean(res2.jsonData.data.declarations), 'Returns structured declarations map');
    assert(res2.jsonData.data.extractionVersion === 1, 'Initial extraction version is 1');
    assert(res2.jsonData.data.declarations.productName.status === 'DETECTED', 'Product name is DETECTED');
    assert(res2.jsonData.data.declarations.importer.status === 'NOT_DETECTED', 'Missing importer is NOT_DETECTED');

    // 3. Test getDeclarations
    console.log('\n🔹 3. Testing GET /api/inspections/:id/declarations...');
    const req3 = { params: { id: inspectionId }, query: {} };
    const res3 = createMockRes();
    await getDeclarations(req3, res3, (err) => { if (err) throw err; });

    assert(res3.statusCode === 200, 'Returns HTTP 200 OK');
    assert(res3.jsonData.success === true, 'Fetches declaration list');
    assert(Array.isArray(res3.jsonData.data) && res3.jsonData.data.length > 0, 'Declarations returned as array');

    // 4. Test updateDeclarationField (Officer correction)
    console.log('\n🔹 4. Testing PATCH /api/declarations/:id (Officer edit)...');
    const targetDecl = res3.jsonData.data.find((d) => d.fieldName === 'mrp') || res3.jsonData.data[0];
    const targetDeclId = targetDecl._id || 'mrp';

    const req4 = {
      params: { id: targetDeclId },
      body: { fieldName: 'mrp', officerValue: '₹ 125.00', remarks: 'Physical package verified' },
      user: { _id: 'test-officer-1', name: 'Officer Test', role: 'OFFICER' },
    };
    const res4 = createMockRes();
    await updateDeclarationField(req4, res4, (err) => { if (err) throw err; });

    assert(res4.statusCode === 200, 'Returns HTTP 200 OK');
    assert(res4.jsonData.data.status === 'OFFICER_CORRECTED', 'Status updated to OFFICER_CORRECTED');
    assert(res4.jsonData.data.officerValue === '₹ 125.00', 'Officer value stored');

    // 5. Test triggerRescan
    console.log('\n🔹 5. Testing POST /api/inspections/:id/rescan...');
    const req5 = {
      params: { id: inspectionId },
      body: { reason: 'Need clearer MRP close-up' },
      user: { _id: 'test-officer-1', name: 'Officer Test', role: 'OFFICER' },
    };
    const res5 = createMockRes();
    await triggerRescan(req5, res5, (err) => { if (err) throw err; });

    assert(res5.statusCode === 200, 'Returns HTTP 200 OK');
    assert(res5.jsonData.success === true, 'Rescan initiated on existing session');

    // 6. Test confirmExtraction
    console.log('\n🔹 6. Testing POST /api/inspections/:id/confirm-extraction...');
    const req6 = {
      params: { id: inspectionId },
      body: { confirmedDeclarations: res2.jsonData.data.declarations },
      user: { _id: 'test-officer-1', name: 'Officer Test', role: 'OFFICER' },
    };
    const res6 = createMockRes();
    await confirmExtraction(req6, res6, (err) => { if (err) throw err; });

    assert(res6.statusCode === 200, 'Returns HTTP 200 OK');
    assert(res6.jsonData.success === true, 'Declarations confirmed by Officer');

    // Summary
    console.log('\n========================================================');
    console.log(`📊 API TEST SUMMARY: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
    console.log('========================================================\n');
  } catch (err) {
    console.error('API Test error:', err);
    process.exit(1);
  }
}

testExtractionEndpoints();
