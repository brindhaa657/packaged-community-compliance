import React from 'react';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import {
  ShieldAlert,
  Users2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Building2,
  Eye,
  Filter,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const SupervisorDashboard = () => {
  const { user } = useAuth();

  const complianceChartData = [
    { name: 'Compliant / Passed', value: 142, color: '#10b981' },
    { name: 'Potential Non-Compliance', value: 38, color: '#ef4444' },
    { name: 'Requires Verification', value: 20, color: '#f59e0b' },
  ];

  const violationsByCategoryData = [
    { category: 'MRP & Pricing', count: 18 },
    { category: 'Net Qty Units', count: 14 },
    { category: 'Consumer Care', count: 11 },
    { category: 'Mfg / Packer Info', count: 9 },
    { category: 'Country of Origin', count: 6 },
  ];

  const flaggedViolationsQueue = [
    {
      id: 'INSP-2024-0891',
      productName: 'NutriDelight Almond Butter 500g',
      officerName: 'Insp. Vikram Singh (LM-OFF-742)',
      violationType: 'Rule 6(1)(n) Consumer Care & Rule 6(1)(e) USP Font Size',
      location: 'Reliance Fresh, CP',
      severity: 'CRITICAL',
      status: 'POTENTIAL_NON_COMPLIANCE',
      date: 'Today, 11:20 AM',
    },
    {
      id: 'INSP-2024-0865',
      productName: 'Imported Hazelnut Choco Spread 350g',
      officerName: 'Insp. Meera Patel (LM-OFF-612)',
      violationType: 'Rule 6(10) Country of Origin missing on front display panel',
      location: 'Modern Bazaar, Vasant Kunj',
      severity: 'HIGH',
      status: 'POTENTIAL_NON_COMPLIANCE',
      date: 'Yesterday, 05:40 PM',
    },
    {
      id: 'INSP-2024-0849',
      productName: 'Crunchy Protein Crisps 150g',
      officerName: 'Insp. Arvind Kumar (LM-OFF-519)',
      violationType: 'Rule 12 Standard Unit casing violation (declared as "GMS" instead of "g")',
      location: 'Spencer Retail, Noida',
      severity: 'MEDIUM',
      status: 'POTENTIAL_NON_COMPLIANCE',
      date: '23 Aug 2024',
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Supervisory Compliance Oversight</h1>
          <p className="page-desc">
            Supervising {user?.name || 'Regional Supervisor'} • {user?.jurisdiction || 'Northern Regional Zone'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary">
            <Filter size={16} />
            <span>Filter by Division</span>
          </button>
          <button className="btn btn-primary">
            <FileSpreadsheet size={16} />
            <span>Export Regional Audit Report</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <StatsCard
          title="Total Regional Inspections"
          value="200"
          subtitle="Across 8 enforcement circles"
          icon={Building2}
          color="blue"
        />
        <StatsCard
          title="Overall Compliance Rate"
          value="71.0%"
          subtitle="+4.2% from previous month"
          icon={TrendingUp}
          color="emerald"
        />
        <StatsCard
          title="Potential Non-Compliances"
          value="38"
          subtitle="12 critical / statutory notices"
          icon={ShieldAlert}
          color="red"
        />
        <StatsCard
          title="Active Field Officers"
          value="18"
          subtitle="All circles reporting"
          icon={Users2}
          color="purple"
        />
      </div>

      {/* Two Column Visual Analytics Grid */}
      <div className="dashboard-grid-2col">
        {/* Compliance Distribution Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Enforcement Screening Distribution</h3>
              <p className="card-subtitle">AI-assisted screening results breakdown across all monitored packaging</p>
            </div>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complianceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {complianceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violations by Legal Rule Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Top Flagged Violations by Rule</h3>
              <p className="card-subtitle">Under Legal Metrology Rules, 2011</p>
            </div>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationsByCategoryData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#dc2626" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Flagged Violations Review Queue */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Flagged Non-Compliance Review Queue</h3>
            <p className="card-subtitle">Field officer inspections requiring supervisory confirmation and notice issuance</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Inspection ID</th>
                <th>Product & Location</th>
                <th>Reporting Officer</th>
                <th>Statutory Violation Details</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {flaggedViolationsQueue.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700, color: 'var(--gov-navy-800)' }}>{item.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.productName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{item.location} • {item.date}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{item.officerName}</td>
                  <td style={{ maxWidth: '300px', fontSize: '0.82rem', color: '#b91c1c', fontWeight: 500 }}>
                    {item.violationType}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: item.severity === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
                        color: item.severity === 'CRITICAL' ? '#dc2626' : '#d97706',
                        border: `1px solid ${item.severity === 'CRITICAL' ? '#fecaca' : '#fde68a'}`,
                      }}
                    >
                      {item.severity}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm">
                      <Eye size={14} />
                      <span>Review Audit</span>
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

export default SupervisorDashboard;
