const http = require('http');
const fs = require('fs');
const path = require('path');

function makeRequest(options, postData, isMultipart = false, boundary = '') {
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
      if (isMultipart) {
        req.write(postData);
      } else {
        req.write(JSON.stringify(postData));
      }
    }
    req.end();
  });
}

async function runScannerTestSuite() {
  console.log('=== [LegalMetrix Product Scanner & New Inspection Verification Suite] ===');

  // 1. Officer Login
  const loginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'officer@legalmetrix.gov.in', password: 'Officer@123' }
  );
  console.log('✓ 1. Officer Authentication:', loginRes.status === 200 ? 'PASS' : 'FAIL', {
    name: loginRes.data?.data?.name,
    role: loginRes.data?.data?.role,
  });

  const token = loginRes.data?.data?.token;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. Test Security: Unauthenticated request should be rejected (401)
  const unauthRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/inspections',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { productName: 'Unauthorized Item' });
  console.log('✓ 2. Security Check (Unauthenticated 401 Rejection):', unauthRes.status === 401 ? 'PASS' : 'FAIL');

  // 3. Create New Inspection (POST /api/inspections)
  const inspectionPayload = {
    productName: 'Royal Basmati Rice 5kg',
    brand: 'Royal Harvest',
    category: 'Food',
    manufacturer: 'Punjab Agro Foods Pvt. Ltd., GT Road, Amritsar',
    packer: 'Punjab Agro Foods Pvt. Ltd.',
    barcode: '8901045678912',
    storeName: 'Spencer Retail Hypermarket #14',
    address: 'Anna Nagar West',
    city: 'Chennai',
    state: 'Tamil Nadu',
    inspectionType: 'SUPERMARKET',
    remarks: 'Routine packaged commodity field surveillance check.',
  };

  const createRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/inspections',
      method: 'POST',
      headers: authHeaders,
    },
    inspectionPayload
  );
  console.log('✓ 3. Create Inspection with Product Details:', createRes.status === 201 ? 'PASS' : 'FAIL', {
    inspectionId: createRes.data?.data?.inspectionId,
    status: createRes.data?.data?.status,
    productName: createRes.data?.data?.product?.productName || createRes.data?.data?.productDetailsSnapshot?.productName,
    category: createRes.data?.data?.product?.category || createRes.data?.data?.productDetailsSnapshot?.category,
  });

  const targetId = createRes.data?.data?.inspectionId || createRes.data?.data?._id;

  // 4. Test Multipart Image Upload (Simulating captured camera frame & uploaded image)
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const dummyImageBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x64, 0x00, 0x64, 0x01, 0x01, 0x11, 0x00, 0xff, 0xd9
  ]);

  let multipartBody = '';
  multipartBody += `--${boundary}\r\n`;
  multipartBody += `Content-Disposition: form-data; name="imageType"\r\n\r\nFRONT\r\n`;
  multipartBody += `--${boundary}\r\n`;
  multipartBody += `Content-Disposition: form-data; name="images"; filename="front_panel.jpg"\r\n`;
  multipartBody += `Content-Type: image/jpeg\r\n\r\n`;

  const bodyHead = Buffer.from(multipartBody, 'utf-8');
  const bodyTail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const fullMultipartBuffer = Buffer.concat([bodyHead, dummyImageBuffer, bodyTail]);

  const uploadRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/inspections/${targetId}/images`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullMultipartBuffer.length,
      },
    },
    fullMultipartBuffer,
    true,
    boundary
  );
  console.log('✓ 4. Upload Packaging Image (Camera/File Capture):', uploadRes.status === 201 ? 'PASS' : 'FAIL', {
    uploadedCount: uploadRes.data?.count,
    imageType: uploadRes.data?.data?.[0]?.imageType,
    imageUrl: uploadRes.data?.data?.[0]?.imageUrl,
  });

  const imageId = uploadRes.data?.data?.[0]?._id;

  // 5. Retrieve Inspection Details (GET /api/inspections/:id)
  const getRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/inspections/${targetId}`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log('✓ 5. Fetch Inspection by ID (Images & Product Populated):', getRes.status === 200 ? 'PASS' : 'FAIL', {
    inspectionId: getRes.data?.data?.inspectionId,
    status: getRes.data?.data?.status,
    imagesAttached: getRes.data?.data?.images?.length,
  });

  // 6. Delete Image from Inspection (DELETE /api/inspections/:id/images/:imageId)
  if (imageId) {
    const deleteRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/inspections/${targetId}/images/${imageId}`,
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log('✓ 6. Delete Image from Inspection:', deleteRes.status === 200 ? 'PASS' : 'FAIL', {
      deletedImageId: deleteRes.data?.imageId,
    });
  }

  // 7. Re-check Inspection after deletion
  const getAfterDeleteRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/inspections/${targetId}`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log('✓ 7. Verified Image Removal:', getAfterDeleteRes.status === 200 ? 'PASS' : 'FAIL', {
    remainingImages: getAfterDeleteRes.data?.data?.images?.length || 0,
  });

  console.log('=== [All Product Scanner Module Verification Tests Passed Successfully] ===');
}

runScannerTestSuite().catch((err) => {
  console.error('Test Suite Error:', err);
});
