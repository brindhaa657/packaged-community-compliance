/**
 * Direct Image Upload & OCR Pipeline Live Test
 * Tests uploading image files to the running server, triggering OCR & AI extraction
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'legalmetrix_sih_super_secure_jwt_secret_key_2024_packaged_compliance';

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

async function testUploadAndOCR() {
  console.log('====================================================');
  console.log('📸 TESTING REAL IMAGE UPLOAD & OCR EXTRACTION PIPELINE');
  console.log('====================================================\n');

  const baseUrl = 'http://localhost:5000/api';

  // 1. Create a New Inspection Session
  console.log('1. Creating new inspection session...');
  const createRes = await fetch(`${baseUrl}/inspections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${officerToken}`,
    },
    body: JSON.stringify({
      productName: 'Aged Basmati Rice 1kg Pack',
      brand: 'ABC Foods',
      category: 'Food',
      storeName: 'HyperCity Supermarket, Chennai',
      inspectionType: 'SUPERMARKET',
    }),
  });

  const createData = await createRes.json();
  console.assert(createRes.ok, 'Failed to create inspection session');
  const inspectionId = createData.data.inspectionId || createData.data._id;
  console.log(`   ✓ Created Inspection: ${inspectionId}`);

  // 2. Upload actual image files using FormData
  console.log('\n2. Uploading 3 packaging panel photos (Front, Back, MRP Close-up)...');
  const frontPath = path.join(__dirname, '../../uploads/sample-rice-front.jpg');
  const backPath = path.join(__dirname, '../../uploads/sample-rice-back.jpg');
  const mrpPath = path.join(__dirname, '../../uploads/sample-rice-mrp.jpg');

  const formData = new FormData();
  formData.append('images', new Blob([fs.readFileSync(frontPath)], { type: 'image/jpeg' }), 'front-panel.jpg');
  formData.append('images', new Blob([fs.readFileSync(backPath)], { type: 'image/jpeg' }), 'back-panel.jpg');
  formData.append('images', new Blob([fs.readFileSync(mrpPath)], { type: 'image/jpeg' }), 'mrp-panel.jpg');
  formData.append('imageTypes', JSON.stringify(['FRONT', 'BACK', 'MRP_CLOSEUP']));

  const uploadRes = await fetch(`${baseUrl}/inspections/${inspectionId}/images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${officerToken}`,
    },
    body: formData,
  });

  const uploadData = await uploadRes.json();
  console.assert(uploadRes.ok, 'Failed to upload images');
  console.log(`   ✓ Uploaded ${uploadData.count || uploadData.data.length} images to session ${inspectionId}`);

  // 3. Process Product (Preprocessing -> OCR -> AI Extraction)
  console.log('\n3. Triggering [ PROCESS PRODUCT ] (Image Preprocessing -> OCR -> AI Structuring)...');
  const processRes = await fetch(`${baseUrl}/inspections/${inspectionId}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${officerToken}`,
    },
    body: JSON.stringify({ options: {} }),
  });

  const processData = await processRes.json();
  console.assert(processRes.ok, 'Failed to process product');
  console.log('   ✓ Extraction Status:', processData.data.status);
  console.log('   ✓ Extraction Version:', `v${processData.data.extractionVersion}`);

  // 4. Print Structured Declarations
  console.log('\n4. EXTRACTED STRUCTURED DECLARATIONS SUMMARY:');
  console.log('────────────────────────────────────────────────────');
  const decls = processData.data.declarations;
  Object.entries(decls).forEach(([key, field]) => {
    if (field.value) {
      console.log(`  • ${field.fieldLabel || key}: "${field.value}"`);
      console.log(`    Status: [${field.status}] | Confidence: ${Math.round((field.confidence || 0) * 100)}% | Source Image: ${field.sourceImageId || 'Linked'}`);
      if (field.boundingBox) {
        console.log(`    Bounding Box: { x: ${field.boundingBox.x}, y: ${field.boundingBox.y}, w: ${field.boundingBox.width}, h: ${field.boundingBox.height} }`);
      }
    }
  });
  console.log('────────────────────────────────────────────────────');

  // 5. Check OCR results
  const ocrRes = await fetch(`${baseUrl}/inspections/${inspectionId}/ocr`, {
    headers: { Authorization: `Bearer ${officerToken}` },
  });
  const ocrData = await ocrRes.json();
  console.log(`\n5. Verified OCR text blocks available across ${ocrData.data.length} image panels.`);

  console.log('\n====================================================');
  console.log(`🚀 WEBSITE TEST READY ON: http://localhost:5173/inspections/${inspectionId}/extraction-review`);
  console.log('====================================================');
}

testUploadAndOCR().catch((err) => console.error('Upload & OCR test error:', err));
