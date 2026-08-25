import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Info, Scale } from 'lucide-react';

const AppLayout = () => {
  return (
    <div className="app-layout">
      {/* Role-aware Sidebar */}
      <Sidebar />

      {/* Main Workspace */}
      <div className="main-wrapper">
        <Navbar />

        <div className="page-container">
          {/* Statutory Enforcement & AI-Assistance Disclaimer Banner */}
          <div className="disclaimer-banner">
            <Scale size={20} color="#d97706" style={{ flexShrink: 0 }} />
            <div className="disclaimer-text">
              <span className="disclaimer-bold">Legal Notice & Inspection Disclaimer: </span>
              LegalMetrix is an AI-assisted screening and verification support system under the Legal Metrology (Packaged Commodities) Rules, 2011. AI determinations represent preliminary advisory screenings and do not constitute final statutory enforcement orders until formally verified and endorsed by the designated Inspector / Enforcement Authority.
            </div>
          </div>

          {/* Dynamic Nested Page Content */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
