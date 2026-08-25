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

async function reprocess() {
  const inspectionId = 'INSP-MT86XL7I-307';
  console.log(`Triggering real OCR re-processing for ${inspectionId}...`);

  const res = await fetch(`http://localhost:5000/api/inspections/${inspectionId}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${officerToken}`,
    },
    body: JSON.stringify({ options: {} }),
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Provider:', data.data?.ocrResults?.[0]?.provider);
  console.log('\n--- EXTRACTED DECLARATIONS ---');
  Object.entries(data.data?.declarations || {}).forEach(([k, v]) => {
    if (v.value) {
      console.log(`${k} (${v.fieldLabel}): ${v.value} [${v.status}] (conf: ${Math.round((v.confidence||0)*100)}%)`);
    }
  });
}

reprocess().catch(console.error);
