import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        textAlign: 'center',
        padding: '30px',
      }}
    >
      <div
        style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          backgroundColor: '#eff6ff',
          color: '#1d4ed8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <ShieldAlert size={36} />
      </div>
      <h1 style={{ fontSize: '2rem', color: '#0b2545', marginBottom: '8px' }}>
        404 - Enforcement Page Not Found
      </h1>
      <p style={{ color: '#64748b', maxWidth: '450px', marginBottom: '24px' }}>
        The requested compliance record, inspection route, or administrative module does not exist or has been relocated.
      </p>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={16} />
        <span>Return to Officer Workspace</span>
      </button>
    </div>
  );
};

export default NotFound;
