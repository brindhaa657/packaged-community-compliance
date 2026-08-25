const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

async function testGoodKnightImages() {
  const images = [
    'pkg-1787637324054-39690273.jpeg',
    'pkg-1787637324055-527729065.jpeg',
    'pkg-1787637324058-956588802.jpeg',
    'pkg-1787637324059-76527044.jpeg'
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

testGoodKnightImages().catch(console.error);
