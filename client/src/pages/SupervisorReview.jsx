import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import {
  ShieldAlert,
  FileCheck,
  Eye,
  CheckCircle,
  AlertOctagon,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  Send,
} from 'lucide-react';

const SupervisorReview = () => {
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState('');

  const [queue, setQueue] = useState([
    {
      id: 'INSP-2024-0891',
      commodity: 'NutriDelight Almond Butter 500g',
      retailer: 'Reliance Fresh Supermarket #42, Connaught Place',
      reportingOfficer: 'Insp. Vikram Singh (LM-OFF-742)',
      violations: [
        'Rule 6(1)(c) & Rule 12: Non-standard unit "500 GMS" (Required: "g")',
        'Rule 6(1)(e): MRP stated as "Taxes Extra" (Violation of inclusive requirement)',
        'Rule 6(1)(n): Missing consumer care telephone and email address',
      ],
      severity: 'CRITICAL',
      status: 'POTENTIAL_NON_COMPLIANCE',
      supervisorEndorsement: 'PENDING_SUPERVISOR',
    },
    {
      id: 'INSP-2024-0865',
      commodity: 'Imported Hazelnut Choco Spread 350g',
      retailer: 'Modern Bazaar, Vasant Kunj',
      reportingOfficer: 'Insp. Meera Patel (LM-OFF-612)',
      violations: ['Rule 6(10): Missing Country of Origin declaration on front panel'],
      severity: 'HIGH',
      status: 'POTENTIAL_NON_COMPLIANCE',
      supervisorEndorsement: 'PENDING_SUPERVISOR',
    },
  ]);

  const handleEndorseNotice = (id) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, supervisorEndorsement: 'NOTICE_ISSUED' } : item
      )
    );
    setSuccessMsg(`Statutory enforcement notice approved and dispatched for ${id}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Supervisor Violations Review Queue</h1>
          <p className="page-desc">
            Review potential non-compliances flagged by field officers across your regional jurisdiction under Legal Metrology Rules, 2011
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="alert-notice info" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={18} />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Review Queue Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {queue.map((item) => (
          <div key={item.id} className="card" style={{ borderLeft: '4px solid #dc2626' }}>
            <div className="card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--gov-navy-900)', fontSize: '1.1rem' }}>
                    {item.commodity}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                    }}
                  >
                    {item.severity}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                  Inspection ID: <strong>{item.id}</strong> • {item.retailer}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StatusBadge status={item.status} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gov-navy-800)', marginBottom: '8px' }}>
                Flagged Legal Metrology Rules, 2011 Violations:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {item.violations.map((v, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: '0.85rem',
                      color: '#991b1b',
                      background: '#fef2f2',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #fee2e2',
                    }}
                  >
                    ⚠️ {v}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '14px',
                borderTop: '1px solid var(--slate-100)',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)' }}>
                Reporting Officer: <strong>{item.reportingOfficer}</strong>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/inspections/${item.id}`)}
                >
                  <Eye size={14} />
                  <span>Inspect Full Evidence</span>
                </button>

                <button
                  className="btn btn-primary btn-sm"
                  disabled={item.supervisorEndorsement === 'NOTICE_ISSUED'}
                  onClick={() => handleEndorseNotice(item.id)}
                >
                  <Send size={14} />
                  <span>
                    {item.supervisorEndorsement === 'NOTICE_ISSUED'
                      ? '✓ Notice Issued to Manufacturer'
                      : 'Approve & Issue Enforcement Notice'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupervisorReview;
