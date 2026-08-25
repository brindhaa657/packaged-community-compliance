import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  FileText,
  Users,
  Settings2,
  BarChart3,
  AlertOctagon,
  LogOut,
  Scale,
  SlidersHorizontal,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin, isSupervisor, isOfficer } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Scale size={22} />
        </div>
        <div className="brand-info">
          <span className="brand-title">LegalMetrix</span>
          <span className="brand-badge">Rules, 2011 Enforcement</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="sidebar-nav">
        {/* Officer & General Navigation */}
        <div className="nav-section-title">Inspection Operations</div>
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard className="nav-icon" />
          <span>Officer Dashboard</span>
        </NavLink>
        <NavLink
          to="/inspections/new"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <PlusCircle className="nav-icon" />
          <span>New Inspection</span>
        </NavLink>
        <NavLink
          to="/inspections"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <ClipboardList className="nav-icon" />
          <span>Inspections History</span>
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <FileText className="nav-icon" />
          <span>Enforcement Reports</span>
        </NavLink>

        {/* Supervisor Navigation Section */}
        {(isSupervisor || isAdmin) && (
          <>
            <div className="nav-section-title">Supervisory Oversight</div>
            <NavLink
              to="/supervisor/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <BarChart3 className="nav-icon" />
              <span>Supervisor Dashboard</span>
            </NavLink>
            <NavLink
              to="/supervisor/inspections"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <AlertOctagon className="nav-icon" />
              <span>Flagged Violations Queue</span>
            </NavLink>
          </>
        )}

        {/* Admin Navigation Section */}
        {isAdmin && (
          <>
            <div className="nav-section-title">System Administration</div>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <SlidersHorizontal className="nav-icon" />
              <span>Admin Console</span>
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Users className="nav-icon" />
              <span>User & Role Mgmt</span>
            </NavLink>
            <NavLink
              to="/admin/rules"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Settings2 className="nav-icon" />
              <span>Compliance Rules Config</span>
            </NavLink>
          </>
        )}
      </div>

      {/* Footer Profile & Logout */}
      <div className="sidebar-footer">
        <div className="user-profile-pill">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-meta">
            <div className="user-meta-name">{user?.name || 'Enforcement User'}</div>
            <div className="user-meta-role">
              {user?.role || 'OFFICER'} • {user?.badgeNumber || 'LM-000'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out of LegalMetrix"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
