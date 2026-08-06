import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WarningIcon from '@mui/icons-material/Warning';
import HelpIcon from '@mui/icons-material/Help';
import type { DeviceHealth } from '../types/deviceHealth';

interface HealthGaugeProps {
  health: DeviceHealth;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({ health }) => {
  const getStatusConfig = () => {
    switch (health.connection_status) {
      case 'ONLINE':
        return { color: '#4caf50', icon: <WifiIcon sx={{ color: '#fff' }} /> };
      case 'OFFLINE':
        return { color: '#f44336', icon: <WifiOffIcon sx={{ color: '#fff' }} /> };
      case 'DEGRADED':
        return { color: '#ff9800', icon: <WarningIcon sx={{ color: '#fff' }} /> };
      case 'UNKNOWN':
      default:
        return { color: '#9e9e9e', icon: <HelpIcon sx={{ color: '#fff' }} /> };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip title={`Status: ${health.connection_status} | Response: ${health.response_time_ms ? `${health.response_time_ms}ms` : 'N/A'}`}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {config.icon}
        </Box>
        {health.response_time_ms && (
          <Typography variant="caption">{health.response_time_ms}ms</Typography>
        )}
      </Box>
    </Tooltip>
  );
};
