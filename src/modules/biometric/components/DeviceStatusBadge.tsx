import React from 'react';
import { Chip } from '@mui/material';

interface DeviceStatusBadgeProps {
  status: string;
}

export const DeviceStatusBadge: React.FC<DeviceStatusBadgeProps> = ({ status }) => {
  const getColor = () => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'MAINTENANCE':
        return 'warning';
      case 'INACTIVE':
      default:
        return 'default';
    }
  };

  return <Chip label={status} color={getColor()} size="small" />;
};
