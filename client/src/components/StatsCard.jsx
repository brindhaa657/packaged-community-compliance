import React from 'react';

const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'blue', badge }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper ${color}`}>
        {Icon && <Icon size={24} />}
      </div>
      <div className="stat-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="stat-label">{title}</span>
          {badge && <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{badge}</span>}
        </div>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

export default StatsCard;
