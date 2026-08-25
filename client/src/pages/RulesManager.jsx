import React, { useState, useEffect } from 'react';
import { ruleService } from '../services/ruleService';
import {
  Sliders,
  Plus,
  Power,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Scale,
} from 'lucide-react';

const RulesManager = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  const [newRule, setNewRule] = useState({
    ruleId: 'LMR-2024-AMEND-01',
    title: 'Font Size Minimum 2mm on Display Panel',
    description: 'Declarations on packages above 200g must have minimum numeral height of 2mm.',
    category: 'FONT_SIZE_AND_CONTRAST',
    requiredField: 'OTHER_MANDATORY_INFO',
    validationType: 'PRESENCE_CHECK',
    severity: 'HIGH',
    ruleNumber: 'Rule 9 & Schedule II',
  });

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await ruleService.getRules();
      if (res.success && res.data) {
        setRules(res.data);
      }
    } catch (e) {
      console.error('Error loading rules:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = async (ruleId) => {
    try {
      await ruleService.toggleRule(ruleId);
      setRules((prev) =>
        prev.map((r) =>
          r._id === ruleId || r.ruleId === ruleId ? { ...r, active: !r.active } : r
        )
      );
      setSuccessNotice('Rule status updated.');
      setTimeout(() => setSuccessNotice(''), 3000);
    } catch (e) {
      console.error('Failed to toggle rule:', e);
    }
  };

  const handleAddRuleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await ruleService.createRule({
        ...newRule,
        legalReference: {
          ruleNumber: newRule.ruleNumber,
          actName: 'Legal Metrology (Packaged Commodities) Rules, 2011',
        },
      });
      if (res.success && res.data) {
        setRules([...rules, res.data]);
        setShowAddModal(false);
        setSuccessNotice('New Legal Metrology rule created successfully!');
        setTimeout(() => setSuccessNotice(''), 3000);
      }
    } catch (e) {
      console.error('Failed to add rule:', e);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance Rules Engine Configuration</h1>
          <p className="page-desc">
            Manage statutory rules under the Legal Metrology (Packaged Commodities) Rules, 2011 evaluated by the AI screening engine
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>Add New Statutory Rule</span>
        </button>
      </div>

      {successNotice && (
        <div className="alert-notice info">
          <CheckCircle2 size={18} />
          <div>{successNotice}</div>
        </div>
      )}

      {/* Rules Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Title & Requirement</th>
                <th>Category</th>
                <th>Statutory Reference</th>
                <th>Validation Logic</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r._id || r.ruleId}>
                  <td style={{ fontWeight: 700, color: 'var(--gov-navy-800)', fontSize: '0.8rem' }}>
                    {r.ruleId}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', maxWidth: '300px' }}>
                      {r.description}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                      {r.category}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gov-navy-700)', fontWeight: 600 }}>
                      {r.legalReference?.ruleNumber || 'Rule 6(1)'}
                    </span>
                  </td>
                  <td>
                    <code>{r.validationType}</code>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: r.severity === 'CRITICAL' ? '#fef2f2' : '#eff6ff',
                        color: r.severity === 'CRITICAL' ? '#dc2626' : '#2563eb',
                        border: `1px solid ${r.severity === 'CRITICAL' ? '#fecaca' : '#bfdbfe'}`,
                      }}
                    >
                      {r.severity}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: r.active ? '#059669' : '#94a3b8',
                      }}
                    >
                      {r.active ? '● ENABLED' : '○ DISABLED'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${r.active ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      onClick={() => handleToggle(r._id || r.ruleId)}
                    >
                      <Power size={12} />
                      <span>{r.active ? 'Disable' : 'Enable'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '550px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', color: 'var(--gov-navy-900)' }}>
              Add Legal Metrology Compliance Rule
            </h3>

            <form onSubmit={handleAddRuleSubmit}>
              <div className="form-group">
                <label className="form-label">Rule Identifier</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={newRule.ruleId}
                  onChange={(e) => setNewRule({ ...newRule, ruleId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rule Title</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={newRule.title}
                  onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Statutory Reference</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={newRule.ruleNumber}
                  onChange={(e) => setNewRule({ ...newRule, ruleNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description & Legal Requirement</label>
                <textarea
                  className="form-input"
                  rows="2"
                  required
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Severity Level</label>
                  <select
                    className="form-input"
                    value={newRule.severity}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Validation Type</label>
                  <select
                    className="form-input"
                    value={newRule.validationType}
                    onChange={(e) => setNewRule({ ...newRule, validationType: e.target.value })}
                  >
                    <option value="PRESENCE_CHECK">Presence Check</option>
                    <option value="REGEX_PATTERN">Regex Pattern</option>
                    <option value="UNIT_VERIFICATION">Unit Verification</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Rule to Engine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesManager;
