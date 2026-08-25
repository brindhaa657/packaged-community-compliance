/**
 * Google Gemini Vision AI Service for Legal Metrology Declaration Extraction
 * Uses Multimodal Gemini 1.5 Flash to accurately extract all printed statutory declarations
 * directly from packaging camera photos (handles reflections, curved bottles, dot-matrix stamps).
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class GeminiVisionService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey !== 'mock_key' && this.apiKey.length > 10);
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Helper to convert local image file to generative part
   */
  fileToGenerativePart(filePath, mimeType = 'image/jpeg') {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
        mimeType,
      },
    };
  }

  /**
   * Extract all 21 statutory declarations from scanned packaging images using Gemini Multimodal Vision
   * @param {Array<Object>} imageRecords - Array of image info { imageUrl, imageType, _id }
   * @param {Object} productContext - Optional context { productName, brand, storeName }
   * @returns {Promise<Object|null>} Structured declarations extracted by Gemini Vision
   */
  async extractDeclarations(imageRecords = [], productContext = {}) {
    if (!this.isConfigured() || !imageRecords.length) {
      return null;
    }

    try {
      console.log(`[Gemini Vision AI] Initializing Multimodal Analysis on ${imageRecords.length} package image(s)...`);
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Prepare image parts
      const imageParts = [];
      for (const img of imageRecords) {
        const originalUrl = img.imageUrl || img.originalUrl || '';
        let diskPath = null;
        if (originalUrl.startsWith('/uploads/')) {
          diskPath = path.join(__dirname, '../../', originalUrl);
        } else if (originalUrl.startsWith('uploads/')) {
          diskPath = path.join(__dirname, '../../', originalUrl);
        }

        if (diskPath && fs.existsSync(diskPath)) {
          const ext = path.extname(diskPath).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          imageParts.push(this.fileToGenerativePart(diskPath, mimeType));
        }
      }

      if (imageParts.length === 0) {
        console.warn('[Gemini Vision AI] No valid local image files found on disk.');
        return null;
      }

      const prompt = `
You are an expert Legal Metrology Enforcement Officer inspecting packaged commodity images under the Legal Metrology (Packaged Commodities) Rules, 2011 (India).

Inspect the provided packaging photos carefully and extract all mandatory statutory declarations printed on the product label.

Return ONLY a valid JSON object matching this exact schema (do not include markdown ticks, just raw JSON):
{
  "productName": { "value": string or null, "confidence": number between 0 and 1 },
  "brand": { "value": string or null, "confidence": number between 0 and 1 },
  "manufacturer": { "value": string or null, "confidence": number between 0 and 1 },
  "manufacturerAddress": { "value": string or null, "confidence": number between 0 and 1 },
  "packer": { "value": string or null, "confidence": number between 0 and 1 },
  "packerAddress": { "value": string or null, "confidence": number between 0 and 1 },
  "importer": { "value": string or null, "confidence": number between 0 and 1 },
  "importerAddress": { "value": string or null, "confidence": number between 0 and 1 },
  "countryOfOrigin": { "value": string or null, "confidence": number between 0 and 1 },
  "netQuantity": { "value": string or null, "confidence": number between 0 and 1 },
  "mrp": { "value": string or null, "confidence": number between 0 and 1 },
  "unitSalePrice": { "value": string or null, "confidence": number between 0 and 1 },
  "manufacturingDate": { "value": string or null, "confidence": number between 0 and 1 },
  "packingDate": { "value": string or null, "confidence": number between 0 and 1 },
  "expiryDate": { "value": string or null, "confidence": number between 0 and 1 },
  "consumerCare": { "value": string or null, "confidence": number between 0 and 1 },
  "email": { "value": string or null, "confidence": number between 0 and 1 },
  "website": { "value": string or null, "confidence": number between 0 and 1 },
  "batchNumber": { "value": string or null, "confidence": number between 0 and 1 },
  "importDate": { "value": string or null, "confidence": number between 0 and 1 },
  "otherDeclarations": { "value": string or null, "confidence": number between 0 and 1 }
}

Extraction Guidelines:
1. Product Name: The specific commodity name (e.g., "Goodknight Gold Flash Liquid Vaporiser", "Sensodyne Rapid Action Toothpaste").
2. Brand: The primary trade mark (e.g., "Goodknight", "Sensodyne", "Godrej").
3. Net Quantity: The net volume or weight (e.g. "45 ml", "80 g", "100 g", "1 kg").
4. MRP: The maximum retail price including currency symbol (e.g., "₹85.00", "₹187.00").
5. Unit Sale Price: Price per unit/g/ml (e.g., "₹1.88 / ml", "₹2.34 / g").
6. Dates: Extract exact MM/YYYY or DD/MM/YYYY printed for Mfg Date, Expiry Date, or Use By.
7. Batch Number: Look for B.No / Lot / Batch / Inkjet stamp (e.g., "BGR250328", "84:55").
8. Consumer Care: Look for toll-free phone number, email (e.g. "care@godrejcp.com", "mystory.in@haleon.com"), and address.
9. Manufacturer: Company name and registered premises (e.g., "Godrej Consumer Products Ltd", "Haleon group of companies").
10. If a field is not printed or not visible on the provided photos, set value to null and confidence to 0.50.
`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text();
      
      // Clean potential markdown wrap
      let cleanJsonText = responseText.trim();
      if (cleanJsonText.startsWith('```json')) {
        cleanJsonText = cleanJsonText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanJsonText.startsWith('```')) {
        cleanJsonText = cleanJsonText.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsedData = JSON.parse(cleanJsonText);
      console.log('[Gemini Vision AI] Successfully extracted structured declarations via Gemini Vision!');
      return parsedData;
    } catch (err) {
      console.error('[Gemini Vision AI Error]:', err.message);
      return null;
    }
  }
}

module.exports = new GeminiVisionService();
