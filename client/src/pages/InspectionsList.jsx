import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inspectionService } from '../services/inspectionService';
import StatusBadge from '../components/StatusBadge';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  FileText,
  Calendar,
  Building2,
  RefreshCw,
} from 'lucide-react';

const InspectionsList = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await inspectionService.getInspections();
      if (res.success && res.data) {
        setInspections(res.data);
      }
    } catch (e) {
      console.error('Failed to load inspections:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = inspections.filter((item) => {
    const matchesSearch =
      (item.productDetailsSnapshot?.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.inspectionId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location?.storeName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'ALL') return matchesSearch;
    return matchesSearch && item.overallResult === filterStatus;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inspections & Screening Records</h1>
          <p className="page-desc">
            Historical log of field inspections conducted under the Legal Metrology (Packaged Commodities) Rules, 2011
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/inspections/new')}>
          <PlusCircle size={18} />
          <span>New Inspection</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
            <Search size={18} color="var(--slate-400)" />
            <input
              type="text"
              className="form-input"
              style={{ border: 'none', background: 'transparent', padding: '4px 0' }}
              placeholder="Search by commodity name, ID, or retail store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'POTENTIAL_NON_COMPLIANCE', 'COMPLIANT', 'REQUIRES_MANUAL_VERIFICATION'].map((status) => (
              <button
                key={status}
                className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem' }}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'ALL' ? 'All Records' : status.replace(/_/g, ' ')}
              </button>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={loadData} title="Refresh records">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Inspection Ref</th>
                <th>Packaged Commodity & Brand</th>
                <th>Retailer & Premises</th>
                <th>Inspection Date</th>
                <th>Screening Determination</th>
                <th>Confidence</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--slate-500)' }}>
                    No inspection records found matching the specified filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item._id || item.inspectionId}>
                    <td style={{ fontWeight: 700, color: 'var(--gov-navy-800)', fontSize: '0.85rem' }}>
                      {item.inspectionId}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.productDetailsSnapshot?.productName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        {item.productDetailsSnapshot?.brand} • {item.productDetailsSnapshot?.category}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div>{item.location?.storeName || 'Retail Mart'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        {item.location?.city}, {item.location?.state}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                      {new Date(item.inspectionDate || Date.now()).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <StatusBadge status={item.overallResult} />
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: (item.confidenceScore || 90) >= 90 ? '#059669' : '#d97706' }}>
                        {item.confidenceScore || 94}%
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/inspections/${item.inspectionId || item._id}`)}
                      >
                        <Eye size={14} />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InspectionsList;
