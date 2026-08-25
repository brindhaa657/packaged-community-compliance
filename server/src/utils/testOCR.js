const ocrService = require('../services/ocrService');
const path = require('path');

async function testRealOCR() {
  console.log('Testing Tesseract OCR Provider on real image:');
  const sampleImage = {
    _id: 'test-real-img',
    imageUrl: '/uploads/sample-rice-front.jpg',
    imageType: 'FRONT',
    originalName: 'custom-real-package.jpg'
  };

  const result = await ocrService.processImage(sampleImage);
  console.log('Provider:', ocrService.getProviderName());
  console.log('Raw text length:', result.rawText.length);
  console.log('Recognized blocks:', result.blocks.length);
  console.log('First 100 chars of text:\n', result.rawText.substring(0, 100));
}

testRealOCR().catch(console.error);
