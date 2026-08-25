import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  Scale,
  ShieldCheck,
  FileCheck2,
  Cpu,
  AlertCircle,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('officer@legalmetrix.gov.in');
  const [password, setPassword] = useState('Officer@123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [seedingStatus, setSeedingStatus] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.user.role === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else if (result.user.role === 'SUPERVISOR') {
          navigate('/supervisor/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setErrorMessage(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setErrorMessage('Network or server error. Please ensure the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoRole = (roleType) => {
    if (roleType === 'OFFICER') {
      setEmail('officer@legalmetrix.gov.in');
      setPassword('Officer@123');
    } else if (roleType === 'SUPERVISOR') {
      setEmail('supervisor@legalmetrix.gov.in');
      setPassword('Supervisor@123');
    } else if (roleType === 'ADMIN') {
      setEmail('admin@legalmetrix.gov.in');
      setPassword('Admin@123');
    }
    setErrorMessage('');
  };

  const handleSeedDatabase = async () => {
    setSeedingStatus('Seeding demo accounts...');
    try {
      const res = await authService.seedDemoUsers();
      if (res.success) {
        setSeedingStatus('Demo accounts & 2011 rules initialized successfully!');
        setTimeout(() => setSeedingStatus(''), 4000);
      }
    } catch (e) {
      setSeedingStatus('Seeding complete or server offline.');
      setTimeout(() => setSeedingStatus(''), 3000);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Hero Column */}
        <div className="auth-sidebar-hero">
          <div className="auth-hero-brand">
            <div className="auth-hero-icon">
              <Scale size={28} />
            </div>
            <div>
              <div className="auth-hero-title">LegalMetrix</div>
              <div className="auth-hero-subtitle">Government of India • SIH</div>
            </div>
          </div>

          <div className="auth-hero-content">
            <h1 className="auth-hero-heading">
              AI-Assisted Legal Metrology Compliance Checking System
            </h1>
            <p className="auth-hero-text">
              Automated packaging OCR, mandatory declaration verification, and rule-based non-compliance detection for enforcement officers inspecting retail and packaged commodities.
            </p>

            <div className="auth-features-list">
              <div className="auth-feature-item">
                <div className="feature-check-icon">✓</div>
                <span>Legal Metrology (Packaged Commodities) Rules, 2011 compliant</span>
              </div>
              <div className="auth-feature-item">
                <div className="feature-check-icon">✓</div>
                <span>Computer vision OCR & multi-panel image evidence screening</span>
              </div>
              <div className="auth-feature-item">
                <div className="feature-check-icon">✓</div>
                <span>Advisory AI findings with mandatory officer confirmation</span>
              </div>
              <div className="auth-feature-item">
                <div className="feature-check-icon">✓</div>
                <span>Role-based supervisory oversight & enforcement report generation</span>
              </div>
            </div>
          </div>

          <div className="auth-hero-footer">
            <span>Department of Consumer Affairs • Legal Metrology Division</span>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Enforcement Officer Login</h2>
            <p className="auth-form-subtitle">
              Sign in with your official credentials to access the inspection portal
            </p>
          </div>

          {/* Quick Demo Role Selector */}
          <div className="demo-role-selector">
            <div className="demo-selector-title">
              <span>⚡ Quick Demo Credentials</span>
              <button
                type="button"
                onClick={handleSeedDatabase}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Reset / Seed DB
              </button>
            </div>
            {seedingStatus && (
              <p style={{ fontSize: '0.75rem', color: '#059669', marginBottom: '8px', fontWeight: 600 }}>
                {seedingStatus}
              </p>
            )}
            <div className="demo-buttons-row">
              <button
                type="button"
                className={`demo-role-btn ${email.includes('officer') ? 'active' : ''}`}
                onClick={() => setDemoRole('OFFICER')}
              >
                <UserCheck size={14} />
                <span>OFFICER</span>
              </button>
              <button
                type="button"
                className={`demo-role-btn ${email.includes('supervisor') ? 'active' : ''}`}
                onClick={() => setDemoRole('SUPERVISOR')}
              >
                <ShieldCheck size={14} />
                <span>SUPERVISOR</span>
              </button>
              <button
                type="button"
                className={`demo-role-btn ${email.includes('admin') ? 'active' : ''}`}
                onClick={() => setDemoRole('ADMIN')}
              >
                <Lock size={14} />
                <span>ADMIN</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="alert-notice" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Government Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  required
                  placeholder="name@legalmetrix.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '10px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Authenticating Officer...</span>
              ) : (
                <>
                  <span>Sign In to Enforcement Portal</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
