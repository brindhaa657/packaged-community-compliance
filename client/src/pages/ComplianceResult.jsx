import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complianceService } from '../services/complianceService';
import StatusBadge from '../components/StatusBadge';
import {
  Scale,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Eye,
  Check,
  X,
  Camera,
  RotateCcw,
  Clock,
  ArrowLeft,
  FileText,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  Send,
  MessageSquare,
} from 'lucide-react';

const ComplianceResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [successNotice, setSuccessNotice] = useState('');
  const [isReScreening, setIsReScreening] = useState(false);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      const res = await complianceService.getInspectionCompliance(id);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load compliance result:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplianceData();
  }, [id]);

  const handleVerifyFinding = async (findingId) => {
    const comment = commentInputs[findingId] || '';
    try {
      await complianceService.verifyFinding(findingId, comment);
      setSuccessNotice('Finding verified and confirmed by Officer.');
      setTimeout(() => setSuccessNotice(''), 3500);
      loadComplianceData();
    } catch (e) {
      console.error('Error confirming finding:', e);
    }
  };

  const handleRejectFinding = async (findingId) => {
    const comment = commentInputs[findingId] || '';
    try {
      await complianceService.rejectFinding(findingId, comment);
      setSuccessNotice('Finding marked as rejected/compliant upon physical verification.');
      setTimeout(() => setSuccessNotice(''), 3500);
      loadComplianceData();
    } catch (e) {
      console.error('Error rejecting finding:', e);
    }
  };

  const handleRequestRescan = async (findingId) => {
    const comment = commentInputs[findingId] || 'Packaging area requires clearer close-up image';
    try {
      await complianceService.requestRescan(id, findingId, comment);
      setSuccessNotice('Re-scan requested. Redirecting to scanner to capture additional packaging panels...');
      setTimeout(() => {
        navigate(`/inspections/new?rescan=${id}`);
      }, 1200);
    } catch (e) {
      console.error('Error requesting rescan:', e);
    }
  };

  const handleReRunScreening = async () => {
    setIsReScreening(true);
    try {
      await complianceService.runScreening(id, {});
      setSuccessNotice('Compliance rules engine re-evaluated successfully.');
      setTimeout(() => setSuccessNotice(''), 3000);
      loadComplianceData();
    } catch (e) {
      console.error('Error re-running screening:', e);
    } finally {
      setIsReScreening(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #cbd5e1',
            borderTopColor: '#0b2545',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ color: 'var(--slate-500)', fontWeight: 600 }}>
          Running Legal Metrology Rules, 2011 screening engine...
        </p>
      </div>
    );
  }

  const inspection = data?.inspection || {};
  const product = inspection.product || inspection.productDetailsSnapshot || {};
  const summary = data?.screeningSummary || {};
  const ruleResults = data?.ruleResults || [];
  const findings = data?.findings || [];
  const auditLogs = data?.auditLogs || [];

  const isPotentialNonCompliance = summary.overallScreening === 'POTENTIAL_NON_COMPLIANCE';
  const isPassed = summary.overallScreening === 'PASS';

  return (
    <div>
      {/* Top Breadcrumb & Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: '8px' }}
            onClick={() => navigate(`/inspections/${id}`)}
          >
            <ArrowLeft size={14} />
            <span>Back to Inspection Overview</span>
          </button>
          <h1 className="page-title">Legal Metrology Compliance Screening</h1>
          <p className="page-desc">
            Rule-based statutory screening results for <strong>{product.productName || 'Packaged Commodity'}</strong> (ID: {inspection.inspectionId || id})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReRunScreening}
            disabled={isReScreening}
          >
            <RefreshCw size={16} className={isReScreening ? 'animate-spin' : ''} />
            <span>Re-Run Screening</span>
          </button>

          <button
            type="button"
            className="btn btn-accent"
            onClick={() => handleRequestRescan(null)}
          >
            <Camera size={16} />
            <span>Request Re-Scan</span>
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="alert-notice info">
          <CheckCircle2 size={18} />
          <div>{successNotice}</div>
        </div>
      )}

      {/* Statutory AI-Assisted Notice Disclaimer */}
      <div className="disclaimer-banner">
        <Scale size={20} color="#d97706" style={{ flexShrink: 0 }} />
        <div className="disclaimer-text">
          <span className="disclaimer-bold">Legal Metrology Screening Protocol: </span>
          The screening engine performs advisory checks under the Legal Metrology (Packaged Commodities) Rules, 2011. Results represent preliminary automated screening indicators (<code>PASS</code>, <code>POTENTIAL_NON_COMPLIANCE</code>, <code>REQUIRES_MANUAL_VERIFICATION</code>) and do NOT constitute a final statutory order until confirmed by the verifying enforcement officer.
        </div>
      </div>

      {/* Overall Screening Determination Card */}
      <div
        style={{
          background: isPotentialNonCompliance ? '#fef2f2' : isPassed ? '#ecfdf5' : '#fffbeb',
          border: `1.5px solid ${isPotentialNonCompliance ? '#fecaca' : isPassed ? '#a7f3d0' : '#fde68a'}`,
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: isPotentialNonCompliance ? '#fee2e2' : isPassed ? '#d1fae5' : '#fef3c7',
              color: isPotentialNonCompliance ? '#dc2626' : isPassed ? '#059669' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPotentialNonCompliance ? (
              <AlertTriangle size={30} />
            ) : isPassed ? (
              <CheckCircle2 size={30} />
            ) : (
              <HelpCircle size={30} />
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isPotentialNonCompliance ? '#991b1b' : isPassed ? '#065f46' : '#92400e',
              }}
            >
              Overall Advisory Screening Result
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: isPotentialNonCompliance ? '#b91c1c' : isPassed ? '#047857' : '#b45309',
                lineHeight: 1.2,
                marginTop: '2px',
              }}
            >
              {summary.overallScreening ? summary.overallScreening.replace(/_/g, ' ') : 'REQUIRES MANUAL VERIFICATION'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)', marginTop: '4px' }}>
              Product: <strong>{product.productName}</strong> ({product.category || 'Food'}) • Premises: {inspection.location?.storeName || 'Retail Store'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.7)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gov-navy-900)' }}>{summary.totalRulesChecked || ruleResults.length}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Rules Checked</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.7)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{summary.passed || 0}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Passed</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.7)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>{summary.potentialIssues || 0}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Potential Issues</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.7)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706' }}>{summary.requiresReview || 0}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Requires Review</div>
          </div>
        </div>
      </div>

      {/* Section: Flagged Findings & Officer Verification */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Potential Non-Compliance Findings ({findings.length})</h3>
            <p className="card-subtitle">
              Review flagged items, inspect source packaging evidence, and confirm, reject, or request re-scan
            </p>
          </div>
        </div>

        {findings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--slate-500)' }}>
            <CheckCircle2 size={40} color="#059669" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)' }}>No Potential Issues Flagged</div>
            <p style={{ fontSize: '0.85rem' }}>All applicable Legal Metrology rules passed automated screening.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {findings.map((f) => {
              const isConfirmed = f.status === 'OFFICER_CONFIRMED';
              const isRejected = f.status === 'OFFICER_REJECTED';
              const isRescan = f.status === 'REQUIRES_MORE_EVIDENCE';

              return (
                <div
                  key={f._id || f.ruleId}
                  style={{
                    border: `1.5px solid ${isConfirmed ? '#f87171' : isRejected ? '#a7f3d0' : '#fecaca'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    backgroundColor: isConfirmed ? '#fff5f5' : isRejected ? '#f0fdf4' : '#fffbfb',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--gov-navy-900)' }}>
                          {f.ruleId} (v{f.ruleVersion || 1})
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                          • {f.legalReference || 'Rule 6(1)'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: f.severity === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
                            color: f.severity === 'CRITICAL' ? '#dc2626' : '#d97706',
                          }}
                        >
                          {f.severity}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
                        {f.ruleTitle}
                      </h4>
                    </div>

                    <div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isConfirmed ? '#fef2f2' : isRejected ? '#ecfdf5' : isRescan ? '#fef3c7' : '#eff6ff',
                          color: isConfirmed ? '#b91c1c' : isRejected ? '#047857' : isRescan ? '#92400e' : '#1d4ed8',
                          border: '1px solid currentColor',
                        }}
                      >
                        {f.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.88rem', color: '#991b1b', lineHeight: 1.5, marginBottom: '14px', background: 'rgba(239, 68, 68, 0.08)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                    <strong>Reason / Observed Finding:</strong> {f.description}
                  </div>

                  {/* Officer Verification & Comment Controls */}
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '14px' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)', display: 'block', marginBottom: '4px' }}>
                        Officer Comment / Verification Remarks:
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '0.85rem' }}
                        placeholder="e.g. Declaration appears truncated on folded edge / Confirmed illegal unit format..."
                        value={commentInputs[f._id || f.ruleId] !== undefined ? commentInputs[f._id || f.ruleId] : (f.officerComment || '')}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [f._id || f.ruleId]: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${isConfirmed ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ backgroundColor: isConfirmed ? '#dc2626' : '', borderColor: '#fca5a5', color: isConfirmed ? '#fff' : '#b91c1c' }}
                        onClick={() => handleVerifyFinding(f._id || f.ruleId)}
                      >
                        <Check size={14} />
                        <span>{isConfirmed ? '✓ Confirmed Non-Compliance' : 'Confirm Finding'}</span>
                      </button>

                      <button
                        type="button"
                        className={`btn btn-sm ${isRejected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ backgroundColor: isRejected ? '#059669' : '', borderColor: '#a7f3d0', color: isRejected ? '#fff' : '#047857' }}
                        onClick={() => handleRejectFinding(f._id || f.ruleId)}
                      >
                        <CheckCircle2 size={14} />
                        <span>{isRejected ? '✓ Rejected / Compliant' : 'Reject Finding'}</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRequestRescan(f._id || f.ruleId)}
                      >
                        <Camera size={14} />
                        <span>Request Re-Scan</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section: Evaluated Applicable Rules Table */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">All Evaluated Applicable Rules ({ruleResults.length})</h3>
            <p className="card-subtitle">
              Detailed breakdown of rule conditions, observed values, and screening status
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule ID & Title</th>
                <th>Target Field</th>
                <th>Observed Value</th>
                <th>Screening Outcome</th>
                <th>Confidence</th>
                <th>Evaluation Details</th>
              </tr>
            </thead>
            <tbody>
              {ruleResults.map((r, idx) => (
                <tr key={r.ruleId || idx}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)' }}>{r.ruleTitle}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                      {r.ruleId} (v{r.ruleVersion || 1})
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                    {r.ruleCategory}
                  </td>
                  <td style={{ fontSize: '0.82rem', maxWidth: '220px', color: 'var(--slate-800)' }}>
                    <code>{r.observedValue}</code>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          r.status === 'PASS'
                            ? '#ecfdf5'
                            : r.status === 'FAIL'
                            ? '#fef2f2'
                            : r.status === 'NOT_APPLICABLE'
                            ? '#f1f5f9'
                            : '#fffbeb',
                        color:
                          r.status === 'PASS'
                            ? '#059669'
                            : r.status === 'FAIL'
                            ? '#dc2626'
                            : r.status === 'NOT_APPLICABLE'
                            ? '#64748b'
                            : '#d97706',
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', fontWeight: 700, color: r.confidence >= 80 ? '#059669' : '#d97706' }}>
                    {r.confidence}%
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--slate-600)', maxWidth: '280px' }}>
                    {r.explanation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section: Audit Trail Log */}
      {auditLogs.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Inspection Audit Trail & Event Log</h3>
              <p className="card-subtitle">Immutable chronological record of screening and officer verification actions</p>
            </div>
            <Clock size={16} color="var(--slate-400)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {auditLogs.map((log, idx) => (
              <div
                key={log._id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--slate-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--slate-200)',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--gov-navy-900)' }}>{log.action.replace(/_/g, ' ')}</strong>
                  <span style={{ color: 'var(--slate-500)', marginLeft: '8px' }}>by {log.userName} ({log.userRole})</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                  {new Date(log.timestamp || Date.now()).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceResult;
