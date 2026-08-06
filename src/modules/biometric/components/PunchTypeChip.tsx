import React from 'react';
import { Chip } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import HelpIcon from '@mui/icons-material/Help';
import type { PunchType } from '../types/biometricLog';

interface PunchTypeChipProps {
  punchType: PunchType | string;
}

export const PunchTypeChip: React.FC<PunchTypeChipProps> = ({ punchType }) => {
  const getConfig = () => {
    switch (punchType) {
      case 'IN':
        return { label: 'IN', color: 'success' as const, icon: <ArrowUpwardIcon fontSize="small" /> };
      case 'OUT':
        return { label: 'OUT', color: 'error' as const, icon: <ArrowDownwardIcon fontSize="small" /> };
      case 'BREAK_IN':
      case 'BREAK_OUT':
        return { label: punchType.replace('_', ' '), color: 'warning' as const, icon: <CompareArrowsIcon fontSize="small" /> };
      case 'UNKNOWN':
      default:
        return { label: punchType, color: 'default' as const, icon: <HelpIcon fontSize="small" /> };
    }
  };

  const config = getConfig();

  return <Chip label={config.label} color={config.color} icon={config.icon} size="small" />;
};
