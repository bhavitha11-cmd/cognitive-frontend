import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Stack,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Alert, CircularProgress,
  Autocomplete,
} from '@mui/material';
import { useGetDevices } from '../../services/deviceService';
import { useGetMappings, useCreateMapping, useDeleteMapping } from '../../services/employeeMappingService';
import { useGetEmployeesLookup } from '../../../hr/services/hrService';

export const EmployeeMappingPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; displayName: string; employeeCode: string } | null>(null);
  const [biometricUserId, setBiometricUserId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: devicesData } = useGetDevices();
  const { data: mappings, isLoading: mappingsLoading } = useGetMappings(selectedDevice);
  const { data: employees = [], isLoading: employeesLoading } = useGetEmployeesLookup();

  const createMapping = useCreateMapping();
  const deleteMapping = useDeleteMapping();

  const handleSave = () => {
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedDevice) {
      setErrorMsg('Please select a device first.');
      return;
    }
    if (!selectedEmployee) {
      setErrorMsg('Please select an employee.');
      return;
    }
    if (!biometricUserId.trim()) {
      setErrorMsg('Please enter the Biometric User ID from the device.');
      return;
    }

    createMapping.mutate(
      {
        device_id: selectedDevice,
        employee_id: selectedEmployee.id,
        biometric_user_id: biometricUserId.trim(),
        mapping_method: 'MANUAL',
      },
      {
        onSuccess: () => {
          setSuccessMsg(`Mapped "${selectedEmployee.displayName}" to device user ID "${biometricUserId.trim()}" successfully.`);
          setSelectedEmployee(null);
          setBiometricUserId('');
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail || err?.message || 'Failed to create mapping.';
          setErrorMsg(detail);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    setSuccessMsg('');
    setErrorMsg('');
    deleteMapping.mutate(id, {
      onSuccess: () => setSuccessMsg('Mapping removed successfully.'),
      onError: (err: any) => {
        const detail = err?.response?.data?.detail || err?.message || 'Failed to remove mapping.';
        setErrorMsg(detail);
      },
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Employee Mapping</Typography>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

      {/* Device selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel>Select Device</InputLabel>
            <Select
              value={selectedDevice}
              label="Select Device"
              onChange={e => { setSelectedDevice(e.target.value); setSuccessMsg(''); setErrorMsg(''); }}
            >
              {devicesData?.devices?.map((d: any) => (
                <MenuItem key={d.id} value={d.id}>{d.device_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Manual mapping form — only shown after a device is selected */}
      {selectedDevice && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Add Manual Mapping</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'flex-start' } }}>

              {/* Employee search dropdown */}
              <Autocomplete
                sx={{ minWidth: 280 }}
                options={employees}
                getOptionLabel={(opt) => `${opt.displayName} (${opt.employeeCode})`}
                value={selectedEmployee}
                onChange={(_, val) => setSelectedEmployee(val)}
                loading={employeesLoading}
                renderInput={(params) => (
                  <TextField {...params} label="Search Employee" placeholder="Type name or code..." />
                )}
              />

              {/* Biometric user ID from the device — just a number */}
              <TextField
                label="Biometric User ID (from device)"
                placeholder="e.g. 1, 5, 101"
                value={biometricUserId}
                onChange={e => setBiometricUserId(e.target.value)}
                sx={{ minWidth: 220 }}
              />

              <Button
                variant="contained"
                onClick={handleSave}
                disabled={createMapping.isPending}
                sx={{ alignSelf: 'center', minWidth: 100, height: 56 }}
              >
                {createMapping.isPending ? <CircularProgress size={20} /> : 'Add Mapping'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Mappings table */}
      {selectedDevice && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Existing Mappings {mappingsLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
            </Typography>

            {!mappingsLoading && (!mappings || mappings.length === 0) ? (
              <Alert severity="info">
                No mappings found for this device. Add one above to enable biometric attendance.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Employee Name</b></TableCell>
                      <TableCell><b>Emp Code</b></TableCell>
                      <TableCell><b>Biometric User ID</b></TableCell>
                      <TableCell><b>Method</b></TableCell>
                      <TableCell><b>Action</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mappings?.map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.employee_name || m.employee_id}</TableCell>
                        <TableCell>{m.employee_code || '-'}</TableCell>
                        <TableCell>{m.biometric_user_id}</TableCell>
                        <TableCell>{m.mapping_method}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleDelete(m.id)}
                            disabled={deleteMapping.isPending}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EmployeeMappingPage;
