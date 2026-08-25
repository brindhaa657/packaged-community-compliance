import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inspectionService } from '../services/inspectionService';
import StatusBadge from '../components/StatusBadge';
import {
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  Layers,
  Image as ImageIcon,
  Building2,
  Barcode,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Trash2,
  PlusCircle,
  Camera,
} from 'lucide-react';

const InspectionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchInspection = async () => {
      setLoading(true);
      try {
        const res = await inspectionService.getInspectionById(id);
        if (res.success && res.data) {
          setInspection(res.data);
          if (res.data.images && res.data.images.length > 0) {
            setSelectedImage(res.data.images[0]);
          }
        }
      } catch (e) {
        console.error('Failed to load inspection:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchInspection();
  }, [id]);

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
        <p style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Loading inspection details and captured images...</p>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Inspection Record Not Found</h3>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/inspections')}>
          Back to Inspections History
        </button>
      </div>
    );
  }

  const product = inspection.product || inspection.productDetailsSnapshot || {};
  const images = inspection.images || [];

  return (
    <div>
      {/* Top Breadcrumb & Actions */}
      <div className="page-header">
        <div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: '8px' }}
            onClick={() => navigate('/inspections')}
          >
            <ArrowLeft size={14} />
            <span>Back to Inspections</span>
          </button>
          <h1 className="page-title">{product.productName || 'Inspected Commodity'}</h1>
          <p className="page-desc">
            Inspection ID: <strong>{inspection.inspectionId}</strong> • Created:{' '}
            {new Date(inspection.inspectionDate || inspection.createdAt || Date.now()).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/inspections/${inspection.inspectionId || id}/extraction-review`)}
          >
            <FileText size={16} />
            <span>Extracted Declarations (OCR+AI)</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/inspections/${inspection.inspectionId || id}/compliance`)}
          >
            <ShieldCheck size={16} />
            <span>Compliance Screening Results</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/inspections/new')}>
            <PlusCircle size={16} />
            <span>New Inspection</span>
          </button>
        </div>
      </div>

      {/* Status Notice Banner */}
      <div
        style={{
          background: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Camera size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#1e40af' }}>
              Inspection Phase
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>
              {inspection.status ? inspection.status.replace(/_/g, ' ') : 'IMAGE CAPTURED'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#3b82f6' }}>
              {images.length} Packaging Panel Image(s) Stored • Ready for AI/OCR Screening Module
            </div>
          </div>
        </div>

        <div>
          <StatusBadge status={inspection.status || 'IMAGE_CAPTURED'} />
        </div>
      </div>

      {/* Product & Inspection Metadata Grid */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Product & Inspection Summary</h3>
            <p className="card-subtitle">Officer field observations and commodity metadata</p>
          </div>
          <span className="badge badge-neutral">{product.category || 'Food'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Product Name
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gov-navy-900)', marginTop: '2px' }}>
              {product.productName || 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Brand
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--slate-800)', marginTop: '2px' }}>
              {product.brand || 'Unbranded'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Manufacturer / Packer
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--slate-700)', marginTop: '2px' }}>
              {product.manufacturer || product.packer || 'Not specified'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Barcode / SKU
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--slate-700)', marginTop: '2px' }}>
              {product.identifiers?.barcode || 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Inspection Location
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--slate-700)', marginTop: '2px' }}>
              {inspection.location?.storeName || 'Retail Outlet'} ({inspection.location?.city || 'Chennai'})
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Inspecting Officer
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gov-navy-800)', marginTop: '2px' }}>
              {inspection.officer?.name || 'Inspector'} ({inspection.officer?.badgeNumber || 'LM-OFF-742'})
            </div>
          </div>
        </div>

        {inspection.remarks && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--slate-100)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Officer Remarks
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-700)', background: 'var(--slate-50)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
              {inspection.remarks}
            </div>
          </div>
        )}
      </div>

      {/* Extracted Product Declarations Summary Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Phase 3: Extracted Product Declarations</h3>
            <p className="card-subtitle">
              Declarations automatically extracted by OCR & AI from package images with source evidence linking
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge badge-neutral">
              Version: v{inspection.currentExtractionVersion || 1}
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/inspections/${inspection.inspectionId || id}/extraction-review`)}
            >
              <FileText size={14} />
              <span>Review & Edit Declarations</span>
            </button>
          </div>
        </div>

        {inspection.declarationsData && Object.keys(inspection.declarationsData).length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {['productName', 'brand', 'netQuantity', 'mrp', 'manufacturer', 'consumerCare'].map((fieldKey) => {
              const field = inspection.declarationsData[fieldKey];
              if (!field) return null;
              const val = field.officerValue || field.value || field.aiValue;

              return (
                <div
                  key={fieldKey}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    {field.fieldLabel || fieldKey}
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginTop: '2px', wordBreak: 'break-word' }}>
                    {val || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not Detected</span>}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: field.status === 'OFFICER_CORRECTED' ? '#7c3aed' : '#16a34a', fontWeight: 600, marginTop: '4px' }}>
                    {field.status === 'OFFICER_CORRECTED' ? '✓ Officer Corrected' : field.confidence ? `Confidence: ${Math.round(field.confidence > 1 ? field.confidence : field.confidence * 100)}%` : field.status}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
            <p style={{ margin: 0, marginBottom: '12px', fontSize: '0.9rem' }}>
              No declarations extracted yet. Run the OCR and AI extraction pipeline on stored packaging images.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(`/inspections/${inspection.inspectionId || id}/extraction-review?autoProcess=true`)}
            >
              <FileText size={14} />
              <span>Process Package Images Now</span>
            </button>
          </div>
        )}
      </div>

      {/* Captured Packaging Images Gallery */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Captured Packaging Panels Gallery</h3>
            <p className="card-subtitle">
              Stored packaging images associated with this inspection session
            </p>
          </div>
          <span className="badge badge-compliant">{images.length} Image(s) Attached</span>
        </div>

        {images.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--slate-500)' }}>
            <ImageIcon size={36} style={{ margin: '0 auto 8px', color: 'var(--slate-400)' }} />
            <p>No packaging photos attached to this inspection session.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {images.map((img, idx) => (
              <div
                key={img._id || idx}
                style={{
                  border: '1.5px solid var(--slate-200)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  background: 'var(--white)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    height: '180px',
                    backgroundColor: '#0f172a',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.originalName || `Panel ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(11, 37, 69, 0.85)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {img.imageType ? img.imageType.replace(/_/g, ' ') : 'PANEL'}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--slate-600)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {img.originalName || `Packaging_Panel_${idx + 1}.jpg`}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                    Uploaded:{' '}
                    {new Date(img.uploadedAt || Date.now()).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionDetails;
