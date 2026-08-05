import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { useGetBiometricLogs, exportBiometricLogsCsv } from '../../services/biometricLogService';
import { useGetDevices } from '../../services/deviceService';
import { PunchTypeChip } from '../../components/PunchTypeChip';

export const BiometricLogsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter States
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [punchType, setPunchType] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');

  const { data: devicesData } = useGetDevices();

  const filters = {
    ...(fromDate && { from_date: fromDate }),
    ...(toDate && { to_date: toDate }),
    ...(punchType && { punch_type: punchType }),
    ...(deviceId && { device_id: deviceId }),
  };

  const { data, isLoading } = useGetBiometricLogs({
    ...filters,
    page: page + 1,
    page_size: rowsPerPage,
  });

  const handleExport = async () => {
    const blob = await exportBiometricLogsCsv(filters);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `biometric_logs_${fromDate || 'all'}_to_${toDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Quick Preset Handlers
  const setTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
    setPage(0);
  };

  const setYesterdayFilter = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().split('T')[0];
    setFromDate(yesterday);
    setToDate(yesterday);
    setPage(0);
  };

  const setThisWeekFilter = () => {
    const now = new Date();
    const firstDay = new Date(now.setDate(now.getDate() - now.getDay() + 1)).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    setFromDate(firstDay);
    setToDate(today);
    setPage(0);
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setPunchType('');
    setDeviceId('');
    setPage(0);
  };

  const hasActiveFilters = Boolean(fromDate || toDate || punchType || deviceId);

  return (
    <Box sx={{ p: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Biometric Punch Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Filter, inspect, and export raw/normalized attendance punch logs from biometric hardware devices.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} sx={{ height: 40 }}>
          Export CSV
        </Button>
      </Box>

      {/* Filter Panel Card */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <FilterListIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600}>
            Search & Date Filters
          </Typography>
          {hasActiveFilters && (
            <Chip
              label="Filters Active"
              color="primary"
              size="small"
              onDelete={handleResetFilters}
              sx={{ ml: 1, fontWeight: 500 }}
            />
          )}
        </Stack>

        <Grid container spacing={2} alignItems="center">
          {/* From Date */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(0);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          {/* To Date */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          {/* Punch Type Dropdown */}
          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="punch-type-select-label">Punch Type</InputLabel>
              <Select
                labelId="punch-type-select-label"
                value={punchType}
                label="Punch Type"
                onChange={(e) => {
                  setPunchType(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">
                  <em>All Types</em>
                </MenuItem>
                <MenuItem value="IN">Punch IN</MenuItem>
                <MenuItem value="OUT">Punch OUT</MenuItem>
                <MenuItem value="BREAK_IN">Break IN</MenuItem>
                <MenuItem value="BREAK_OUT">Break OUT</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Device Dropdown */}
          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="device-select-label">Biometric Device</InputLabel>
              <Select
                labelId="device-select-label"
                value={deviceId}
                label="Biometric Device"
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">
                  <em>All Devices</em>
                </MenuItem>
                {devicesData?.devices.map((dev) => (
                  <MenuItem key={dev.id} value={dev.id}>
                    {dev.device_name} ({dev.vendor})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Quick Date Presets Row */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1, fontWeight: 500 }}>
            Quick Date Presets:
          </Typography>
          <Chip
            icon={<TodayIcon />}
            label="Today"
            size="small"
            clickable
            variant={fromDate === new Date().toISOString().split('T')[0] && toDate === new Date().toISOString().split('T')[0] ? 'filled' : 'outlined'}
            color="primary"
            onClick={setTodayFilter}
          />
          <Chip
            icon={<DateRangeIcon />}
            label="Yesterday"
            size="small"
            clickable
            variant="outlined"
            onClick={setYesterdayFilter}
          />
          <Chip
            icon={<DateRangeIcon />}
            label="This Week"
            size="small"
            clickable
            variant="outlined"
            onClick={setThisWeekFilter}
          />
          {hasActiveFilters && (
            <Tooltip title="Reset all filters">
              <IconButton size="small" onClick={handleResetFilters} color="warning" sx={{ ml: 'auto' }}>
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Paper>

      {/* Data Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Employee Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Emp Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Device</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Punch Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  Loading logs...
                </TableCell>
              </TableRow>
            ) : data?.logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No biometric punch logs found for the selected date range and filters.
                </TableCell>
              </TableRow>
            ) : (
              data?.logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{new Date(log.punch_timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.employee_name || log.employee_id}</TableCell>
                  <TableCell>{log.employee_code || '-'}</TableCell>
                  <TableCell>{log.device_name || log.device_id}</TableCell>
                  <TableCell>
                    <PunchTypeChip punchType={log.punch_type} />
                  </TableCell>
                  <TableCell>{log.processing_status}</TableCell>
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
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Box>
  );
};

export default BiometricLogsPage;


