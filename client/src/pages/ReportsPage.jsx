import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Calendar,
  Building2,
  X,
} from 'lucide-react';
import { inspectionService } from '../services/inspectionService';

const ReportsPage = () => {
  const [selectedReportHtml, setSelectedReportHtml] = useState(null);

  const reportsList = [
    {
      reportNumber: 'REP-LM-2024-0089',
      inspectionId: 'INSP-2024-0891',
      productName: 'NutriDelight Almond Butter 500g',
      type: 'STATUTORY NON-COMPLIANCE NOTICE',
      date: 'Today, 11:30 AM',
      officer: 'Inspector Vikram Singh',
      result: 'POTENTIAL_NON_COMPLIANCE',
      status: 'ISSUED',
    },
    {
      reportNumber: 'REP-LM-2024-0088',
      inspectionId: 'INSP-2024-0888',
      productName: 'Organic Whole Wheat Flour 5kg',
      type: 'COMPLIANCE AUDIT CERTIFICATE',
      date: 'Today, 09:55 AM',
      officer: 'Inspector Vikram Singh',
      result: 'COMPLIANT',
      status: 'VERIFIED',
    },
    {
      reportNumber: 'REP-LM-2024-0082',
      inspectionId: 'INSP-2024-0882',
      productName: 'UltraPure Hand Sanitizer Gel 250ml',
      type: 'PRELIMINARY SCREENING REPORT',
      date: 'Yesterday, 04:30 PM',
      officer: 'Inspector Vikram Singh',
      result: 'REQUIRES_MANUAL_VERIFICATION',
      status: 'PENDING_OFFICER',
    },
  ];

  const handlePreviewReport = async (inspectionId) => {
    try {
      const res = await inspectionService.getReport(inspectionId);
      if (res.success && res.data?.html) {
        setSelectedReportHtml(res.data.html);
      }
    } catch (e) {
      console.error('Error fetching report:', e);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Enforcement Reports & Statutory Notices</h1>
          <p className="page-desc">
            Download and print statutory inspection notices, screening summaries, and Legal Metrology 2011 compliance certificates
          </p>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Notice / Report ID</th>
                <th>Inspection Ref</th>
                <th>Inspected Packaged Commodity</th>
                <th>Notice Type</th>
                <th>Screening Finding</th>
                <th>Issuing Officer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportsList.map((rep) => (
                <tr key={rep.reportNumber}>
                  <td style={{ fontWeight: 700, color: 'var(--gov-navy-800)', fontSize: '0.85rem' }}>
                    {rep.reportNumber}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>{rep.inspectionId}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{rep.productName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{rep.date}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                      {rep.type}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: rep.result === 'POTENTIAL_NON_COMPLIANCE' ? '#fef2f2' : '#ecfdf5',
                        color: rep.result === 'POTENTIAL_NON_COMPLIANCE' ? '#dc2626' : '#059669',
                      }}
                    >
                      {rep.result.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{rep.officer}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handlePreviewReport(rep.inspectionId)}
                    >
                      <Eye size={14} />
                      <span>View / Print</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Modal */}
      {selectedReportHtml && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--white)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--slate-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--gov-navy-900)',
                color: 'var(--white)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <Scale size={18} />
                <span>Statutory Legal Metrology Notice Document</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const printWin = window.open('', '_blank');
                    printWin.document.write(selectedReportHtml);
                    printWin.document.close();
                    printWin.print();
                  }}
                >
                  <Printer size={14} />
                  <span>Print Document</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedReportHtml(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f8fafc' }}>
              <iframe
                title="Notice Frame"
                srcDoc={selectedReportHtml}
                style={{ width: '100%', height: '550px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
