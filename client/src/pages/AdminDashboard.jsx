import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import {
  Users,
  Sliders,
  Server,
  ShieldCheck,
  Plus,
  Edit2,
  CheckCircle2,
  Lock,
  Cpu,
  Power,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  // Configured Legal Metrology Rules (Packaged Commodities) Rules, 2011
  const [rules, setRules] = useState([
    {
      id: 'LMR-2011-R06-01',
      title: 'Mandatory Commodity Name Declaration',
      category: 'MANDATORY_DECLARATIONS',
      ruleRef: 'Rule 6(1)(a)',
      validation: 'PRESENCE_CHECK',
      severity: 'CRITICAL',
      active: true,
    },
    {
      id: 'LMR-2011-R06-02',
      title: 'Manufacturer / Packer Name & Physical Address',
      category: 'MANUFACTURER_PACKER_IDENTITY',
      ruleRef: 'Rule 6(1)(b)',
      validation: 'PRESENCE_CHECK',
      severity: 'HIGH',
      active: true,
    },
    {
      id: 'LMR-2011-R06-03',
      title: 'Net Quantity in Standard Metric SI Units',
      category: 'NET_QUANTITY_UNITS',
      ruleRef: 'Rule 6(1)(c) & Rule 12',
      validation: 'UNIT_VERIFICATION',
      severity: 'CRITICAL',
      active: true,
    },
    {
      id: 'LMR-2011-R06-04',
      title: 'Maximum Retail Price (MRP) "incl. of all taxes"',
      category: 'MRP_AND_PRICING',
      ruleRef: 'Rule 6(1)(e)',
      validation: 'REGEX_PATTERN',
      severity: 'CRITICAL',
      active: true,
    },
    {
      id: 'LMR-2011-R06-05',
      title: 'Month and Year of Manufacture / Pre-packing',
      category: 'MANDATORY_DECLARATIONS',
      ruleRef: 'Rule 6(1)(d)',
      validation: 'PRESENCE_CHECK',
      severity: 'HIGH',
      active: true,
    },
    {
      id: 'LMR-2011-R06-06',
      title: 'Consumer Care Cell (Email, Phone, Postal Address)',
      category: 'CONSUMER_CARE',
      ruleRef: 'Rule 6(1)(n)',
      validation: 'PRESENCE_CHECK',
      severity: 'HIGH',
      active: true,
    },
    {
      id: 'LMR-2011-R06-07',
      title: 'Country of Origin for Imported Packaged Commodities',
      category: 'COUNTRY_OF_ORIGIN',
      ruleRef: 'Rule 6(10) & 2017 Amendment',
      validation: 'PRESENCE_CHECK',
      severity: 'HIGH',
      active: true,
    },
  ]);

  const [officers] = useState([
    {
      name: 'Inspector Vikram Singh',
      email: 'officer@legalmetrix.gov.in',
      role: 'OFFICER',
      badge: 'LM-OFF-742',
      jurisdiction: 'Delhi NCR Enforcement Division',
      status: 'ACTIVE',
    },
    {
      name: 'Dr. Ananya Iyer',
      email: 'supervisor@legalmetrix.gov.in',
      role: 'SUPERVISOR',
      badge: 'LM-SUP-108',
      jurisdiction: 'Northern Regional Zone',
      status: 'ACTIVE',
    },
    {
      name: 'Rajesh Sharma',
      email: 'admin@legalmetrix.gov.in',
      role: 'ADMIN',
      badge: 'LM-ADM-001',
      jurisdiction: 'National Headquarters - New Delhi',
      status: 'ACTIVE',
    },
  ]);

  const toggleRule = (ruleId) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r))
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">System Administration & Rule Configuration</h1>
          <p className="page-desc">
            Administrator: {user?.name} ({user?.badgeNumber || 'LM-ADM-001'}) • {user?.jurisdiction || 'National Headquarters'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary">
            <Plus size={16} />
            <span>Add Compliance Rule</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          title="Active Compliance Rules"
          value={rules.filter((r) => r.active).length}
          subtitle="Legal Metrology Rules 2011 Engine"
          icon={Sliders}
          color="blue"
        />
        <StatsCard
          title="Authorized Enforcement Users"
          value={officers.length}
          subtitle="Officers, Supervisors & Admins"
          icon={Users}
          color="emerald"
        />
        <StatsCard
          title="AI / OCR Engine Status"
          value="Online (Mock)"
          subtitle="Pluggable Provider Architecture"
          icon={Cpu}
          color="purple"
        />
        <StatsCard
          title="System Security"
          value="JWT + RBAC"
          subtitle="Strict Role Protection Active"
          icon={Lock}
          color="amber"
        />
      </div>

      {/* Configurable Compliance Rules Table */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Configurable Legal Metrology Compliance Rules</h3>
            <p className="card-subtitle">
              Dynamic rules applied by the compliance engine to OCR extracted packaged commodity declarations
            </p>
          </div>
          <span className="badge badge-compliant">Active Engine v2011.1</span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Title & Description</th>
                <th>Category</th>
                <th>Statutory Legal Reference</th>
                <th>Validation Logic</th>
                <th>Severity</th>
                <th>Rule Status</th>
                <th>Toggle</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td style={{ fontWeight: 700, color: 'var(--gov-navy-800)', fontSize: '0.8rem' }}>
                    {rule.id}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{rule.title}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                      {rule.category}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gov-navy-700)', fontWeight: 600 }}>
                      {rule.ruleRef}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--slate-600)' }}>
                    <code>{rule.validation}</code>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: rule.severity === 'CRITICAL' ? '#fef2f2' : '#eff6ff',
                        color: rule.severity === 'CRITICAL' ? '#dc2626' : '#2563eb',
                        border: `1px solid ${rule.severity === 'CRITICAL' ? '#fecaca' : '#bfdbfe'}`,
                      }}
                    >
                      {rule.severity}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: rule.active ? '#059669' : '#94a3b8',
                      }}
                    >
                      {rule.active ? '● ENABLED' : '○ DISABLED'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${rule.active ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => toggleRule(rule.id)}
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    >
                      <Power size={12} />
                      <span>{rule.active ? 'Disable' : 'Enable'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enforcement Users Directory */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Enforcement Personnel & Role Directory</h3>
            <p className="card-subtitle">Active officers, supervisors, and administrative personnel</p>
          </div>
          <button className="btn btn-secondary btn-sm">
            <Plus size={14} />
            <span>Register New Personnel</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Officer Name</th>
                <th>Government Email</th>
                <th>Role</th>
                <th>Badge / ID</th>
                <th>Assigned Jurisdiction</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {officers.map((off, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{off.name}</td>
                  <td style={{ fontSize: '0.85rem' }}>{off.email}</td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          off.role === 'ADMIN'
                            ? '#fef3c7'
                            : off.role === 'SUPERVISOR'
                            ? '#f3e8ff'
                            : '#e0f2fe',
                        color:
                          off.role === 'ADMIN'
                            ? '#92400e'
                            : off.role === 'SUPERVISOR'
                            ? '#6b21a8'
                            : '#075985',
                      }}
                    >
                      {off.role}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>{off.badge}</td>
                  <td style={{ fontSize: '0.85rem' }}>{off.jurisdiction}</td>
                  <td>
                    <span className="badge badge-compliant">ACTIVE</span>
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

export default AdminDashboard;
