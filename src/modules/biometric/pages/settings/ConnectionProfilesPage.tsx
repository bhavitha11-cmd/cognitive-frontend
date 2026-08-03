import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Stack, CircularProgress, Alert, Snackbar } from '@mui/material';
import { ConnectionTypeTabs } from '../../components/ConnectionTypeTabs';
import type { ConnectionType } from '../../types/connectionProfile';
import { useGetDevices } from '../../services/deviceService';
import { useGetProfiles, useCreateProfile, useUpdateProfile } from '../../services/connectionProfileService';
import { useTestConnection } from '../../services/deviceHealthService';
import { ConnectionTestResult } from '../../components/ConnectionTestResult';

export const ConnectionProfilesPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [connectionType, setConnectionType] = useState<ConnectionType>('DIRECT');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const { data: devicesData } = useGetDevices();
  const { data: profiles, isLoading } = useGetProfiles(selectedDevice);
  
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const testConnection = useTestConnection();

  const [form, setForm] = useState({ ip_address: '', port: '4370', password: '' });

  const activeProfile = profiles?.find(p => p.connection_type === connectionType);

  useEffect(() => {
    if (activeProfile && activeProfile.config_summary) {
      const summary = activeProfile.config_summary;
      setForm({
        ip_address: summary.ip_address || '',
        port: summary.port ? String(summary.port) : '4370',
        password: '', // Clear password field, user can enter new or leave blank to keep saved
      });
    } else {
      setForm({ ip_address: '', port: '4370', password: '' });
    }
  }, [activeProfile, connectionType, selectedDevice]);

  const handleSave = () => {
    const payload = {
      device_id: selectedDevice,
      connection_type: connectionType,
      config: { ...form, connection_type: connectionType, port: Number(form.port) }
    };
    if (activeProfile) {
      updateProfile.mutate({ id: activeProfile.id, payload }, {
        onSuccess: () => setSaveSuccess(true)
      });
    } else {
      createProfile.mutate(payload, {
        onSuccess: () => setSaveSuccess(true)
      });
    }
  };

  const handleTest = () => {
    if (selectedDevice) {
      testConnection.mutate(selectedDevice);
    }
  };

  const getErrorMessage = () => {
    if (!testConnection.error) return null;
    const err = testConnection.error as any;
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') {
      if (detail.includes('No active connection profile')) {
        return 'No active connection profile found for this device. Please fill out the form above and click "Save Config" first.';
      }
      return detail;
    }
    return err.message || 'Failed to test connection';
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
                {(createProfile.isError || updateProfile.isError) && (
                  <Alert severity="error">
                    {((createProfile.error || updateProfile.error) as any)?.response?.data?.detail || 'Failed to save profile'}
                  </Alert>
                )}

                {connectionType === 'DIRECT' && (
                  <>
                    <TextField label="IP Address" value={form.ip_address} onChange={e => setForm({...form, ip_address: e.target.value})} fullWidth />
                    <TextField label="Port" type="number" value={form.port} onChange={e => setForm({...form, port: e.target.value})} fullWidth />
                    <TextField 
                      label="Password" 
                      type="password" 
                      value={form.password} 
                      onChange={e => setForm({...form, password: e.target.value})} 
                      placeholder={activeProfile ? "•••••••• (Leave blank to keep saved password)" : "Enter device password"}
                      helperText={activeProfile ? "Leave blank to preserve currently saved password" : ""}
                      fullWidth 
                    />
                  </>
                )}
                
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleSave} 
                    disabled={createProfile.isPending || updateProfile.isPending}
                  >
                    {createProfile.isPending || updateProfile.isPending ? <CircularProgress size={24} /> : 'Save Config'}
                  </Button>
                  <Button variant="outlined" onClick={handleTest} disabled={testConnection.isPending}>
                    {testConnection.isPending ? <CircularProgress size={24} /> : 'Test Connection'}
                  </Button>
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      {testConnection.isError && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="error">{getErrorMessage()}</Alert>
        </Box>
      )}

      {testConnection.data && (
        <Box sx={{ mt: 3 }}>
          <ConnectionTestResult result={testConnection.data} isLoading={testConnection.isPending} />
        </Box>
      )}

      <Snackbar
        open={saveSuccess}
        autoHideDuration={4000}
        onClose={() => setSaveSuccess(false)}
        message="Connection profile saved successfully"
      />
    </Box>
  );
};

export default ConnectionProfilesPage;

