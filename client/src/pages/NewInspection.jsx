import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Scanner from '../components/Scanner';
import ImageReviewList from '../components/ImageReviewList';
import api from '../services/api';
import { inspectionService } from '../services/inspectionService';
import { extractionService } from '../services/extractionService';
import {
  Package,
  Camera,
  Layers,
  Save,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Barcode,
  Info,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';

const CATEGORIES = [
  'Food',
  'Beverages',
  'Cosmetics',
  'Household Products',
  'Personal Care',
  'Packaged Goods',
  'Other',
];

const NewInspection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we are adding images to an existing session via re-scan
  const searchParams = new URLSearchParams(location.search);
  const rescanInspectionId = searchParams.get('rescan');

  // Form State
  const [formData, setFormData] = useState({
    productName: '',
    brand: '',
    category: 'Food',
    manufacturer: '',
    packer: '',
    importer: '',
    storeName: 'Retail Store / Supermarket',
    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    inspectionType: 'RETAIL_STORE',
    barcode: '',
    remarks: '',
  });

  // Captured Images List
  const [capturedImages, setCapturedImages] = useState([]);
  const [activePanelToRetake, setActivePanelToRetake] = useState('FRONT');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingDirect, setIsProcessingDirect] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle image capture from Scanner
  const handleImageCaptured = (newImage) => {
    setCapturedImages((prev) => [...prev, newImage]);
    setErrorMessage('');
  };

  // Handle delete image
  const handleDeleteImage = (index) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle update panel type
  const handleUpdateImageType = (index, newType) => {
    setCapturedImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, imageType: newType } : img))
    );
  };

  // Handle retake
  const handleRetakeImage = (index, panelType) => {
    handleDeleteImage(index);
    setActivePanelToRetake(panelType);
    window.scrollTo({ top: 250, behavior: 'smooth' });
  };

  // One-click quick test: Load Sample Package with realistic test data & sample images
  const handleLoadSamplePackage = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await extractionService.loadSamplePackage();
      if (res.success && res.data) {
        const targetId = res.data.inspectionId || res.data._id;
        setSuccessMessage('Sample test commodity loaded with packaging images. Redirecting to analysis...');
        setTimeout(() => {
          navigate(`/inspections/${targetId}/extraction-review?autoProcess=true`);
        }, 600);
      }
    } catch (err) {
      console.error('Failed to load sample test package:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load test commodity.');
      setIsSubmitting(false);
    }
  };

  // Handle Submit & Option to Directly Process
  const handleSaveAndOrProcess = async (directToProcess = false) => {
    setErrorMessage('');

    if (capturedImages.length === 0 && !rescanInspectionId) {
      setErrorMessage('Please capture or upload at least one packaging image (e.g. Front, Back, or MRP panel) to proceed.');
      return;
    }

    if (directToProcess) {
      setIsProcessingDirect(true);
    } else {
      setIsSubmitting(true);
    }

    try {
      let targetId = rescanInspectionId;

      // 1. If not a rescan, create the inspection first
      if (!targetId) {
        const productName = formData.productName.trim() || 'Scanned Packaged Commodity';
        const inspectionPayload = {
          productName,
          brand: formData.brand.trim() || 'Unbranded',
          category: formData.category,
          manufacturer: formData.manufacturer.trim(),
          packer: formData.packer.trim(),
          importer: formData.importer.trim(),
          barcode: formData.barcode.trim(),
          storeName: formData.storeName.trim() || 'Retail Outlet',
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          inspectionType: formData.inspectionType,
          remarks: formData.remarks.trim(),
        };

        const createRes = await inspectionService.createInspection(inspectionPayload);
        if (!createRes.success || !createRes.data) {
          throw new Error(createRes.message || 'Failed to initialize inspection session.');
        }

        const createdInspection = createRes.data;
        targetId = createdInspection.inspectionId || createdInspection._id;
      }

      // 2. Upload captured images to the session
      const imageFiles = [];
      const imageTypes = [];

      capturedImages.forEach((img) => {
        if (img.file) {
          imageFiles.push(img.file);
          imageTypes.push(img.imageType || 'FRONT');
        }
      });

      if (imageFiles.length > 0) {
        const formDataUpload = new FormData();
        imageFiles.forEach((file) => formDataUpload.append('images', file));
        formDataUpload.append('imageTypes', JSON.stringify(imageTypes));

        await api.post(`/inspections/${targetId}/images`, formDataUpload);
      }

      if (directToProcess) {
        setSuccessMessage('Images uploaded! Launching OCR & AI extraction analysis...');
        setTimeout(() => {
          navigate(`/inspections/${targetId}/extraction-review?autoProcess=true`);
        }, 500);
      } else {
        setSuccessMessage('Inspection session saved successfully!');
        setTimeout(() => {
          navigate(`/inspections/${targetId}`);
        }, 600);
      }
    } catch (err) {
      console.error('Inspection save error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save packaging images.';
      setErrorMessage(msg);
      setIsSubmitting(false);
      setIsProcessingDirect(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="page-title">
              {rescanInspectionId ? `Re-Scan Session (${rescanInspectionId})` : 'New Packaged Commodity Scan'}
            </h1>
            <span className="badge badge-neutral">Phase 3: OCR & AI Extraction</span>
          </div>
          <p className="page-desc">
            Capture packaging panel photos (Front, Back, MRP Close-up, Side). The OCR and AI engine will automatically extract declarations printed on the package.
          </p>
        </div>

        {/* Quick Sample Demo Action */}
        {!rescanInspectionId && (
          <div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLoadSamplePackage}
              disabled={isSubmitting || isProcessingDirect}
              title="Load pre-configured test commodity with sample packaging images"
            >
              <Sparkles size={16} color="#0284c7" />
              <span>Load Sample Test Package</span>
            </button>
          </div>
        )}
      </div>

      {/* Alert Notices */}
      {errorMessage && (
        <div className="alert-notice" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="alert-notice info">
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <div>{successMessage}</div>
        </div>
      )}

      {/* Rescan Banner */}
      {rescanInspectionId && (
        <div
          style={{
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            padding: '16px 20px',
            borderRadius: '10px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <RotateCcw size={20} color="#b45309" />
          <div style={{ fontSize: '0.88rem', color: '#92400e' }}>
            <strong>Re-Scan Mode:</strong> Capturing new images will append evidence to the existing inspection session <strong>{rescanInspectionId}</strong> and trigger an updated extraction version (v2).
          </div>
        </div>
      )}

      {/* Section 1: Camera Scanner */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">1. Camera Scanner & Multi-Panel Capture</h3>
            <p className="card-subtitle">
              Capture or upload packaging photos: Front display, Back/Manufacturer declarations, MRP close-up, and Nutrition panels
            </p>
          </div>
          <span className="badge badge-neutral">Auto-Detect Declarations</span>
        </div>

        <Scanner
          onImageCaptured={handleImageCaptured}
          initialPanelType={activePanelToRetake}
        />
      </div>

      {/* Section 2: Captured Images Review */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">2. Staged Package Images ({capturedImages.length})</h3>
            <p className="card-subtitle">
              Verify that mandatory declaration areas are clear and readable before processing
            </p>
          </div>
          {capturedImages.length > 0 && (
            <span className="badge badge-compliant">
              {capturedImages.length} Panel(s) Ready
            </span>
          )}
        </div>

        <ImageReviewList
          images={capturedImages}
          onDeleteImage={handleDeleteImage}
          onUpdateImageType={handleUpdateImageType}
          onRetakeImage={handleRetakeImage}
        />
      </div>

      {/* Section 3: Inspection Metadata (Optional / Auto-Extracted) */}
      {!rescanInspectionId && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">3. Inspection Location & Metadata (Optional)</h3>
              <p className="card-subtitle">
                Product declarations are automatically extracted from scanned images. You may provide store location context below.
              </p>
            </div>
            <span className="badge badge-neutral">Field Metadata</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '18px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="productName">
                Product Name / Commodity (Optional - will auto-extract)
              </label>
              <input
                id="productName"
                type="text"
                className="form-input"
                placeholder="e.g. Premium Basmati Rice, Almond Butter (or leave blank to auto-detect)"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="storeName">
                Inspection Store / Location
              </label>
              <input
                id="storeName"
                type="text"
                className="form-input"
                placeholder="e.g. Reliance Fresh, Big Bazaar, Central Market"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="city">
                City / District
              </label>
              <input
                id="city"
                type="text"
                className="form-input"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Action Footer with PROCESS PRODUCT */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--white)',
          padding: '20px 24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
          <strong>Workflow:</strong> Clicking <strong>[ PROCESS PRODUCT ]</strong> runs image preprocessing, OCR, and AI declaration extraction on all staged images.
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/inspections')}
            disabled={isSubmitting || isProcessingDirect}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleSaveAndOrProcess(false)}
            disabled={isSubmitting || isProcessingDirect || capturedImages.length === 0}
          >
            <Save size={16} />
            <span>Save Session Only</span>
          </button>

          {/* Primary Action: PROCESS PRODUCT */}
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => handleSaveAndOrProcess(true)}
            disabled={isSubmitting || isProcessingDirect || capturedImages.length === 0}
            style={{ background: 'linear-gradient(135deg, #0b2545 0%, #134074 100%)' }}
          >
            {isProcessingDirect ? (
              <span>Processing Images...</span>
            ) : (
              <>
                <Sparkles size={18} color="#38bdf8" />
                <span>Process Product ({capturedImages.length} Images)</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewInspection;
