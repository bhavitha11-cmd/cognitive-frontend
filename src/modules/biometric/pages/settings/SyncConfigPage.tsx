import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, FormControl, InputLabel, Select, MenuItem, Stack, Switch, FormControlLabel } from '@mui/material';
import { useGetDevices } from '../../services/deviceService';
import { useGetSyncConfig, useUpdateSyncConfig } from '../../services/syncService';
import { useTriggerSync } from '../../services/syncService';

export const SyncConfigPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const { data: devicesData } = useGetDevices();
  const { data: config } = useGetSyncConfig(selectedDevice);
  
  const updateConfig = useUpdateSyncConfig();
  const triggerSync = useTriggerSync();

  const [form, setForm] = useState({ auto_sync: false, sync_interval: 15 });

  React.useEffect(() => {
    if (config) {
      setForm({ auto_sync: config.auto_sync || false, sync_interval: config.sync_interval || 15 });
    }
  }, [config]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Sync Configuration</Typography>

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
          <CardContent>
            <Stack spacing={3}>
              <FormControlLabel 
                control={<Switch checked={form.auto_sync} onChange={e => setForm({...form, auto_sync: e.target.checked})} />} 
                label="Enable Auto Sync" 
              />
              <FormControl fullWidth>
                <InputLabel>Sync Interval (mins)</InputLabel>
                <Select value={form.sync_interval} label="Sync Interval" onChange={e => setForm({...form, sync_interval: Number(e.target.value)})}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={15}>15</MenuItem>
                  <MenuItem value={30}>30</MenuItem>
                  <MenuItem value={60}>60</MenuItem>
                </Select>
              </FormControl>
              
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={() => updateConfig.mutate({ deviceId: selectedDevice, payload: form })}>Save Config</Button>
                <Button variant="outlined" color="primary" onClick={() => triggerSync.mutate(selectedDevice)}>Trigger Manual Sync</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SyncConfigPage;

