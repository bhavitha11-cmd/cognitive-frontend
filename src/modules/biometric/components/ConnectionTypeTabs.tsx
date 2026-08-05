import React from 'react';
import { Tabs, Tab } from '@mui/material';
import type { ConnectionType } from '../types/connectionProfile';

interface ConnectionTypeTabsProps {
  value: ConnectionType;
  onChange: (type: ConnectionType) => void;
}

export const ConnectionTypeTabs: React.FC<ConnectionTypeTabsProps> = ({ value, onChange }) => {
  const handleChange = (_event: React.SyntheticEvent, newValue: ConnectionType) => {
    onChange(newValue);
  };

  return (
    <Tabs value={value} onChange={handleChange} variant="fullWidth">
      <Tab label="Direct Device" value="DIRECT" />
      <Tab label="Database" value="DATABASE" />
      <Tab label="REST API" value="REST_API" />
      <Tab label="ADMS Push" value="ADMS_PUSH" />
    </Tabs>
  );
};
