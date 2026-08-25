import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Clock } from 'lucide-react';

const StatusBadge = ({ status, text }) => {
  const normalized = (status || '').toUpperCase();

  if (['COMPLIANT', 'PASSED', 'VERIFIED_CORRECT'].includes(normalized)) {
    return (
      <span className="badge badge-compliant">
        <CheckCircle2 size={12} />
        {text || 'Compliant'}
      </span>
    );
  }

  if (['POTENTIAL_NON_COMPLIANCE', 'VIOLATION', 'POTENTIAL_VIOLATION', 'CRITICAL', 'HIGH'].includes(normalized)) {
    return (
      <span className="badge badge-violation">
        <AlertCircle size={12} />
        {text || 'Potential Non-Compliance'}
      </span>
    );
  }

  if (['REQUIRES_MANUAL_VERIFICATION', 'REQUIRES_VERIFICATION', 'WARNING', 'MEDIUM', 'LOW'].includes(normalized)) {
    return (
      <span className="badge badge-warning">
        <AlertTriangle size={12} />
        {text || 'Requires Manual Verification'}
      </span>
    );
  }

  return (
    <span className="badge badge-pending">
      <Clock size={12} />
      {text || normalized || 'Pending Review'}
    </span>
  );
};

export default StatusBadge;
