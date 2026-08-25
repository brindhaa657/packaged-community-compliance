import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import {
  PlusCircle,
  ClipboardCheck,
  AlertTriangle,
  FileSearch,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Eye,
  Camera,
  Layers,
  Sparkles,
} from 'lucide-react';

const OfficerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Sample recent inspections data for initial evaluation
  const [recentInspections] = useState([
    {
      id: 'INSP-2024-0891',
      productName: 'NutriDelight Almond Butter 500g',
      category: 'Food & Beverages',
      location: 'Reliance Fresh Supermarket, Connaught Place',
      date: 'Today, 11:20 AM',
      overallResult: 'POTENTIAL_NON_COMPLIANCE',
      flaggedIssue: 'Missing Consumer Care email address & Unit Sale Price font size below 2mm',
      confidence: 94,
    },
    {
      id: 'INSP-2024-0888',
      productName: 'Organic Whole Wheat Flour 5kg',
      category: 'Food & Beverages',
      location: 'Big Bazaar Store #4, Karol Bagh',
      date: 'Today, 09:45 AM',
      overallResult: 'COMPLIANT',
      flaggedIssue: 'All 7 mandatory declarations verified against Rule 6(1)',
      confidence: 98,
    },
    {
      id: 'INSP-2024-0882',
      productName: 'UltraPure Hand Sanitizer Gel 250ml',
      category: 'Personal Care',
      location: 'Apollo Pharmacy Retail, Saket',
      date: 'Yesterday, 04:15 PM',
      overallResult: 'REQUIRES_MANUAL_VERIFICATION',
      flaggedIssue: 'Net quantity unit format ambiguous (symbol "ml" vs "ML")',
      confidence: 76,
    },
    {
      id: 'INSP-2024-0879',
      productName: 'Golden Harvest Basmati Rice 1kg',
      category: 'Food & Beverages',
      location: 'Local Kirana Mart, Lajpat Nagar',
      date: 'Yesterday, 02:30 PM',
      overallResult: 'COMPLIANT',
      flaggedIssue: 'Packer, MRP, and Date of Packing verified compliant',
      confidence: 96,
    },
  ]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Officer Inspection Workspace</h1>
          <p className="page-desc">
            Officer {user?.name} ({user?.badgeNumber || 'LM-OFF-742'}) • {user?.jurisdiction || 'Delhi NCR Enforcement Division'}
          </p>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => navigate('/inspections/new')}
        >
          <PlusCircle size={20} />
          <span>New Inspection</span>
        </button>
      </div>

      {/* Action Hero Banner */}
      <div className="action-hero-banner">
        <div className="action-hero-content">
          <div className="action-hero-badge">
            <Sparkles size={14} />
            <span>AI-Assisted Field Enforcement</span>
          </div>
          <h2 className="action-hero-title">Start Packaged Commodity Inspection</h2>
          <p className="action-hero-desc">
            Upload or capture multi-panel packaging photos (Front, Back, MRP/Barcode panel). The system automatically runs OCR, extracts all mandatory declarations under Legal Metrology Rules 2011, and flags potential non-compliances for your review.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-accent"
              onClick={() => navigate('/inspections/new')}
            >
              <Camera size={18} />
              <span>Launch Product Scanner</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/inspections')}
            >
              <ClipboardCheck size={18} />
              <span>View Past Inspections</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <StatsCard
          title="Total Inspections (Month)"
          value="48"
          subtitle="12 inspections today"
          icon={ClipboardCheck}
          color="blue"
        />
        <StatsCard
          title="Passed Screening"
          value="34"
          subtitle="70.8% compliance rate"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="Potential Non-Compliances"
          value="9"
          subtitle="Requires officer sign-off"
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Manual Verifications"
          value="5"
          subtitle="Low OCR confidence / edge cases"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Recent Inspections Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent Commodity Inspections</h3>
            <p className="card-subtitle">
              Screened packages awaiting confirmation or completed under Legal Metrology Rules, 2011
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/inspections')}
          >
            <span>View All Records</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Inspection ID</th>
                <th>Packaged Commodity</th>
                <th>Retail Location</th>
                <th>Screening Finding / Rule</th>
                <th>AI Status</th>
                <th>Confidence</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentInspections.map((insp) => (
                <tr key={insp.id}>
                  <td style={{ fontWeight: 700, color: 'var(--gov-navy-800)' }}>
                    {insp.id}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{insp.productName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      {insp.category} • {insp.date}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{insp.location}</td>
                  <td style={{ maxWidth: '280px', fontSize: '0.82rem', color: 'var(--slate-700)' }}>
                    {insp.flaggedIssue}
                  </td>
                  <td>
                    <StatusBadge status={insp.overallResult} />
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: insp.confidence >= 90 ? '#059669' : '#d97706' }}>
                      {insp.confidence}%
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/inspections/${insp.id}`)}
                    >
                      <Eye size={14} />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
