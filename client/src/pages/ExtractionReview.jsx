import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { extractionService } from '../services/extractionService';
import { inspectionService } from '../services/inspectionService';
import ProcessingScreen from '../components/ProcessingScreen';
import StatusBadge from '../components/StatusBadge';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Eye,
  Edit3,
  Check,
  X,
  Camera,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  FileText,
  Layers,
  Info,
  ExternalLink,
  Save,
  Clock,
  Building2,
  Package,
  Calendar,
  PhoneCall,
  Hash,
} from 'lucide-react';

const CONFIDENCE_LEVELS = {
  HIGH: { label: 'High Confidence', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  MEDIUM: { label: 'Medium Confidence', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  LOW: { label: 'Low Confidence', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5' },
  NOT_DETECTED: { label: 'Not Detected (Review Required)', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  CORRECTED: { label: 'Officer Corrected', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
};

const getConfidenceMeta = (confidence, status, isCorrected) => {
  if (isCorrected) return CONFIDENCE_LEVELS.CORRECTED;
  if (status === 'NOT_DETECTED' || confidence === 0) return CONFIDENCE_LEVELS.NOT_DETECTED;
  if (confidence >= 85) return CONFIDENCE_LEVELS.HIGH;
  if (confidence >= 70) return CONFIDENCE_LEVELS.MEDIUM;
  return CONFIDENCE_LEVELS.LOW;
};

const FIELD_GROUPS = [
  {
    groupId: 'identity',
    title: '1. Commodity & Brand Identification',
    fields: ['productName', 'brand', 'countryOfOrigin', 'batchNumber'],
  },
  {
    groupId: 'manufacturer',
    title: '2. Manufacturer, Packer & Importer',
    fields: ['manufacturer', 'manufacturerAddress', 'packer', 'packerAddress', 'importer', 'importerAddress'],
  },
  {
    groupId: 'quantity_price',
    title: '3. Net Quantity & Pricing',
    fields: ['netQuantity', 'mrp', 'unitSalePrice'],
  },
  {
    groupId: 'dates',
    title: '4. Manufacturing & Expiry Dates',
    fields: ['manufacturingDate', 'packingDate', 'expiryDate', 'importDate'],
  },
  {
    groupId: 'consumercare',
    title: '5. Consumer Care & Digital Declarations',
    fields: ['consumerCare', 'email', 'website', 'otherDeclarations'],
  },
];

const ExtractionReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // URL query params (e.g. ?autoProcess=true)
  const searchParams = new URLSearchParams(location.search);
  const autoProcess = searchParams.get('autoProcess') === 'true';

  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(autoProcess);
  const [processingError, setProcessingError] = useState('');
  const [inspection, setInspection] = useState(null);
  const [declarations, setDeclarations] = useState({});
  const [declarationList, setDeclarationList] = useState([]);
  const [ocrResults, setOcrResults] = useState([]);
  const [images, setImages] = useState([]);
  const [extractionVersion, setExtractionVersion] = useState(1);

  // Modals & Editing state
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [viewingEvidence, setViewingEvidence] = useState(null); // image + box
  const [showRawOcrModal, setShowRawOcrModal] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [isSavingConfirmation, setIsSavingConfirmation] = useState(false);

  // Load Inspection & Extraction Data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch inspection details
      const inspRes = await inspectionService.getInspectionById(id);
      if (inspRes.success && inspRes.data) {
        setInspection(inspRes.data);
        setImages(inspRes.data.images || []);
        setExtractionVersion(inspRes.data.currentExtractionVersion || 1);
      }

      // 2. Fetch OCR Results
      try {
        const ocrRes = await extractionService.getOCRResults(id);
        if (ocrRes.success) setOcrResults(ocrRes.data || []);
      } catch (e) {
        console.warn('OCR results not yet generated:', e.message);
      }

      // 3. Fetch Extracted Declarations
      try {
        const declRes = await extractionService.getDeclarations(id);
        if (declRes.success && declRes.data && declRes.data.length > 0) {
          setDeclarationList(declRes.data);
          const declMap = {};
          declRes.data.forEach((d) => {
            declMap[d.fieldName] = {
              _id: d._id,
              value: d.officerValue || d.aiValue || d.extractedValue,
              aiValue: d.aiValue,
              officerValue: d.officerValue,
              status: d.status,
              confidence: d.confidence,
              sourceImageId: d.sourceImageId,
              boundingBox: d.boundingBox,
              fieldLabel: d.fieldLabel || d.fieldName,
              legalRule: d.legalRule,
            };
          });
          setDeclarations(declMap);
        } else if (inspRes.data?.declarationsData && Object.keys(inspRes.data.declarationsData).length > 0) {
          setDeclarations(inspRes.data.declarationsData);
        }
      } catch (e) {
        console.warn('Declarations not yet available:', e.message);
      }
    } catch (err) {
      console.error('Failed to load extraction review data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run or Trigger Pipeline
  const runPipeline = async () => {
    setIsProcessing(true);
    setProcessingError('');
    try {
      const res = await extractionService.processScanSession(id);
      if (res.success && res.data) {
        setDeclarations(res.data.declarations || {});
        setDeclarationList(res.data.declarationList || []);
        setOcrResults(res.data.ocrResults || []);
        setExtractionVersion(res.data.extractionVersion || 1);
        if (res.data.images) setImages(res.data.images);
      }
    } catch (err) {
      console.error('Pipeline processing error:', err);
      setProcessingError(err.response?.data?.message || err.message || 'Error processing package images.');
    }
  };

  useEffect(() => {
    if (autoProcess) {
      runPipeline();
    } else {
      loadData();
    }
  }, [id]);

  // Handle Edit Field Click
  const handleOpenEdit = (fieldName, fieldData) => {
    setEditingField(fieldName);
    setEditValue(fieldData?.officerValue || fieldData?.value || fieldData?.aiValue || '');
    setEditRemarks('');
  };

  // Handle Save Field Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingField) return;

    try {
      const currentDecl = declarations[editingField];
      const targetId = currentDecl?._id || editingField;

      const res = await extractionService.updateDeclaration(targetId, {
        fieldName: editingField,
        officerValue: editValue.trim(),
        remarks: editRemarks.trim(),
      });

      if (res.success) {
        // Update local declarations state
        setDeclarations((prev) => ({
          ...prev,
          [editingField]: {
            ...prev[editingField],
            value: editValue.trim(),
            officerValue: editValue.trim(),
            status: 'OFFICER_CORRECTED',
          },
        }));

        setActionSuccessMsg(`Declaration field "${editingField}" updated with Officer value.`);
        setTimeout(() => setActionSuccessMsg(''), 3500);
        setEditingField(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save declaration edit.');
    }
  };

  // Handle Re-Scan Click
  const handleReScan = async () => {
    try {
      await extractionService.triggerRescan(id, 'Officer requested additional packaging imagery');
      navigate(`/inspections/new?rescan=${id}`);
    } catch (err) {
      console.error('Re-scan trigger failed:', err);
      navigate(`/inspections/new?rescan=${id}`);
    }
  };

  // Handle Confirm Extraction
  const handleConfirmExtraction = async () => {
    setIsSavingConfirmation(true);
    try {
      await extractionService.confirmExtraction(id, declarations);
      setActionSuccessMsg('Product declarations confirmed by Officer! Redirecting to Inspection details...');
      setTimeout(() => {
        navigate(`/inspections/${id}`);
      }, 1000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm extraction.');
      setIsSavingConfirmation(false);
    }
  };

  // Helper to find image object by sourceImageId or panel
  const getSourceImageMeta = (sourceImageId) => {
    if (!sourceImageId || images.length === 0) return null;
    return images.find((img) => img._id === sourceImageId || img.imageType === sourceImageId) || images[0];
  };

  // If currently running extraction pipeline
  if (isProcessing) {
    return (
      <ProcessingScreen
        onCompleted={() => {
          setIsProcessing(false);
          loadData();
        }}
        errorMessage={processingError}
      />
    );
  }

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
        <p style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Loading extracted declarations...</p>
      </div>
    );
  }

  const productName = declarations.productName?.value || inspection?.product?.productName || 'Packaged Commodity';
  const hasExtractions = Object.keys(declarations).length > 0;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: '8px' }}
            onClick={() => navigate(`/inspections/${id}`)}
          >
            <ArrowLeft size={14} />
            <span>Back to Inspection</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="page-title">Extracted Declarations Review</h1>
            <span
              style={{
                background: '#0b2545',
                color: '#38bdf8',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
              }}
            >
              Extraction Version: v{extractionVersion}
            </span>
          </div>
          <p className="page-desc">
            Inspection ID: <strong>{inspection?.inspectionId || id}</strong> • Commodity: <strong>{productName}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowRawOcrModal(true)}
            title="Inspect raw text detected by OCR"
          >
            <FileText size={16} />
            <span>View OCR Raw Text</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReScan}
          >
            <Camera size={16} />
            <span>Re-Scan / Add Images</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmExtraction}
            disabled={isSavingConfirmation || !hasExtractions}
          >
            <CheckCircle2 size={16} />
            <span>{isSavingConfirmation ? 'Confirming...' : 'Confirm Extraction'}</span>
          </button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {actionSuccessMsg && (
        <div className="alert-notice info" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <div>{actionSuccessMsg}</div>
        </div>
      )}

      {/* AI Extraction Disclaimer Notice */}
      <div
        style={{
          background: '#f8fafc',
          border: '1.5px solid #cbd5e1',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
              AI-Assisted Declaration Extraction & Evidence Verification
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>
              The system automatically reads packaging text and links each declaration to source image evidence. Review or correct any value before proceeding.
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
          <em>* Note: AI extracts text only. Legal compliance screening is evaluated separately.</em>
        </div>
      </div>

      {/* If No Extractions Exist Yet */}
      {!hasExtractions && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Sparkles size={48} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            No Declarations Extracted Yet
          </h3>
          <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
            Package images have been uploaded. Click below to run the OCR and AI extraction pipeline across all panels.
          </p>
          <button type="button" className="btn btn-primary btn-lg" onClick={runPipeline}>
            <Sparkles size={18} />
            <span>Process Product (Run OCR + AI)</span>
          </button>
        </div>
      )}

      {/* Main Extracted Declarations Group View */}
      {hasExtractions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {FIELD_GROUPS.map((group) => {
            const groupFields = group.fields
              .map((fn) => ({ fieldName: fn, ...(declarations[fn] || {}) }))
              .filter((f) => f.fieldName in declarations || f.fieldLabel);

            if (groupFields.length === 0) return null;

            return (
              <div key={group.groupId} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '16px 20px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0b2545', margin: 0 }}>
                    {group.title}
                  </h3>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                    {groupFields.length} Fields
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {groupFields.map((field, idx) => {
                    const isCorrected = field.status === 'OFFICER_CORRECTED' || Boolean(field.officerValue);
                    const confidenceMeta = getConfidenceMeta(field.confidence, field.status, isCorrected);
                    const sourceImg = getSourceImageMeta(field.sourceImageId);
                    const displayValue = field.officerValue || field.value || field.aiValue;
                    const isDetected = field.status !== 'NOT_DETECTED' && displayValue;

                    return (
                      <div
                        key={field.fieldName}
                        style={{
                          padding: '18px 20px',
                          borderBottom: idx < groupFields.length - 1 ? '1px solid #f1f5f9' : 'none',
                          display: 'grid',
                          gridTemplateColumns: 'minmax(200px, 1.2fr) minmax(260px, 2fr) auto',
                          gap: '16px',
                          alignItems: 'center',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafcfc',
                        }}
                      >
                        {/* Field Label & Rule Info */}
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                            {field.fieldLabel || field.fieldName}
                          </div>
                          {field.legalRule && (
                            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>
                              {field.legalRule}
                            </div>
                          )}
                        </div>

                        {/* Extracted Value & AI vs Officer comparison */}
                        <div>
                          {isDetected ? (
                            <div>
                              <div
                                style={{
                                  fontSize: '0.96rem',
                                  fontWeight: 600,
                                  color: isCorrected ? '#5b21b6' : '#0f172a',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {displayValue}
                              </div>

                              {isCorrected && field.aiValue && (
                                <div
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#6b7280',
                                    marginTop: '4px',
                                    display: 'flex',
                                    gap: '6px',
                                    alignItems: 'center',
                                  }}
                                >
                                  <span>Original AI:</span>
                                  <span style={{ textDecoration: 'line-through' }}>{field.aiValue}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.88rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              Not detected on packaging panels
                            </span>
                          )}

                          {/* Confidence & Source Badges Row */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                            {/* Confidence Badge */}
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: confidenceMeta.color,
                                backgroundColor: confidenceMeta.bg,
                                border: `1px solid ${confidenceMeta.border}`,
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              {confidenceMeta.label}
                              {field.confidence > 0 && !isCorrected && ` (${field.confidence}%)`}
                            </span>

                            {/* Source Image Badge */}
                            {sourceImg && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  color: '#334155',
                                  backgroundColor: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                }}
                              >
                                <span>Source:</span>
                                <strong style={{ color: '#0f172a' }}>
                                  {sourceImg.imageType ? sourceImg.imageType.replace(/_/g, ' ') : 'Panel'}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons (View Source, Edit) */}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {sourceImg && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                              onClick={() => setViewingEvidence({ image: sourceImg, box: field.boundingBox, fieldLabel: field.fieldLabel || field.fieldName })}
                              title="View Source Image Evidence"
                            >
                              <Eye size={13} />
                              <span>View Source</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                            onClick={() => handleOpenEdit(field.fieldName, field)}
                            title="Edit / Correct extracted value"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Sticky Action Footer */}
      {hasExtractions && (
        <div
          style={{
            marginTop: '32px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            <strong>Officer Action:</strong> Review confidence levels and edit any discrepancies against physical package.
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReScan}
            >
              <RotateCcw size={16} />
              <span>Re-Scan Package</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleConfirmExtraction}
              disabled={isSavingConfirmation}
            >
              <CheckCircle2 size={18} />
              <span>{isSavingConfirmation ? 'Confirming...' : 'Confirm Extraction & Proceed'}</span>
            </button>
          </div>
        </div>
      )}

      {/* EDIT DECLARATION MODAL */}
      {editingField && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0b2545', margin: 0 }}>
                  Officer Correction
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Field: <strong>{declarations[editingField]?.fieldLabel || editingField}</strong>
                </p>
              </div>
              <button
                type="button"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                onClick={() => setEditingField(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">
                  Original AI Extracted Value:
                </label>
                <div
                  style={{
                    background: '#f1f5f9',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '0.88rem',
                    color: '#475569',
                    fontWeight: 600,
                  }}
                >
                  {declarations[editingField]?.aiValue || '(Not detected by AI)'}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="officerValueInput">
                  Officer Verified Value *
                </label>
                <input
                  id="officerValueInput"
                  type="text"
                  className="form-input"
                  required
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter corrected value as printed on package..."
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" htmlFor="editRemarksInput">
                  Correction Reason / Notes (optional)
                </label>
                <textarea
                  id="editRemarksInput"
                  className="form-input"
                  rows="2"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="e.g. Corrected based on clear physical back panel review..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingField(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>Save Officer Correction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW EVIDENCE / SOURCE IMAGE MODAL */}
      {viewingEvidence && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '720px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                background: '#0b2545',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                  Source Image Evidence: {viewingEvidence.fieldLabel}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Panel: {viewingEvidence.image?.imageType?.replace(/_/g, ' ') || 'Packaging Panel'}
                </div>
              </div>
              <button
                type="button"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ffffff' }}
                onClick={() => setViewingEvidence(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#0f172a' }}>
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '460px' }}>
                <img
                  src={viewingEvidence.image?.imageUrl || viewingEvidence.image?.processedUrl}
                  alt="Packaging Evidence"
                  style={{
                    maxHeight: '460px',
                    maxWidth: '100%',
                    borderRadius: '8px',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />

                {/* Bounding Box Highlight Overlay */}
                {viewingEvidence.box && (
                  <svg
                    viewBox={
                      viewingEvidence.image?.imageType === 'MRP_CLOSEUP'
                        ? '0 0 800 700'
                        : viewingEvidence.image?.imageType === 'BACK'
                        ? '0 0 800 1100'
                        : '0 0 800 1000'
                    }
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                    }}
                  >
                    <rect
                      x={viewingEvidence.box.x}
                      y={viewingEvidence.box.y}
                      width={viewingEvidence.box.width}
                      height={viewingEvidence.box.height}
                      fill="rgba(56, 189, 248, 0.28)"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="6 4"
                      rx="6"
                    />
                    <rect
                      x={viewingEvidence.box.x}
                      y={Math.max(4, viewingEvidence.box.y - 30)}
                      width={Math.min(220, viewingEvidence.box.width + 40)}
                      height="26"
                      fill="#0284c7"
                      rx="4"
                    />
                    <text
                      x={viewingEvidence.box.x + 8}
                      y={Math.max(4, viewingEvidence.box.y - 30) + 18}
                      fill="#ffffff"
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      🎯 OCR EVIDENCE REGION
                    </text>
                  </svg>
                )}
              </div>
            </div>

            <div
              style={{
                padding: '14px 20px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Image File: <strong>{viewingEvidence.image?.originalName || 'Panel Image'}</strong>
                {viewingEvidence.box && (
                  <span style={{ marginLeft: '12px', color: '#0284c7', fontWeight: 700 }}>
                    • Box: ({viewingEvidence.box.x}, {viewingEvidence.box.y}, {viewingEvidence.box.width}×{viewingEvidence.box.height})
                  </span>
                )}
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setViewingEvidence(null)}
              >
                Close Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW RAW OCR TEXT MODAL */}
      {showRawOcrModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0b2545', margin: 0 }}>
                  Raw OCR Extraction Output
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Engine: <strong>{ocrResults[0]?.provider || 'Mock-OCR-Engine-v2011 [MOCK / TEST DATA]'}</strong>
                </p>
              </div>
              <button
                type="button"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                onClick={() => setShowRawOcrModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ocrResults.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center' }}>No OCR text blocks available.</p>
              ) : (
                ocrResults.map((ocr, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7' }}>
                        Panel: {ocr.imageType || `Image ${idx + 1}`}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Confidence: {Math.round((ocr.confidence || 0) * 100)}%
                      </span>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '0.82rem',
                        color: '#1e293b',
                        background: '#ffffff',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {ocr.rawText || 'No text detected'}
                    </pre>
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                padding: '14px 20px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowRawOcrModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractionReview;
