import React, { useState } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useGetBiometricLogs, exportBiometricLogsCsv } from '../../services/biometricLogService';
import { PunchTypeChip } from '../../components/PunchTypeChip';

export const BiometricLogsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const filters = {};

  const { data, isLoading } = useGetBiometricLogs({ ...filters, page: page + 1, page_size: rowsPerPage });

  const handleExport = async () => {
    const blob = await exportBiometricLogsCsv(filters);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'biometric_logs.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Biometric Logs</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>Export CSV</Button>
      </Box>

      {/* Filter bar can go here */}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Employee Name</TableCell>
              <TableCell>Emp Code</TableCell>
              <TableCell>Device</TableCell>
              <TableCell>Punch Type</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
            ) : data?.logs.map(log => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.punch_timestamp).toLocaleString()}</TableCell>
                <TableCell>{log.employee_name || log.employee_id}</TableCell>
                <TableCell>{log.employee_code || '-'}</TableCell>
                <TableCell>{log.device_name || log.device_id}</TableCell>
                <TableCell><PunchTypeChip punchType={log.punch_type} /></TableCell>
                <TableCell>{log.processing_status}</TableCell>
              </TableRow>
            ))}
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
    </Box>
  );
};

export default BiometricLogsPage;

