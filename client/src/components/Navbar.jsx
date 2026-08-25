import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Bell, MapPin, BadgeAlert } from 'lucide-react';

const Navbar = ({ title = 'Legal Metrology Enforcement System' }) => {
  const { user } = useAuth();

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <div className="page-breadcrumb">
          <span>Portal</span>
          <span>/</span>
          <span className="page-breadcrumb-current">{title}</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Jurisdiction badge */}
        <div className="portal-tag">
          <MapPin size={14} color="#2563eb" />
          <span>{user?.jurisdiction || 'National Jurisdiction'}</span>
        </div>

        {/* Role identifier badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: '9999px',
            backgroundColor:
              user?.role === 'ADMIN'
                ? '#fef3c7'
                : user?.role === 'SUPERVISOR'
                ? '#f3e8ff'
                : '#e0f2fe',
            color:
              user?.role === 'ADMIN'
                ? '#92400e'
                : user?.role === 'SUPERVISOR'
                ? '#6b21a8'
                : '#075985',
            border: '1px solid currentColor',
          }}
        >
          <Shield size={13} />
          <span>{user?.role || 'OFFICER'}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
