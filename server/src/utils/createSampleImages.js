/**
 * Sample Image Generator for Phase 3 Testing
 * Generates realistic SVG-based packaging panel mockups saved as sample images
 */

const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../../uploads');
const processedDir = path.join(uploadsDir, 'processed');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir, { recursive: true });

// 1. Front Panel SVG
const frontSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <linearGradient id="frontBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b2545" />
      <stop offset="50%" stop-color="#134074" />
      <stop offset="100%" stop-color="#0b2545" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>
  
  <!-- Background Bag -->
  <rect x="20" y="20" width="760" height="960" rx="30" fill="url(#frontBg)" stroke="#f59e0b" stroke-width="6"/>
  
  <!-- Border Ribbon -->
  <rect x="40" y="40" width="720" height="920" rx="20" fill="none" stroke="#60a5fa" stroke-width="2" stroke-dasharray="10 5"/>
  
  <!-- Brand Name -->
  <text x="400" y="140" font-family="Arial, sans-serif" font-size="54" font-weight="900" fill="url(#gold)" text-anchor="middle" letter-spacing="4">ABC FOODS</text>
  <text x="400" y="180" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#93c5fd" text-anchor="middle" letter-spacing="6">TRADITION OF PURITY &amp; EXCELLENCE</text>
  
  <!-- Divider -->
  <line x1="200" y1="210" x2="600" y2="210" stroke="#f59e0b" stroke-width="3"/>
  
  <!-- Commodity Name -->
  <rect x="100" y="250" width="600" height="120" rx="16" fill="#ffffff" opacity="0.95"/>
  <text x="400" y="305" font-family="Arial, sans-serif" font-size="40" font-weight="900" fill="#0b2545" text-anchor="middle">PREMIUM BASMATI RICE</text>
  <text x="400" y="345" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#0284c7" text-anchor="middle">AGED ROYAL GRAIN • 100% PURE &amp; NATURAL</text>
  
  <!-- Graphic Box -->
  <rect x="140" y="410" width="520" height="280" rx="20" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
  <text x="400" y="520" font-family="Arial, sans-serif" font-size="64" fill="#fbbf24" text-anchor="middle">🌾</text>
  <text x="400" y="580" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="#ffffff" text-anchor="middle">AUTHENTIC HIMALAYAN HARVEST</text>
  <text x="400" y="620" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle">Extra Long Grain • Rich Aroma • Non-Sticky</text>
  
  <!-- Vegetarian Green Dot Logo -->
  <rect x="100" y="740" width="60" height="60" fill="#ffffff" stroke="#16a34a" stroke-width="4"/>
  <circle cx="130" cy="770" r="18" fill="#16a34a"/>
  
  <!-- Net Quantity PDP Declaration -->
  <rect x="200" y="730" width="500" height="80" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="3"/>
  <text x="230" y="780" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#0f172a">NET QUANTITY: 1 kg</text>
  
  <!-- Bottom Banner -->
  <rect x="40" y="860" width="720" height="80" fill="#0f172a" rx="10"/>
  <text x="400" y="910" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#38bdf8" text-anchor="middle">[TEST DATA] LEGAL METROLOGY COMPLIANT PACKAGING SAMPLE</text>
</svg>`;

// 2. Back Panel SVG (Declarations Panel)
const backSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="800" height="1100">
  <!-- Background Panel -->
  <rect x="20" y="20" width="760" height="1060" rx="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
  
  <!-- Header Bar -->
  <rect x="40" y="40" width="720" height="60" fill="#0b2545" rx="8"/>
  <text x="400" y="80" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="2">STATUTORY DECLARATIONS / MANDATORY PANEL</text>
  
  <!-- Section 1: Product & Manufacturer -->
  <text x="60" y="140" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#0f172a">COMMODITY:</text>
  <text x="220" y="140" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#334155">Premium Basmati Rice</text>

  <text x="60" y="180" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#0f172a">BRAND:</text>
  <text x="220" y="180" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#334155">ABC Foods</text>
  
  <line x1="60" y1="210" x2="740" y2="210" stroke="#e2e8f0" stroke-width="2"/>
  
  <text x="60" y="250" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#0f172a">MANUFACTURED &amp; PACKED BY:</text>
  <text x="60" y="285" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="#334155">ABC Foods Pvt Ltd</text>
  <text x="60" y="315" font-family="Arial, sans-serif" font-size="16" fill="#475569">Plot No. 45, Industrial Estate, Guindy,</text>
  <text x="60" y="345" font-family="Arial, sans-serif" font-size="16" fill="#475569">Chennai, Tamil Nadu - 600032, India.</text>

  <text x="60" y="390" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#0f172a">COUNTRY OF ORIGIN:</text>
  <text x="300" y="390" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#334155">India</text>
  
  <line x1="60" y1="420" x2="740" y2="420" stroke="#e2e8f0" stroke-width="2"/>
  
  <!-- Section 2: Dates and Batch -->
  <text x="60" y="460" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#0f172a">DATE OF PACKING:</text>
  <text x="280" y="460" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#0284c7">06/2024</text>
  
  <text x="440" y="460" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#0f172a">MFG. DATE:</text>
  <text x="580" y="460" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#0284c7">05/2024</text>
  
  <text x="60" y="505" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#0f172a">BATCH NO:</text>
  <text x="280" y="505" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#334155">BATCH-AUG-884</text>

  <text x="60" y="550" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#0f172a">BEST BEFORE:</text>
  <text x="280" y="550" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#16a34a">12 Months from Packaging</text>

  <line x1="60" y1="580" x2="740" y2="580" stroke="#e2e8f0" stroke-width="2"/>
  
  <!-- Section 3: Consumer Care Cell -->
  <rect x="50" y="605" width="700" height="180" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <text x="70" y="640" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="#0b2545">CONSUMER CARE CELL:</text>
  <text x="70" y="675" font-family="Arial, sans-serif" font-size="15" fill="#334155">In case of consumer complaints, please contact Manager - Consumer Care at:</text>
  <text x="70" y="705" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#0284c7">Phone: 1800-425-9988 (Toll Free)</text>
  <text x="70" y="735" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#0284c7">Email: customercare@abcfoods.in</text>
  <text x="70" y="765" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#0284c7">Website: www.abcfoods.in</text>

  <!-- Section 4: Nutrition Table -->
  <rect x="50" y="810" width="700" height="170" rx="10" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="70" y="845" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#0f172a">NUTRITIONAL FACTS (Per 100g Approx):</text>
  <text x="70" y="885" font-family="Arial, sans-serif" font-size="15" fill="#334155">Energy: 350 kcal | Protein: 8.5g | Carbohydrates: 78g | Dietary Fiber: 2.2g</text>
  <text x="70" y="920" font-family="Arial, sans-serif" font-size="15" fill="#334155">Total Fat: 0.5g | Saturated Fat: 0.1g | Sodium: 5mg</text>
  <text x="70" y="955" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Storage Instructions: Store in a cool, dry and hygienic place away from direct sunlight.</text>
  
  <text x="400" y="1040" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#94a3b8" text-anchor="middle">[TEST DATA] ABC FOODS BACK PANEL MOCK EVIDENCE</text>
</svg>`;

// 3. MRP & Pricing Panel SVG
const mrpSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 700" width="800" height="700">
  <rect x="20" y="20" width="760" height="660" rx="20" fill="#ffffff" stroke="#0b2545" stroke-width="5"/>
  
  <!-- Header -->
  <rect x="40" y="40" width="720" height="70" fill="#0b2545" rx="10"/>
  <text x="400" y="85" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">PRICE &amp; QUANTITY DECLARATION PANEL</text>
  
  <!-- MRP Display -->
  <rect x="60" y="140" width="680" height="130" rx="14" fill="#f0fdf4" stroke="#86efac" stroke-width="3"/>
  <text x="90" y="195" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#15803d">MAXIMUM RETAIL PRICE (MRP):</text>
  <text x="90" y="245" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="#0f172a">₹ 120.00</text>
  <text x="320" y="245" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#475569">(Inclusive of all taxes)</text>
  
  <!-- Unit Sale Price (USP) -->
  <rect x="60" y="290" width="680" height="90" rx="12" fill="#eff6ff" stroke="#bfdbfe" stroke-width="2"/>
  <text x="90" y="345" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="#1e40af">UNIT SALE PRICE (USP):</text>
  <text x="400" y="345" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#0b2545">₹ 0.12 / g</text>
  
  <!-- Net Quantity -->
  <rect x="60" y="400" width="680" height="90" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <text x="90" y="455" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="#0f172a">NET QUANTITY:</text>
  <text x="320" y="455" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#0284c7">1 kg</text>
  
  <!-- Barcode Simulation -->
  <g transform="translate(180, 520)">
    <!-- Bars -->
    <rect x="0" y="0" width="6" height="70" fill="#000000"/>
    <rect x="10" y="0" width="4" height="70" fill="#000000"/>
    <rect x="20" y="0" width="10" height="70" fill="#000000"/>
    <rect x="36" y="0" width="4" height="70" fill="#000000"/>
    <rect x="46" y="0" width="8" height="70" fill="#000000"/>
    <rect x="60" y="0" width="6" height="70" fill="#000000"/>
    <rect x="72" y="0" width="12" height="70" fill="#000000"/>
    <rect x="90" y="0" width="4" height="70" fill="#000000"/>
    <rect x="100" y="0" width="8" height="70" fill="#000000"/>
    <rect x="114" y="0" width="6" height="70" fill="#000000"/>
    <rect x="126" y="0" width="10" height="70" fill="#000000"/>
    <rect x="142" y="0" width="4" height="70" fill="#000000"/>
    <rect x="152" y="0" width="12" height="70" fill="#000000"/>
    <rect x="170" y="0" width="6" height="70" fill="#000000"/>
    <rect x="182" y="0" width="4" height="70" fill="#000000"/>
    <rect x="192" y="0" width="10" height="70" fill="#000000"/>
    <rect x="208" y="0" width="6" height="70" fill="#000000"/>
    <rect x="220" y="0" width="8" height="70" fill="#000000"/>
    <rect x="234" y="0" width="4" height="70" fill="#000000"/>
    <rect x="244" y="0" width="10" height="70" fill="#000000"/>
    <rect x="260" y="0" width="6" height="70" fill="#000000"/>
    <rect x="272" y="0" width="8" height="70" fill="#000000"/>
    <rect x="286" y="0" width="4" height="70" fill="#000000"/>
    <rect x="296" y="0" width="12" height="70" fill="#000000"/>
    <rect x="314" y="0" width="6" height="70" fill="#000000"/>
    <rect x="326" y="0" width="4" height="70" fill="#000000"/>
    <rect x="336" y="0" width="10" height="70" fill="#000000"/>
    <rect x="352" y="0" width="6" height="70" fill="#000000"/>
    <rect x="364" y="0" width="8" height="70" fill="#000000"/>
    <rect x="378" y="0" width="4" height="70" fill="#000000"/>
    <rect x="388" y="0" width="10" height="70" fill="#000000"/>
    <rect x="404" y="0" width="6" height="70" fill="#000000"/>
    <rect x="416" y="0" width="8" height="70" fill="#000000"/>
    <text x="210" y="95" font-family="Courier, monospace" font-size="20" font-weight="700" fill="#000000" text-anchor="middle" letter-spacing="4">8 901030 889214</text>
  </g>
  
  <text x="400" y="660" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#94a3b8" text-anchor="middle">[TEST DATA] MRP PANEL CLOSE-UP EVIDENCE</text>
</svg>`;

// Write the files
fs.writeFileSync(path.join(uploadsDir, 'sample-rice-front.jpg'), frontSvg, 'utf8');
fs.writeFileSync(path.join(uploadsDir, 'sample-rice-back.jpg'), backSvg, 'utf8');
fs.writeFileSync(path.join(uploadsDir, 'sample-rice-mrp.jpg'), mrpSvg, 'utf8');

// Also write copies into processed directory
fs.writeFileSync(path.join(processedDir, 'sample-rice-front-preprocessed.jpg'), frontSvg, 'utf8');
fs.writeFileSync(path.join(processedDir, 'sample-rice-back-preprocessed.jpg'), backSvg, 'utf8');
fs.writeFileSync(path.join(processedDir, 'sample-rice-mrp-preprocessed.jpg'), mrpSvg, 'utf8');

console.log('✅ Sample packaged commodity image assets successfully generated in uploads directory.');
