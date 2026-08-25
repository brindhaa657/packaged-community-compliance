# 🏛️ LegalMetrix
### AI-Assisted Legal Metrology Compliance Checking System for Packaged Commodities
**Smart India Hackathon (SIH) Solution**

---

## 📌 Project Overview
**LegalMetrix** is an AI-assisted inspection and screening platform engineered specifically for **Legal Metrology Enforcement Officers** in India. The application assists officers in screening packaged commodities across retail stores, supermarkets, warehouses, and e-commerce listings by analyzing packaging imagery to detect potential violations of the **Legal Metrology (Packaged Commodities) Rules, 2011** and the **Legal Metrology Act, 2009**.

> [!IMPORTANT]
> **Advisory Nature of AI Screening:**
> LegalMetrix is an **AI-assisted decision support system**. It does **NOT** make automated legally binding orders. All screening results are categorized into:
> - `Compliant / Passed Screening`
> - `Potential Non-Compliance`
> - `Requires Manual Verification`
> 
> Enforcement officers retain statutory authority and must review, verify, and endorse/reject all AI findings before issuing formal notices.

---

## 🛡️ Core Features & Capabilities

### 1. Mandatory Declarations Support (Rules, 2011)
The data models and rule engines extract and validate:
- **Product / Commodity Identity & Generic Name** *(Rule 6(1)(a))*
- **Manufacturer / Packer Name & Physical Address** *(Rule 6(1)(b))*
- **Net Quantity Declaration & Standard SI Units** *(Rule 6(1)(c) & Rule 12)*
- **MRP Inclusive of All Taxes** *(Rule 6(1)(e))*
- **Month and Year of Manufacture / Pre-packing / Import** *(Rule 6(1)(d))*
- **Consumer Care Cell Contact Details** *(Rule 6(1)(n))*
- **Country of Origin for Imported Goods** *(Rule 6(10))*

### 2. Multi-Role Enforcement Architecture
1. **OFFICER**
   - Conducts packaged commodity inspections in the field.
   - Uploads multi-panel packaging imagery (Front, Back, Side, Barcode/MRP panel).
   - Reviews OCR declarations & rule-based compliance findings.
   - Accepts/modifies findings and records inspection remarks.
   - Generates preliminary inspection reports.
2. **SUPERVISOR**
   - Monitors regional inspection throughput and violation trends.
   - Reviews flagged non-compliances awaiting statutory notice issuance.
   - Inspects jurisdictional compliance analytics and officer performance.
3. **ADMIN**
   - Configures the dynamic `ComplianceRule` engine without code deployments.
   - Manages officer credentials, roles, badges, and assigned jurisdictions.
   - Audits system logs and OCR service integrations.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Pure CSS (Gov design tokens), Recharts, Lucide Icons, Axios |
| **Backend** | Node.js, Express.js, JWT Authentication, bcryptjs, Multer, Helmet, Morgan, CORS |
| **Database** | MongoDB Atlas / Local MongoDB, Mongoose ODM |
| **AI / OCR** | Pluggable OCR/Vision abstraction layer (Mock provider included for initial testing & CI) |
| **Reporting** | PDF generation architecture, JSON audit exports |

---

## 📂 Project Directory Structure

```
Packaged-Community-Compliance/
├── client/                     # Vite + React Frontend
│   ├── public/                 # Favicons and static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components (StatsCard, StatusBadge, ProtectedRoute, etc.)
│   │   ├── context/            # AuthContext and state management
│   │   ├── hooks/              # Custom React hooks (useAuth)
│   │   ├── layouts/            # AppLayout (Sidebar, Navbar, Legal disclaimer)
│   │   ├── pages/              # Login, OfficerDashboard, SupervisorDashboard, AdminDashboard, NotFound
│   │   ├── services/           # Axios API client and Auth services
│   │   ├── styles/             # Pure CSS stylesheets (index, layout, auth, dashboard)
│   │   ├── utils/              # Helper utilities and constants
│   │   ├── App.jsx             # Main router and role protection
│   │   └── main.jsx            # React root entry
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Express.js Backend API
│   ├── src/
│   │   ├── config/             # Database connection & environment configuration
│   │   ├── controllers/        # Auth and inspection controllers
│   │   ├── middleware/         # JWT auth middleware, role authorization, error handling
│   │   ├── models/             # Mongoose schemas (User, Product, Inspection, ComplianceRule, Finding, Report, etc.)
│   │   ├── routes/             # API routes (/api/auth, /api/health)
│   │   ├── services/           # OCR & Rule engine abstractions
│   │   ├── utils/              # Token generation, seed scripts
│   │   └── server.js           # Express main server entry
│   ├── uploads/                # Temporary inspection image storage
│   ├── .env.example
│   └── package.json
│
├── .env.example                # Root environment sample
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+ recommended)
- MongoDB instance (MongoDB Atlas connection string or local MongoDB on `localhost:27017`)

---

### Step 1: Install Dependencies

#### Windows (PowerShell / Command Prompt):
```powershell
# Install backend dependencies
cd server
npm.cmd install

# Install frontend dependencies
cd ../client
npm.cmd install
```

#### macOS / Linux:
```bash
cd server && npm install
cd ../client && npm install
```

---

### Step 2: Environment Configuration
Create a `.env` file in the `/server` directory (copied from `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/legalmetrix
JWT_SECRET=legalmetrix_sih_super_secure_jwt_secret_key_2024_packaged_compliance
JWT_EXPIRES_IN=7d
OCR_PROVIDER=mock
```

---

### Step 3: Run the Application

#### Start Backend Server:
```powershell
cd server
node src/server.js
```
*Backend runs on `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`)*

#### Start Frontend Client (in a separate terminal):
```powershell
cd client
npm.cmd run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔑 Demo Login Accounts

Quick 1-click login buttons are provided on the login page for evaluator convenience:

| Role | Email | Password | Assigned Scope |
| :--- | :--- | :--- | :--- |
| **OFFICER** | `officer@legalmetrix.gov.in` | `Officer@123` | Delhi NCR Enforcement Division |
| **SUPERVISOR** | `supervisor@legalmetrix.gov.in` | `Supervisor@123` | Northern Regional Zone |
| **ADMIN** | `admin@legalmetrix.gov.in` | `Admin@123` | National Headquarters - New Delhi |

---

## ⚖️ Legal & Regulatory Reference
- **The Legal Metrology Act, 2009** (Act No. 1 of 2010)
- **The Legal Metrology (Packaged Commodities) Rules, 2011** (G.S.R. 202(E))
- **Amendments & Guidelines on Unit Sale Price & E-Commerce Declarations** (2017, 2021, 2022)

---

© 2024–2026 LegalMetrix • Smart India Hackathon
