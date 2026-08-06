import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
  Divider,
  LinearProgress,
  Tooltip,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import TimerIcon from '@mui/icons-material/Timer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useGetLiveAttendance } from '../../services/liveAttendanceService';
import type { LiveAttendanceRecord } from '../../types/liveAttendance';

export const LiveAttendancePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: attendance, isLoading, refetch } = useGetLiveAttendance(
    undefined,
    undefined,
    selectedDate
  );

  const [selectedRecord, setSelectedRecord] = useState<LiveAttendanceRecord | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN':
        return 'success';
      case 'OUT':
        return 'warning';
      case 'ABSENT':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatTimeStr = (isoStr?: string) => {
    if (!isoStr) return '--:--';
    try {
      return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  // Date Preset Handlers
  const setTodayFilter = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const setYesterdayFilter = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleResetFilters = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSearchQuery('');
    setStatusFilter('');
  };

  // Filter records client side by name/code and status
  const filteredAttendance = attendance?.filter((rec) => {
    const matchesSearch =
      !searchQuery ||
      rec.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.employee_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || rec.current_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countIn = attendance?.filter((r) => r.current_status === 'IN').length || 0;
  const countOut = attendance?.filter((r) => r.current_status === 'OUT').length || 0;
  const countAbsent = attendance?.filter((r) => r.current_status === 'ABSENT').length || 0;

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <Box sx={{ p: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Live Attendance Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time biometric monitoring & 8-Hour shift tracking ({selectedDate})
          </Typography>
        </Box>
        <IconButton onClick={() => refetch()} color="primary" sx={{ bgcolor: 'action.hover' }}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filter Panel Card */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <FilterListIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600}>
            Date & Employee Filters
          </Typography>
          {!isToday && (
            <Chip
              label={`Date: ${selectedDate}`}
              color="primary"
              size="small"
              onDelete={setTodayFilter}
              sx={{ ml: 1, fontWeight: 500 }}
            />
          )}
        </Stack>

        <Grid container spacing={2} alignItems="center">
          {/* Target Date Selector */}
          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <TextField
              fullWidth
              size="small"
              label="Select Attendance Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          {/* Search Employee Name/Code */}
          <Grid size={{ xs: 12, sm: 6, md: 4.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Employee Name or Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          {/* Status Dropdown Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="live-status-select-label">Status Filter</InputLabel>
              <Select
                labelId="live-status-select-label"
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Employees ({attendance?.length || 0})</em>
                </MenuItem>
                <MenuItem value="IN">Currently IN ({countIn})</MenuItem>
                <MenuItem value="OUT">Punched OUT ({countOut})</MenuItem>
                <MenuItem value="ABSENT">Absent / Not In Yet ({countAbsent})</MenuItem>
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
            variant={isToday ? 'filled' : 'outlined'}
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
          {(selectedDate !== new Date().toISOString().split('T')[0] || searchQuery || statusFilter) && (
            <Tooltip title="Reset all filters to Today">
              <IconButton size="small" onClick={handleResetFilters} color="warning" sx={{ ml: 'auto' }}>
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Paper>

      {/* Policy Info Card */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AccessTimeIcon color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Office Window Policy
                </Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  08:00 AM – 08:00 PM
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TimerIcon color="secondary" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Required Daily Work Duration
                </Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  8 Hours (480 mins)
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CheckCircleIcon color="success" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Calculated For Date
                </Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  {selectedDate}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Grid */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !filteredAttendance || filteredAttendance.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary">
            No live attendance records found for {selectedDate}.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try selecting a different date or clearing your search filters.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredAttendance.map((record) => {
            const inSec = record.total_in_seconds || 0;
            const targetSec = (record.target_work_hours || 8) * 3600;
            const progressPercent = Math.min(100, Math.round((inSec / targetSec) * 100));

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={record.employee_id}>
                <Card
                  elevation={1}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: record.current_status === 'IN' ? 'success.main' : 'divider',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { boxShadow: 4 },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    {/* Employee Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: record.current_status === 'IN' ? 'success.main' : 'primary.main', fontWeight: 600 }}>
                        {record.employee_name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                          {record.employee_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {record.employee_code} • {record.device_name || 'Biometric'}
                        </Typography>
                      </Box>
                      <Chip
                        label={record.current_status}
                        color={getStatusColor(record.current_status)}
                        size="small"
                        sx={{ fontWeight: 700, px: 1 }}
                      />
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* First & Last Punches */}
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LoginIcon fontSize="inherit" color="success" /> First IN
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatTimeStr(record.first_in_time)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LogoutIcon fontSize="inherit" color="error" /> Last Punch
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatTimeStr(record.last_punch_time)}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Time Inside vs Time Outside */}
                    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5, mb: 2 }}>
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Time Inside Office
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="success.main">
                            {record.total_in_time_formatted || '0h 00m'}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Time Outside Office
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="warning.main">
                            {record.total_out_time_formatted || '0h 00m'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* 8 Hours Work Target Progress Bar */}
                    <Box sx={{ mt: 1, mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PauseCircleIcon fontSize="inherit" /> 8h Shift Target
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color={record.is_shift_completed ? 'success.main' : 'text.primary'}
                        >
                          {record.remaining_time_formatted}
                        </Typography>
                      </Box>
                      <Tooltip title={`Completed ${progressPercent}% of 8-Hour shift requirement`}>
                        <LinearProgress
                          variant="determinate"
                          value={progressPercent}
                          color={record.is_shift_completed ? 'success' : 'primary'}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Tooltip>
                    </Box>

                    {/* View All Punches Button */}
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<ListAltIcon />}
                      onClick={() => setSelectedRecord(record)}
                      sx={{ textTransform: 'none', borderRadius: 1.5 }}
                    >
                      View All Today's Punches ({record.today_punches_count || 0})
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Punch History Dialog */}
      <Dialog
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {selectedRecord?.employee_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Today's Biometric Punch Breakdown ({selectedRecord?.employee_code})
            </Typography>
          </Box>
          <Chip
            label={selectedRecord?.current_status}
            color={getStatusColor(selectedRecord?.current_status || '')}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </DialogTitle>
        <DialogContent dividers>
          {/* Summary Box */}
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Total Time IN Office</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="success.main">
                  {selectedRecord?.total_in_time_formatted}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Total Time OUT Office</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="warning.main">
                  {selectedRecord?.total_out_time_formatted}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Chronological Punch Sequence Today ({selectedRecord?.today_punches_count || 0} Punches)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Punch Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Verification</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedRecord?.today_punches_list?.map((p, idx) => (
                <TableRow key={idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{formatTimeStr(p.punch_time)}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.punch_type}
                      color={p.punch_type === 'IN' ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>{p.verification_type || 'Biometric'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRecord(null)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LiveAttendancePage;
