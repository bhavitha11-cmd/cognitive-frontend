import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useGetDevices } from '../../services/deviceService';
import { useGetMappings, useCreateMapping } from '../../services/employeeMappingService';

export const EmployeeMappingPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const { data: devicesData } = useGetDevices();
  const { data: mappings } = useGetMappings(selectedDevice);
  
  const createMapping = useCreateMapping();

  const [form, setForm] = useState({ employee_id: '', biometric_user_id: '' });

  const handleSave = () => {
    createMapping.mutate({
      device_id: selectedDevice,
      employee_id: form.employee_id,
      biometric_user_id: form.biometric_user_id,
      mapping_method: 'MANUAL'
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Employee Mapping</Typography>
        <Button variant="contained" color="secondary">Auto Map</Button>
      </Box>

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
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Manual Map</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Employee ID" value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} fullWidth />
              <TextField label="Biometric User ID" value={form.biometric_user_id} onChange={e => setForm({...form, biometric_user_id: e.target.value})} fullWidth />
              <Button variant="contained" onClick={handleSave}>Add</Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {selectedDevice && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee Name</TableCell>
                <TableCell>Emp Code</TableCell>
                <TableCell>Biometric ID</TableCell>
                <TableCell>Method</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mappings?.map(m => (
                <TableRow key={m.id}>
                  <TableCell>{m.employee_name || m.employee_id}</TableCell>
                  <TableCell>{m.employee_code || '-'}</TableCell>
                  <TableCell>{m.biometric_user_id}</TableCell>
                  <TableCell>{m.mapping_method}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default EmployeeMappingPage;

