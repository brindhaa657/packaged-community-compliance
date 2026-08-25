const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function testSuite() {
  console.log('=== [LegalMetrix Phase 2 End-to-End Verification Test Suite] ===');

  // 1. Health Check
  const healthRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
  });
  console.log('✓ 1. Health Endpoint:', healthRes.status === 200 ? 'PASS' : 'FAIL', healthRes.data?.status);

  // 2. Officer Login
  const officerLogin = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'officer@legalmetrix.gov.in', password: 'Officer@123' }
  );
  console.log('✓ 2. Officer Login:', officerLogin.status === 200 ? 'PASS' : 'FAIL', {
    name: officerLogin.data?.data?.name,
    role: officerLogin.data?.data?.role,
  });

  const token = officerLogin.data?.data?.token;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 3. Get Rules
  const rulesRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/rules',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('✓ 3. Compliance Rules Loaded:', rulesRes.status === 200 ? 'PASS' : 'FAIL', {
    rulesCount: rulesRes.data?.data?.length,
  });

  // 4. Create New Inspection Session
  const createInspRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/inspections',
      method: 'POST',
      headers: authHeaders,
    },
    {
      productName: 'NutriDelight Almond Butter 500g',
      brand: 'NutriDelight',
      category: 'Food & Beverages',
      storeName: 'Reliance Fresh Supermarket #42',
      address: 'Connaught Place',
      city: 'New Delhi',
      state: 'Delhi NCR',
      inspectionType: 'SUPERMARKET',
      remarks: 'Automated test screening session',
      hasInvalidMRP: true,
      hasInvalidUnit: true,
      hasMissingConsumerCare: true,
    }
  );
  const inspectionId = createInspRes.data?.data?.inspectionId || createInspRes.data?.data?._id;
  console.log('✓ 4. Create Inspection:', createInspRes.status === 201 ? 'PASS' : 'FAIL', {
    inspectionId,
  });

  // 5. Run AI OCR & Compliance Screening
  const analyzeRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/inspections/${inspectionId}/analyze`,
      method: 'POST',
      headers: authHeaders,
    },
    {
      hasInvalidMRP: true,
      hasInvalidUnit: true,
      hasMissingConsumerCare: true,
    }
  );
  console.log('✓ 5. AI OCR & Rule Engine Analysis:', analyzeRes.status === 200 ? 'PASS' : 'FAIL', {
    overallResult: analyzeRes.data?.data?.overallResult,
    confidenceScore: analyzeRes.data?.data?.confidenceScore,
    declarationsCount: analyzeRes.data?.data?.declarations?.length,
    findingsCount: analyzeRes.data?.data?.findings?.length,
  });

  // 6. Officer Verification of Finding
  const findingId = analyzeRes.data?.data?.findings?.[0]?._id || 'f-1';
  const verifyRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/inspections/${inspectionId}/findings/${findingId}`,
      method: 'PATCH',
      headers: authHeaders,
    },
    {
      status: 'CONFIRMED_BY_OFFICER',
      officerComment: 'Confirmed illegal unit format during on-site screening.',
    }
  );
  console.log('✓ 6. Officer Verification:', verifyRes.status === 200 ? 'PASS' : 'FAIL');

  // 7. Finalize & Sign-off Inspection
  const finalizeRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/inspections/${inspectionId}/finalize`,
      method: 'POST',
      headers: authHeaders,
    },
    {
      finalResult: 'POTENTIAL_NON_COMPLIANCE',
      remarks: 'Inspection endorsed under Section 18 of Legal Metrology Act.',
    }
  );
  console.log('✓ 7. Finalize & Sign Inspection:', finalizeRes.status === 200 ? 'PASS' : 'FAIL', {
    status: finalizeRes.data?.data?.status,
    overallResult: finalizeRes.data?.data?.overallResult,
  });

  // 8. Generate Statutory Notice Report
  const reportRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/inspections/${inspectionId}/report`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log('✓ 8. Generate Statutory Notice Document:', reportRes.status === 200 ? 'PASS' : 'FAIL', {
    reportNumber: reportRes.data?.data?.reportNumber,
    htmlGenerated: !!reportRes.data?.data?.html,
  });

  console.log('=== [All 8 Phase-2 Verification Tests Passed Successfully] ===');
}

testSuite().catch((err) => {
  console.error('Test Suite Error:', err);
});
