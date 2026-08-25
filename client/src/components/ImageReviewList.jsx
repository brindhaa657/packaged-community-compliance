import React from 'react';
import {
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
  Layers,
} from 'lucide-react';

const PANEL_OPTIONS = [
  { value: 'FRONT', label: 'Front Panel' },
  { value: 'BACK', label: 'Back / Mfg Panel' },
  { value: 'SIDE', label: 'Side Panel' },
  { value: 'TOP', label: 'Top Panel' },
  { value: 'BOTTOM', label: 'Bottom Panel' },
  { value: 'MRP_CLOSEUP', label: 'MRP / Label Close-up' },
  { value: 'OTHER', label: 'Other Panel' },
];

const ImageReviewList = ({ images = [], onDeleteImage, onUpdateImageType, onRetakeImage }) => {
  if (!images || images.length === 0) {
    return (
      <div
        style={{
          border: '2px dashed var(--slate-300)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--slate-50)',
          color: 'var(--slate-500)',
          marginTop: '16px',
        }}
      >
        <ImageIcon size={36} style={{ margin: '0 auto 10px', color: 'var(--slate-400)' }} />
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gov-navy-900)', marginBottom: '4px' }}>
          No Packaging Images Captured Yet
        </div>
        <div style={{ fontSize: '0.82rem', maxWidth: '400px', margin: '0 auto' }}>
          Use the Camera Scanner above or click "Upload from device" to add Front, Back, Side, and MRP close-up images.
        </div>
      </div>
    );
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gov-navy-900)' }}>
          Captured Packaging Images ({images.length})
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
          Review panel assignments before submitting inspection
        </div>
      </div>

      <div className="captured-thumbnails-grid">
        {images.map((img, index) => (
          <div key={img._id || index} className="thumbnail-card">
            {/* Image Preview */}
            <div className="thumbnail-preview-wrapper">
              <img
                src={img.dataUrl || img.imageUrl}
                alt={img.originalName || `Packaging Panel ${index + 1}`}
                className="thumbnail-img"
              />

              {/* Panel Type Badge */}
              <div className="thumbnail-type-badge">
                {img.imageType ? img.imageType.replace(/_/g, ' ') : 'FRONT'}
              </div>

              {/* Delete Button */}
              <button
                type="button"
                className="thumbnail-delete-btn"
                onClick={() => onDeleteImage && onDeleteImage(index, img._id)}
                title="Remove image"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Metadata and Controls */}
            <div className="thumbnail-meta-body">
              <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {img.originalName || `Panel_${index + 1}.jpg`}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                <span>{img.dimensions || 'Image'}</span>
                <span>{formatFileSize(img.sizeBytes)}</span>
              </div>

              {/* Re-assign Image Type */}
              <div style={{ marginTop: '6px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--slate-600)', display: 'block', marginBottom: '2px' }}>
                  Panel Tag:
                </label>
                <select
                  className="thumbnail-select-type"
                  value={img.imageType || 'FRONT'}
                  onChange={(e) => onUpdateImageType && onUpdateImageType(index, e.target.value)}
                >
                  {PANEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Retake Button (if camera source) */}
              {img.source === 'CAMERA' && onRetakeImage && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '6px', fontSize: '0.7rem', padding: '4px 8px' }}
                  onClick={() => onRetakeImage(index, img.imageType)}
                >
                  <RefreshCw size={12} />
                  <span>Retake Image</span>
                </button>
              )}

              {/* Quality Advisory Notice Badge */}
              {img.qualityWarning && (
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '0.68rem',
                    color: '#b45309',
                    background: '#fef3c7',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <AlertTriangle size={11} style={{ flexShrink: 0 }} />
                  <span>Low resolution warning</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageReviewList;
