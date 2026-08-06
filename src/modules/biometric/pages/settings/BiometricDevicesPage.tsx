import React, { useState } from 'react';
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Paper, Button, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Chip, CircularProgress,
  Alert, Typography, Stack, Divider, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGetDevices, useCreateDevice, useUpdateDevice, useDeleteDevice } from '../../services/deviceService';
import { DeviceStatusBadge } from '../../components/DeviceStatusBadge';
import type { BiometricDevice } from '../../types/device';
import { useAuthStore } from '../../../../store/useAuthStore';

export const BiometricDevicesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({ search: '', status: '', vendor: '' });
  
  const { data, isLoading, error } = useGetDevices({ ...filters, page: page + 1, page_size: rowsPerPage });
  
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();

  const [openDialog, setOpenDialog] = useState(false);
  const [editDevice, setEditDevice] = useState<BiometricDevice | null>(null);
  
  const [formData, setFormData] = useState({
    device_name: '', vendor: 'ZKTECO', model: '', serial_number: '', branch: '', timezone: 'UTC', status: 'ACTIVE', description: ''
  });

  const handleOpen = (device?: BiometricDevice) => {
    if (device) {
      setEditDevice(device);
      setFormData({
        device_name: device.device_name,
        vendor: device.vendor,
        model: device.model || '',
        serial_number: device.serial_number || '',
        branch: device.branch || '',
        timezone: device.timezone,
        status: device.status,
        description: device.description || ''
      });
    } else {
      setEditDevice(null);
      setFormData({
        device_name: '', vendor: 'ZKTECO', model: '', serial_number: '', branch: '', timezone: 'UTC', status: 'ACTIVE', description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (editDevice) {
      updateDevice.mutate({ id: editDevice.id, payload: formData }, {
        onSuccess: () => setOpenDialog(false)
      });
    } else {
      createDevice.mutate({ ...formData, organization_id: '00000000-0000-0000-0000-000000000000' }, {
        onSuccess: () => setOpenDialog(false)
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Biometric Devices</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Add Device</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2}>
            <TextField 
              label="Search" 
              size="small" 
              value={filters.search} 
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))} 
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filters.status} label="Status" onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>Failed to load devices</Alert>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Device Name</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Serial</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Sync</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow>
            ) : data?.devices.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No devices found</TableCell></TableRow>
            ) : (
              data?.devices.map(device => (
                <TableRow key={device.id}>
                  <TableCell>{device.device_name}</TableCell>
                  <TableCell>{device.vendor}</TableCell>
                  <TableCell>{device.serial_number}</TableCell>
                  <TableCell>{device.branch}</TableCell>
                  <TableCell><DeviceStatusBadge status={device.status} /></TableCell>
                  <TableCell>{device.last_sync_at ? new Date(device.last_sync_at).toLocaleString() : 'Never'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpen(device)}><EditIcon /></IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteDevice.mutate(device.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={data?.total || 0}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editDevice ? 'Edit Device' : 'Add Device'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField label="Device Name" value={formData.device_name} onChange={e => setFormData(f => ({ ...f, device_name: e.target.value }))} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Vendor</InputLabel>
              <Select value={formData.vendor} label="Vendor" onChange={e => setFormData(f => ({ ...f, vendor: e.target.value }))}>
                <MenuItem value="ZKTECO">ZKTECO</MenuItem>
                <MenuItem value="ESSL">ESSL</MenuItem>
                <MenuItem value="MATRIX">MATRIX</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Serial Number" value={formData.serial_number} onChange={e => setFormData(f => ({ ...f, serial_number: e.target.value }))} fullWidth />
            <TextField label="Branch" value={formData.branch} onChange={e => setFormData(f => ({ ...f, branch: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={createDevice.isPending || updateDevice.isPending}>
            {createDevice.isPending || updateDevice.isPending ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BiometricDevicesPage;

