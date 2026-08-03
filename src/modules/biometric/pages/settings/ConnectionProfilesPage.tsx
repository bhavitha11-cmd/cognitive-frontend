import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Stack, CircularProgress } from '@mui/material';
import { ConnectionTypeTabs } from '../../components/ConnectionTypeTabs';
import type { ConnectionType } from '../../types/connectionProfile';
import { useGetDevices } from '../../services/deviceService';
import { useGetProfiles, useCreateProfile, useUpdateProfile } from '../../services/connectionProfileService';
import { useTestConnection } from '../../services/deviceHealthService';
import { ConnectionTestResult } from '../../components/ConnectionTestResult';

export const ConnectionProfilesPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [connectionType, setConnectionType] = useState<ConnectionType>('DIRECT');

  const { data: devicesData } = useGetDevices();
  const { data: profiles, isLoading } = useGetProfiles(selectedDevice);
  
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const testConnection = useTestConnection();

  const [form, setForm] = useState({ ip_address: '', port: '', password: '' });

  const activeProfile = profiles?.find(p => p.connection_type === connectionType);

  const handleSave = () => {
    const payload = {
      device_id: selectedDevice,
      connection_type: connectionType,
      config: { ...form, connection_type: connectionType, port: Number(form.port) }
    };
    if (activeProfile) {
      updateProfile.mutate({ id: activeProfile.id, payload });
    } else {
      createProfile.mutate(payload);
    }
  };

  const handleTest = () => {
    if (selectedDevice) {
      testConnection.mutate(selectedDevice);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Connection Profiles</Typography>
      
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
        </CardContent>
      </Card>

      {selectedDevice && (
        <Card>
          <ConnectionTypeTabs value={connectionType} onChange={setConnectionType} />
          <CardContent>
            {isLoading ? <CircularProgress /> : (
              <Stack spacing={2} sx={{ mt: 2 }}>
                {connectionType === 'DIRECT' && (
                  <>
                    <TextField label="IP Address" value={form.ip_address} onChange={e => setForm({...form, ip_address: e.target.value})} fullWidth />
                    <TextField label="Port" type="number" value={form.port} onChange={e => setForm({...form, port: e.target.value})} fullWidth />
                    <TextField label="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} fullWidth />
                  </>
                )}
                {/* Implement other connection types as needed */}
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={handleSave}>Save Config</Button>
                  <Button variant="outlined" onClick={handleTest} disabled={testConnection.isPending}>
                    {testConnection.isPending ? <CircularProgress size={24} /> : 'Test Connection'}
                  </Button>
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      {testConnection.data && (
        <Box sx={{ mt: 3 }}>
          <ConnectionTestResult result={testConnection.data} isLoading={testConnection.isPending} />
        </Box>
      )}
    </Box>

  );
};

export default ConnectionProfilesPage;

