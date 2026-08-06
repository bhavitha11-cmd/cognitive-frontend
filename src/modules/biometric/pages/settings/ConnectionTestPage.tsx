import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert } from '@mui/material';
import { useGetDevices } from '../../services/deviceService';
import { useTestConnection } from '../../services/deviceHealthService';
import { ConnectionTestResult } from '../../components/ConnectionTestResult';

export const ConnectionTestPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const { data: devicesData } = useGetDevices();
  const testConnection = useTestConnection();

  const getErrorMessage = () => {
    if (!testConnection.error) return null;
    const err = testConnection.error as any;
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') {
      if (detail.includes('No active connection profile')) {
        return 'No active connection profile found for this device. Go to Connection Profiles page to save device credentials first.';
      }
      return detail;
    }
    return err.message || 'Failed to test connection';
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Connection Test</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Device</InputLabel>
            <Select value={selectedDevice} label="Select Device" onChange={e => setSelectedDevice(e.target.value)}>
              {devicesData?.devices.map(d => (
                <MenuItem key={d.id} value={d.id}>{d.device_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button 
            variant="contained" 
            fullWidth 
            size="large" 
            onClick={() => testConnection.mutate(selectedDevice)}
            disabled={!selectedDevice || testConnection.isPending}
          >
            {testConnection.isPending ? <CircularProgress size={24} /> : 'Test Connection'}
          </Button>
        </CardContent>
      </Card>

      {testConnection.isError && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="error">{getErrorMessage()}</Alert>
        </Box>
      )}

      {testConnection.data && (
        <ConnectionTestResult result={testConnection.data} isLoading={testConnection.isPending} />
      )}
    </Box>
  );
};

export default ConnectionTestPage;

