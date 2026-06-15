import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';

import { api, parseError } from '../../../utils/api';

// ==========================================
// TYPES
// ==========================================

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE' | 'HALF_DAY' | 'HOLIDAY';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  departmentName?: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
  lateByMinutes?: number;
  status: AttendanceStatus;
  notes?: string;
}

interface MyAttendance {
  id?: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
  status?: AttendanceStatus;
}

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  total: number;
}

// ==========================================
// MAPPERS
// ==========================================

const mapAttendanceRecord = (d: any): AttendanceRecord => ({
  id: d.id,
  employeeId: d.employee_id,
  employeeName: d.employee_name ?? `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim(),
  employeeCode: d.employee_code || undefined,
  departmentName: d.department_name || undefined,
  date: d.date,
  clockIn: d.clock_in || d.check_in || undefined,
  clockOut: d.clock_out || d.check_out || undefined,
  totalHours: d.total_hours ?? d.hours_worked ?? undefined,
  lateByMinutes: d.late_by_minutes ?? d.late_minutes ?? undefined,
  status: d.status ?? 'PRESENT',
  notes: d.notes || undefined,
});

const mapMyAttendance = (d: any): MyAttendance => ({
  id: d.id,
  date: d.date,
  clockIn: d.clock_in || d.check_in || undefined,
  clockOut: d.clock_out || d.check_out || undefined,
  totalHours: d.total_hours ?? d.hours_worked ?? undefined,
  status: d.status ?? undefined,
});

// ==========================================
// STATUS CONFIG
// ==========================================

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }
> = {
  PRESENT: { label: 'Present', color: 'success' },
  ABSENT: { label: 'Absent', color: 'error' },
  LATE: { label: 'Late', color: 'warning' },
  ON_LEAVE: { label: 'On Leave', color: 'info' },
  HALF_DAY: { label: 'Half Day', color: 'warning' },
  HOLIDAY: { label: 'Holiday', color: 'default' },
};

// ==========================================
// HELPERS
// ==========================================

const toISODate = (d: Date) => d.toISOString().split('T')[0];

const fmtTime = (t?: string) => {
  if (!t) return '—';
  // Handle "HH:MM:SS" or ISO datetime
  const timePart = t.includes('T') ? t.split('T')[1] : t;
  const [hh, mm] = timePart.split(':');
  const h = parseInt(hh, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${suffix}`;
};

const fmtHours = (hours?: number) => {
  if (hours === undefined || hours === null) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
};

const fmtLateBy = (minutes?: number) => {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ==========================================
// SUMMARY CARD
// ==========================================

interface SummaryCardProps {
  label: string;
  count: number;
  color: string;
  bgcolor: string;
  icon: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, count, color, bgcolor, icon }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ pb: '16px !important' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color, lineHeight: 1.2, mt: 0.5 }}>
            {count}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// ==========================================
// MAIN PAGE
// ==========================================

export const AttendancePage: React.FC = () => {
  const today = toISODate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message, severity });

  const queryClient = useQueryClient();

  // --- Attendance list for the selected date ---
  const { data: records = [], isLoading: recordsLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', selectedDate],
    queryFn: async () => {
      const response = await api.get('/attendance', { params: { date: selectedDate } });
      const items =
        response.data?.data?.attendance ||
        response.data?.data?.records ||
        response.data?.data ||
        response.data ||
        [];
      return Array.isArray(items) ? items.map(mapAttendanceRecord) : [];
    },
  });

  // --- My attendance for the selected date ---
  const { data: myAttendance, isLoading: myLoading } = useQuery<MyAttendance | null>({
    queryKey: ['attendance-my', selectedDate],
    queryFn: async () => {
      try {
        const response = await api.get('/attendance/me', { params: { date: selectedDate } });
        const d = response.data?.data?.attendance || response.data?.data || response.data;
        return d ? mapMyAttendance(d) : null;
      } catch {
        return null;
      }
    },
  });

  // --- Clock In mutation ---
  const clockIn = useMutation({
    mutationFn: async () => {
      const response = await api.post('/attendance/clock-in', { date: selectedDate });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-my', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedDate] });
      showSnack('Clocked in successfully.');
    },
    onError: (err) => showSnack(parseError(err), 'error'),
  });

  // --- Clock Out mutation ---
  const clockOut = useMutation({
    mutationFn: async () => {
      const response = await api.post('/attendance/clock-out', { date: selectedDate });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-my', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedDate] });
      showSnack('Clocked out successfully.');
    },
    onError: (err) => showSnack(parseError(err), 'error'),
  });

  // --- Summary ---
  const summary = useMemo<AttendanceSummary>(() => {
    const s: AttendanceSummary = { present: 0, absent: 0, late: 0, onLeave: 0, total: records.length };
    records.forEach((r) => {
      if (r.status === 'PRESENT') s.present++;
      else if (r.status === 'ABSENT') s.absent++;
      else if (r.status === 'LATE') s.late++;
      else if (r.status === 'ON_LEAVE') s.onLeave++;
    });
    return s;
  }, [records]);

  const isToday = selectedDate === today;
  const canClockIn = isToday && !myLoading && !myAttendance?.clockIn;
  const canClockOut = isToday && !myLoading && !!myAttendance?.clockIn && !myAttendance?.clockOut;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Attendance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Daily attendance tracking and management
          </Typography>
        </Box>
      </Box>

      {/* Mark My Attendance — only show for today */}
      <Card sx={{ mb: 3, borderLeft: '4px solid', borderColor: 'primary.main' }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
            Mark My Attendance
          </Typography>

          {myLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading your attendance…
            </Typography>
          ) : (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                {myAttendance?.clockIn ? (
                  <Chip
                    icon={<LoginIcon sx={{ fontSize: 16 }} />}
                    label={`Clocked In: ${fmtTime(myAttendance.clockIn)}`}
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                ) : (
                  <Chip
                    icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                    label="Not yet clocked in"
                    color="default"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}

                {myAttendance?.clockOut && (
                  <Chip
                    icon={<LogoutIcon sx={{ fontSize: 16 }} />}
                    label={`Clocked Out: ${fmtTime(myAttendance.clockOut)}`}
                    color="warning"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}

                {myAttendance?.totalHours !== undefined && myAttendance.totalHours > 0 && (
                  <Chip
                    icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                    label={`${fmtHours(myAttendance.totalHours)} worked`}
                    color="info"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}

                {myAttendance?.status && (
                  <Chip
                    label={STATUS_CONFIG[myAttendance.status]?.label ?? myAttendance.status}
                    color={STATUS_CONFIG[myAttendance.status]?.color ?? 'default'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Stack>

              <Box sx={{ ml: { sm: 'auto' } }}>
                <Stack direction="row" spacing={1}>
                  {canClockIn && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<LoginIcon />}
                      onClick={() => clockIn.mutate()}
                      disabled={clockIn.isPending}
                    >
                      {clockIn.isPending ? 'Clocking In…' : 'Clock In'}
                    </Button>
                  )}
                  {canClockOut && (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<LogoutIcon />}
                      onClick={() => clockOut.mutate()}
                      disabled={clockOut.isPending}
                      sx={{ color: 'white' }}
                    >
                      {clockOut.isPending ? 'Clocking Out…' : 'Clock Out'}
                    </Button>
                  )}
                  {!isToday && (
                    <Typography variant="body2" color="text.secondary">
                      Switch to today to mark attendance.
                    </Typography>
                  )}
                  {isToday && myAttendance?.clockIn && myAttendance?.clockOut && (
                    <Chip
                      icon={<CheckCircleOutlinedIcon />}
                      label="Attendance complete"
                      color="success"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Date Picker */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            label="Date"
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 200 }}
          />
          {selectedDate !== today && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedDate(today)}
            >
              Jump to Today
            </Button>
          )}
        </Stack>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            label="Present"
            count={summary.present}
            color="#2e7d32"
            bgcolor="#e8f5e9"
            icon={<PeopleAltIcon sx={{ color: '#2e7d32', fontSize: 22 }} />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            label="Absent"
            count={summary.absent}
            color="#c62828"
            bgcolor="#ffebee"
            icon={<PersonOffIcon sx={{ color: '#c62828', fontSize: 22 }} />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            label="Late"
            count={summary.late}
            color="#e65100"
            bgcolor="#fff3e0"
            icon={<ScheduleIcon sx={{ color: '#e65100', fontSize: 22 }} />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            label="On Leave"
            count={summary.onLeave}
            color="#1565c0"
            bgcolor="#e3f2fd"
            icon={<BeachAccessIcon sx={{ color: '#1565c0', fontSize: 22 }} />}
          />
        </Grid>
      </Grid>

      {/* Attendance Table */}
      <Card>
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Attendance Log — {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </Typography>
        </Box>
        <Divider />

        {recordsLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading attendance records…
            </Typography>
          </Box>
        ) : records.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No attendance records found for this date.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {[
                    'Employee',
                    'Department',
                    'Clock In',
                    'Clock Out',
                    'Total Hours',
                    'Status',
                    'Late By',
                  ].map((h) => (
                    <TableCell
                      key={h}
                      sx={{ fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((rec) => {
                  const statusCfg = STATUS_CONFIG[rec.status] ?? { label: rec.status, color: 'default' as const };
                  const lateBy = fmtLateBy(rec.lateByMinutes);
                  return (
                    <TableRow key={rec.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {rec.employeeName}
                          </Typography>
                          {rec.employeeCode && (
                            <Typography variant="caption" color="text.secondary">
                              {rec.employeeCode}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {rec.departmentName ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {fmtTime(rec.clockIn)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {fmtTime(rec.clockOut)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {fmtHours(rec.totalHours)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusCfg.label}
                          size="small"
                          color={statusCfg.color}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        {lateBy ? (
                          <Chip
                            label={lateBy}
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendancePage;
