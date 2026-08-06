import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useGetDevices } from '../../services/deviceService';
import { useGetSyncConfig, useUpdateSyncConfig, useTriggerSync } from '../../services/syncService';

export const SyncConfigPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const { data: devicesData } = useGetDevices();
  const { data: config, isLoading: isConfigLoading } = useGetSyncConfig(selectedDevice);

  const updateConfig = useUpdateSyncConfig();
  const triggerSync = useTriggerSync();

  const [form, setForm] = useState({ is_auto_sync: false, sync_interval_minutes: 1 });

  // Notification States
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (config) {
      setForm({
        is_auto_sync: config.is_auto_sync ?? false,
        sync_interval_minutes: config.sync_interval_minutes ?? 1,
      });
    }
  }, [config]);

  const handleSave = () => {
    if (!selectedDevice) return;
    updateConfig.mutate(
      { deviceId: selectedDevice, payload: form },
      {
        onSuccess: () => {
          setToast({
            open: true,
            message: `Sync configuration saved successfully! (Auto-Sync: ${form.is_auto_sync ? 'ON' : 'OFF'}, Interval: ${form.sync_interval_minutes} min)`,
            severity: 'success',
          });
        },
        onError: (err: any) => {
          setToast({
            open: true,
            message: `Failed to save configuration: ${err?.response?.data?.detail || err.message}`,
            severity: 'error',
          });
        },
      }
    );
  };

  const handleManualSync = () => {
    if (!selectedDevice) return;
    triggerSync.mutate(selectedDevice, {
      onSuccess: (res: any) => {
        setToast({
          open: true,
          message: `Manual sync completed! Status: ${res?.status || 'SUCCESS'} (${res?.records_saved || 0} logs saved)`,
          severity: 'success',
        });
      },
      onError: (err: any) => {
        setToast({
          open: true,
          message: `Manual sync failed: ${err?.response?.data?.detail || err.message}`,
          severity: 'error',
        });
      },
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        Biometric Sync Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure background automated sync schedule and intervals for hardware biometric devices.
      </Typography>

      <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel id="select-device-config-label">Select Biometric Device</InputLabel>
            <Select
              labelId="select-device-config-label"
              value={selectedDevice}
              label="Select Biometric Device"
              onChange={(e) => setSelectedDevice(e.target.value)}
            >
              <MenuItem value="">
                <em>Choose a Device...</em>
              </MenuItem>
              {devicesData?.devices.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.device_name} ({d.vendor})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {selectedDevice && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent>
            {isConfigLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={3}>
                <Box sx={{ p: 2, bgcolor: form.is_auto_sync ? 'success.50' : 'action.hover', borderRadius: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.is_auto_sync}
                        onChange={(e) => setForm({ ...form, is_auto_sync: e.target.checked })}
                        color="success"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Enable Automated Background Sync
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {form.is_auto_sync
                            ? 'Active: System will automatically pull attendance logs in the background without manual clicks.'
                            : 'Inactive: Automatic pulling is disabled. You must click Manual Sync.'}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>

                <FormControl fullWidth disabled={!form.is_auto_sync}>
                  <InputLabel id="sync-interval-label">Sync Interval (minutes)</InputLabel>
                  <Select
                    labelId="sync-interval-label"
                    value={form.sync_interval_minutes}
                    label="Sync Interval (minutes)"
                    onChange={(e) => setForm({ ...form, sync_interval_minutes: Number(e.target.value) })}
                  >
                    <MenuItem value={1}>1 min (Near Real-Time)</MenuItem>
                    <MenuItem value={2}>2 mins</MenuItem>
                    <MenuItem value={5}>5 mins</MenuItem>
                    <MenuItem value={15}>15 mins</MenuItem>
                    <MenuItem value={30}>30 mins</MenuItem>
                    <MenuItem value={60}>60 mins (1 hour)</MenuItem>
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={updateConfig.isPending ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={updateConfig.isPending}
                    sx={{ minWidth: 150 }}
                  >
                    {updateConfig.isPending ? 'Saving...' : 'Save Configuration'}
                  </Button>

                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={triggerSync.isPending ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
                    onClick={handleManualSync}
                    disabled={triggerSync.isPending}
                  >
                    {triggerSync.isPending ? 'Syncing Device...' : 'Trigger Manual Sync Now'}
                  </Button>
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success / Error Notification Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          variant="filled"
          icon={toast.severity === 'success' ? <CheckCircleIcon /> : undefined}
          sx={{ width: '100%', fontWeight: 500 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SyncConfigPage;


