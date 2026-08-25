import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CameraOff,
  SwitchCamera,
  Upload,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

const PANEL_TYPES = [
  { id: 'FRONT', label: 'Front Panel' },
  { id: 'BACK', label: 'Back / Mfg' },
  { id: 'SIDE', label: 'Side Panel' },
  { id: 'TOP', label: 'Top' },
  { id: 'BOTTOM', label: 'Bottom' },
  { id: 'MRP_CLOSEUP', label: 'MRP Close-up' },
  { id: 'OTHER', label: 'Other' },
];

const SCAN_GUIDANCE_TIPS = [
  'Capture the entire package clearly.',
  'Make sure text is readable & well-lit.',
  'Keep the package inside the frame.',
  'For declarations & MRP, take a close-up image.',
];

const Scanner = ({ onImageCaptured, initialPanelType = 'FRONT' }) => {
  const [selectedPanelType, setSelectedPanelType] = useState(initialPanelType);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [videoDevices, setVideoDevices] = useState([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [guidanceTipIndex, setGuidanceTipIndex] = useState(0);
  const [qualityWarning, setQualityWarning] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Rotate guidance tips periodically
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setGuidanceTipIndex((prev) => (prev + 1) % SCAN_GUIDANCE_TIPS.length);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, []);

  // Enumerate camera devices
  const enumerateDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === 'videoinput');
        setVideoDevices(cameras);
      }
    } catch (e) {
      console.warn('Device enumeration not fully available:', e.message);
    }
  };

  // Start Camera Stream
  const startCamera = async (deviceId = null) => {
    setCameraError(null);

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your current browser. You can still upload product images manually from your device.');
      setIsCameraActive(false);
      return;
    }

    try {
      // Stop any existing stream
      stopCamera();

      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: 'environment' }, // Prefer rear camera on mobile
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsCameraActive(true);
      await enumerateDevices();
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. You can still upload product images manually from your device.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera device was detected on your system. Please use the file upload option.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is currently in use by another application. Please free the camera or upload manually.');
      } else {
        setCameraError('Could not initialize camera preview. You can capture or upload images manually.');
      }
      setIsCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Switch to next available camera
  const switchCamera = () => {
    if (videoDevices.length > 1) {
      const nextIndex = (currentDeviceIndex + 1) % videoDevices.length;
      setCurrentDeviceIndex(nextIndex);
      startCamera(videoDevices[nextIndex].deviceId);
    }
  };

  // Perform basic client-side quality check
  const performQualityCheck = (width, height, sizeBytes) => {
    let warning = null;
    if (width < 400 || height < 400) {
      warning = 'Image resolution is low. Text may be difficult to extract reliably.';
    } else if (sizeBytes && sizeBytes < 20 * 1024) {
      warning = 'Image file size is very small. Please ensure mandatory declarations are sharp and legible.';
    }
    setQualityWarning(warning);
    return warning;
  };

  // Capture Frame from Camera
  const captureFrame = () => {
    if (!videoRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const filename = `pkg-${selectedPanelType.toLowerCase()}-${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        const qualityWarn = performQualityCheck(width, height, blob.size);

        if (onImageCaptured) {
          onImageCaptured({
            file,
            dataUrl,
            imageType: selectedPanelType,
            originalName: filename,
            sizeBytes: blob.size,
            dimensions: `${width} × ${height}`,
            source: 'CAMERA',
            capturedAt: new Date(),
            qualityWarning: qualityWarn,
          });
        }

        // Auto-advance to next panel recommendation if available
        advancePanelType();
      },
      'image/jpeg',
      0.92
    );
  };

  // Handle Manual File Upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file, index) => {
      // Image validation (allow all standard image MIME types and extensions)
      const isImage = (file.type && file.type.startsWith('image/')) || /\.(jpe?g|png|webp|svg|bmp|gif|heic)$/i.test(file.name);
      if (!isImage) {
        alert(`File "${file.name}" is not an accepted image format.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const img = new Image();
        img.onload = () => {
          const width = img.naturalWidth;
          const height = img.naturalHeight;
          const qualityWarn = performQualityCheck(width, height, file.size);

          if (onImageCaptured) {
            onImageCaptured({
              file,
              dataUrl,
              imageType: selectedPanelType,
              originalName: file.name,
              sizeBytes: file.size,
              dimensions: `${width} × ${height}`,
              source: 'UPLOAD',
              capturedAt: new Date(),
              qualityWarning: qualityWarn,
            });
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });

    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper to suggest next logical panel
  const advancePanelType = () => {
    if (selectedPanelType === 'FRONT') setSelectedPanelType('BACK');
    else if (selectedPanelType === 'BACK') setSelectedPanelType('MRP_CLOSEUP');
    else if (selectedPanelType === 'MRP_CLOSEUP') setSelectedPanelType('SIDE');
  };

  return (
    <div className="scanner-container">
      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="scanner-canvas-hidden" />

      {/* Hidden File Input for Device Upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,image/jpeg,image/png,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Scanner Header */}
      <div className="scanner-header">
        <div className="scanner-title-badge">
          <Camera size={18} color="#38bdf8" />
          <span>Package Scanner & Image Capture</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className={`scanner-camera-status ${!isCameraActive ? 'off' : ''}`}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isCameraActive ? '#10b981' : '#ef4444' }} />
            <span>{isCameraActive ? 'Camera Live' : 'Camera Inactive'}</span>
          </div>

          {videoDevices.length > 1 && isCameraActive && (
            <button
              type="button"
              className="btn-scanner-action"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              onClick={switchCamera}
              title="Switch Camera Device"
            >
              <SwitchCamera size={14} />
              <span>Switch</span>
            </button>
          )}
        </div>
      </div>

      {/* Image Panel Selector Pills */}
      <div className="panel-selector-container">
        <span className="panel-selector-label">Target Panel:</span>
        {PANEL_TYPES.map((panel) => (
          <button
            key={panel.id}
            type="button"
            className={`panel-pill ${selectedPanelType === panel.id ? 'active' : ''}`}
            onClick={() => setSelectedPanelType(panel.id)}
          >
            {panel.label}
          </button>
        ))}
      </div>

      {/* Camera Viewport & Overlay */}
      <div className="scanner-viewport">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="scanner-video"
          playsInline
          muted
          autoPlay
          style={{ display: isCameraActive ? 'block' : 'none' }}
        />

        {/* Inactive or Error State Placeholder */}
        {!isCameraActive && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
            <CameraOff size={48} style={{ margin: '0 auto 12px', color: '#64748b' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>
              Camera Preview Off
            </div>
            <div style={{ fontSize: '0.82rem', maxWidth: '360px', margin: '0 auto 16px' }}>
              {cameraError || 'Activate camera for live packaging capture or upload image files directly from your device.'}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-accent btn-sm"
                onClick={() => startCamera()}
              >
                <Camera size={14} />
                <span>Start Camera</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                <span>Upload from device</span>
              </button>
            </div>
          </div>
        )}

        {/* Visual Scanning Frame Overlay (when camera is active) */}
        {isCameraActive && (
          <div className="scan-frame-overlay">
            {/* 4 Corner Reticles */}
            <div className="reticle-corner reticle-tl" />
            <div className="reticle-corner reticle-tr" />
            <div className="reticle-corner reticle-bl" />
            <div className="reticle-corner reticle-br" />

            {/* Dynamic Guidance Pill */}
            <div className="scan-frame-guidance">
              <Info size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              <span>{SCAN_GUIDANCE_TIPS[guidanceTipIndex]}</span>
            </div>
          </div>
        )}
      </div>

      {/* Quality Notice (if triggered) */}
      {qualityWarning && (
        <div style={{ padding: '0 20px' }}>
          <div className="quality-warning-box">
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>Quality Advisory:</strong> {qualityWarning} <em>(You may proceed or retake).</em>
            </div>
          </div>
        </div>
      )}

      {/* Camera Control Toolbar */}
      <div className="scanner-controls">
        <div className="camera-actions-row">
          {isCameraActive ? (
            <button
              type="button"
              className="btn-scanner-action"
              onClick={stopCamera}
            >
              <CameraOff size={16} />
              <span>Pause Camera</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-scanner-action"
              onClick={() => startCamera()}
            >
              <Camera size={16} />
              <span>Open Camera</span>
            </button>
          )}

          <button
            type="button"
            className="btn-scanner-action"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            <span>Upload from device</span>
          </button>
        </div>

        {/* Central Capture Trigger Button */}
        {isCameraActive && (
          <button
            type="button"
            className="btn-capture"
            onClick={captureFrame}
            title={`Capture ${selectedPanelType.replace(/_/g, ' ')}`}
          >
            <Camera size={26} />
          </button>
        )}

        <div style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>
          <span>Panel: </span>
          <strong style={{ color: '#38bdf8' }}>{selectedPanelType.replace(/_/g, ' ')}</strong>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
