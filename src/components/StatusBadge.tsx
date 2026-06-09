import React from 'react';
import { Chip } from '@mui/material';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusColor = (statusVal: string) => {
    const s = statusVal.toLowerCase();
    if (s === 'active' || s === 'allowed' || s === 'completed' || s === 'finished' || s === 'approved' || s === 'probation') {
      return 'success';
    }
    if (s === 'inactive' || s === 'denied' || s === 'canceled' || s === 'rejected' || s === 'terminated' || s === 'resigned') {
      return 'error';
    }
    if (s === 'pending' || s === 'review' || s === 'on hold' || s === 'medium' || s === 'notice_period' || s === 'on_leave' || s === 'suspended') {
      return 'warning';
    }
    return 'default';
  };

  const getLabel = (statusVal: string) => {
    switch (statusVal.toUpperCase()) {
      case 'ACTIVE': return 'Active';
      case 'PROBATION': return 'Probation';
      case 'NOTICE_PERIOD': return 'Notice Period';
      case 'ON_LEAVE': return 'On Leave';
      case 'SUSPENDED': return 'Suspended';
      case 'RESIGNED': return 'Resigned';
      case 'TERMINATED': return 'Terminated';
      default: return statusVal;
    }
  };

  return (
    <Chip
      label={getLabel(status)}
      size="small"
      color={getStatusColor(status)}
      sx={{
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: '4px',
      }}
    />
  );
};

export default StatusBadge;
