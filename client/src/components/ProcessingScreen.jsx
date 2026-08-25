import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  Circle,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Layers,
} from 'lucide-react';

const STAGES = [
  { id: 'UPLOADED', label: 'Images uploaded & validated' },
  { id: 'PREPROCESSING', label: 'Image preprocessing & normalization' },
  { id: 'OCR', label: 'Extracting text (OCR engine)' },
  { id: 'AI_STRUCTURING', label: 'Structuring declarations (AI analysis)' },
  { id: 'PREPARING_REVIEW', label: 'Preparing officer review & confidence scoring' },
];

const ProcessingScreen = ({ onCompleted, onError, errorMessage }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    // If there is an error from parent, stop progress
    if (errorMessage) return;

    // Progression timer through meaningful extraction stages
    const intervals = [350, 450, 500, 400, 300];

    let timer;
    const advanceStage = (index) => {
      if (index < STAGES.length - 1) {
        timer = setTimeout(() => {
          setCurrentStageIndex(index + 1);
          advanceStage(index + 1);
        }, intervals[index] || 400);
      } else {
        timer = setTimeout(() => {
          if (onCompleted) onCompleted();
        }, 300);
      }
    };

    advanceStage(0);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  return (
    <div
      style={{
        maxWidth: '640px',
        margin: '40px auto',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        padding: '36px 32px',
        textAlign: 'center',
      }}
    >
      {/* Header Icon */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0b2545 0%, #134074 100%)',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 14px rgba(11, 37, 69, 0.25)',
        }}
      >
        <Sparkles size={32} />
      </div>

      <h2
        style={{
          fontSize: '1.45rem',
          fontWeight: 800,
          color: '#0b2545',
          letterSpacing: '0.02em',
          marginBottom: '6px',
          textTransform: 'uppercase',
        }}
      >
        Analyzing Product
      </h2>
      <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '28px' }}>
        Processing package images, running OCR, and structuring declarations...
      </p>

      {/* Progress Stages Box */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px 20px',
          textAlign: 'left',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {STAGES.map((stage, idx) => {
            const isFinished = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex && !errorMessage;
            const isPending = idx > currentStageIndex && !errorMessage;

            return (
              <div
                key={stage.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.3s ease',
                  opacity: isPending ? 0.45 : 1,
                }}
              >
                <div style={{ width: '22px', display: 'flex', justifyContent: 'center' }}>
                  {isFinished && (
                    <CheckCircle2 size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
                  )}
                  {isCurrent && (
                    <Loader2
                      size={20}
                      style={{
                        color: '#0284c7',
                        animation: 'spin 1s linear infinite',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {isPending && (
                    <Circle size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  )}
                </div>

                <div
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: isCurrent ? 700 : isFinished ? 600 : 500,
                    color: isCurrent ? '#0369a1' : isFinished ? '#1e293b' : '#64748b',
                  }}
                >
                  {stage.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error state if failed */}
      {errorMessage ? (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '14px 18px',
            borderRadius: '8px',
            fontSize: '0.86rem',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Processing Error:</strong> {errorMessage}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
          Please wait while the AI extracts and organizes commodity declarations...
        </div>
      )}
    </div>
  );
};

export default ProcessingScreen;
