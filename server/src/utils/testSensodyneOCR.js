const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

async function testSensodyneImages() {
  const images = [
    'pkg-1787633672350-323784391.jpeg',
    'pkg-1787633672361-851997220.jpeg',
    'pkg-1787633672373-114912222.jpeg'
  ];

  for (const imgName of images) {
    const filePath = path.join(__dirname, '../../uploads', imgName);
    console.log(`\n========================================`);
    console.log(`Processing file: ${imgName} (exists: ${fs.existsSync(filePath)})`);
    console.log(`========================================`);
    if (fs.existsSync(filePath)) {
      const res = await Tesseract.recognize(filePath, 'eng');
      console.log('RECOGNIZED TEXT:\n');
      console.log(res.data.text);
    }
  }
}

testSensodyneImages().catch(console.error);
