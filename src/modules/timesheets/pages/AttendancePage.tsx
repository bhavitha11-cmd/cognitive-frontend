import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  InputAdornment,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
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
import {
  useGetActiveBreak,
  useStartBreak,
  useEndBreak
} from '../services/workSessionService';
import { useGetCalendarSettings } from '../../master-data/services/calendarConfigService';
import { useAuthStore } from '../../../store/useAuthStore';

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

const toISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const fmtTime = (t?: string) => {
  if (!t) return '—';
  // Backend stores timestamps as UTC (ISO with offset). Convert to the
  // viewer's local time (IST for this org) for display.
  if (t.includes('T')) {
    const d = new Date(t);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }
  // Fallback: bare "HH:MM[:SS]" string with no date/offset info — render as-is.
  const [hh, mm] = t.split(':');
  const h = parseInt(hh, 10);
  if (isNaN(h)) return t;
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
// SHIFT & WORKDAYS INFO CARD (read-only)
// Sourced from Master Data → Calendar Configuration
// ==========================================

const ShiftInfoCard: React.FC = () => {
  const { data: settings, isLoading } = useGetCalendarSettings();

  if (isLoading || !settings) return null;

  const days = settings.workingDays
    ? settings.workingDays.split(',').map((d) => d.trim())
    : [];

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AccessTimeIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Shift &amp; Workdays
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            — Configured in Master Data › Calendar Configuration
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Office Start
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
              {settings.officeStartTime || '—'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Office End
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
              {settings.officeEndTime || '—'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Daily Hours
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
              {settings.workingHoursPerDay} hrs
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Weekend
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
              {settings.weekendDays || '—'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Working Days
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.75 }}>
              {days.map((d) => (
                <Chip key={d} label={d} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
              ))}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

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

  const showSnack = (message: any, severity: 'success' | 'error' = 'success') => {
    let msgStr = '';
    if (typeof message === 'string') {
      msgStr = message;
    } else {
      msgStr = parseError(message);
    }
    setSnackbar({ open: true, message: msgStr, severity });
  };

  const [clockInConfirmOpen, setClockInConfirmOpen] = useState(false);
  const [clockOutConfirmOpen, setClockOutConfirmOpen] = useState(false);

  // Missed clock-out request dialog
  const [missedDialogOpen, setMissedDialogOpen] = useState(false);
  const [missedDate, setMissedDate] = useState('');
  const [missedTime, setMissedTime] = useState('');
  const [missedReason, setMissedReason] = useState('');

  // Missed clock-in request dialog
  const [missedClockinDialogOpen, setMissedClockinDialogOpen] = useState(false);
  const [missedClockinDate, setMissedClockinDate] = useState('');
  const [missedClockinTime, setMissedClockinTime] = useState('');
  const [missedClockinReason, setMissedClockinReason] = useState('');

  // Admin: pending requests panel visibility
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [showPendingClockinRequests, setShowPendingClockinRequests] = useState(false);

  const handleClockInConfirm = () => {
    setClockInConfirmOpen(false);
    clockIn.mutate();
  };

  const handleClockOutConfirm = () => {
    setClockOutConfirmOpen(false);
    clockOut.mutate();
  };

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
      queryClient.invalidateQueries({ queryKey: ['productivity'] });
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
      queryClient.invalidateQueries({ queryKey: ['productivity'] });
      showSnack('Clocked out successfully.');
    },
    onError: (err) => showSnack(parseError(err), 'error'),
  });

  // --- Missed clock-out request mutation ---
  const submitMissedRequest = useMutation({
    mutationFn: async (payload: { attendance_date: string; requested_clock_out: string; reason: string }) => {
      const response = await api.post('/attendance/missed-clockout-request', payload);
      return response.data;
    },
    onSuccess: () => {
      setMissedDialogOpen(false);
      setMissedDate('');
      setMissedTime('');
      setMissedReason('');
      showSnack('Missed clock-out request submitted. Awaiting admin approval.');
    },
    onError: (err) => showSnack(parseError(err), 'error'),
  });

  // --- Admin: pending missed clock-out requests ---
  const { data: pendingRequestsData, refetch: refetchPending } = useQuery({
    queryKey: ['missed-clockout-requests', 'PENDING'],
    queryFn: async () => {
      const response = await api.get('/attendance/missed-clockout-requests', { params: { status: 'PENDING' } });
      return response.data?.data?.requests ?? [];
    },
    enabled: showPendingRequests,
  });
  const pendingRequests: any[] = pendingRequestsData ?? [];

  const approveMissedRequest = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.post(`/attendance/missed-clockout-requests/${id}/approve`, { review_notes: notes });
      return response.data;
    },
    onSuccess: () => {
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedDate] });
      showSnack('Request approved. Attendance updated.');
    },
    onError: (err) => showSnack(parseError(err), 'error'),
  });

  const rejectMissedRequest = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.post(`/attendance/missed-clockout-requests/${id}/reject`, { review_notes: notes });
      return response.data;
    },
    onSuccess: () => {
      refetchPending();
      showSnack('Request rejected.');
    },
    onError: (err) => showSnack(parseError(err), 'error'),
  });

  const handleSubmitMissedRequest = () => {
    if (!missedDate || !missedTime || !missedReason.trim()) return;
    // The employee enters their LOCAL (IST) date + time. Build a Date from the
    // local wall-clock values, then serialize to a proper UTC ISO string so the
    // backend receives the correct instant regardless of the viewer's timezone.
    const [year, month, day] = missedDate.split('-').map(Number);
    const [hours, minutes] = missedTime.split(':').map(Number);
    const localDate = new Date(year, month - 1, day, hours, minutes, 0);
    const isoDateTime = localDate.toISOString();
    submitMissedRequest.mutate({
      attendance_date: missedDate,
      requested_clock_out: isoDateTime,
      reason: missedReason.trim(),
    });
  };

  // --- Missed clock-in request mutation ---
  const submitMissedClockinRequest = useMutation({
    mutationFn: async (payload: { attendance_date: string; requested_clock_in: string; reason: string }) => {
      const response = await api.post('/attendance/missed-clockin-request', payload);
      return response.data;
    },
    onSuccess: () => {
      setMissedClockinDialogOpen(false);
      setMissedClockinDate('');
      setMissedClockinTime('');
      setMissedClockinReason('');
      showSnack('Missed clock-in request submitted. Awaiting admin approval.');
    },
    onError: (err) => showSnack(parseError(err), 'error'),
  });

  // --- Admin: pending missed clock-in requests ---
  const { data: pendingClockinRequestsData, refetch: refetchPendingClockin } = useQuery({
    queryKey: ['missed-clockin-requests', 'PENDING'],
    queryFn: async () => {
      const response = await api.get('/attendance/missed-clockin-requests', { params: { status: 'PENDING' } });
      return response.data?.data?.requests ?? [];
    },
    enabled: showPendingClockinRequests,
  });
  const pendingClockinRequests: any[] = pendingClockinRequestsData ?? [];

  const approveMissedClockinRequest = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.post(`/attendance/missed-clockin-requests/${id}/approve`, { review_notes: notes });
      return response.data;
    },
    onSuccess: () => {
      refetchPendingClockin();
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['attendance-my', selectedDate] });
      showSnack('Request approved. Attendance updated.');
    },
    onError: (err) => showSnack(parseError(err), 'error'),
  });

  const rejectMissedClockinRequest = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.post(`/attendance/missed-clockin-requests/${id}/reject`, { review_notes: notes });
      return response.data;
    },
    onSuccess: () => {
      refetchPendingClockin();
      showSnack('Request rejected.');
    },
    onError: (err) => showSnack(parseError(err), 'error'),
  });

  const handleSubmitMissedClockinRequest = () => {
    if (!missedClockinDate || !missedClockinTime || !missedClockinReason.trim()) return;
    const [year, month, day] = missedClockinDate.split('-').map(Number);
    const [hours, minutes] = missedClockinTime.split(':').map(Number);
    const localDate = new Date(year, month - 1, day, hours, minutes, 0);
    const isoDateTime = localDate.toISOString();
    submitMissedClockinRequest.mutate({
      attendance_date: missedClockinDate,
      requested_clock_in: isoDateTime,
      reason: missedClockinReason.trim(),
    });
  };

  // --- Break hook calls ---
  const { data: activeBreak } = useGetActiveBreak();
  const startBreak = useStartBreak();
  const endBreak = useEndBreak();

  const handleStartBreak = () => {
    startBreak.mutate(undefined, {
      onSuccess: () => {
        const channel = new BroadcastChannel('cognitive-timesheets');
        channel.postMessage({ type: 'SESSION_SYNC' });
        channel.close();
        queryClient.invalidateQueries({ queryKey: ['attendance-my', selectedDate] });
        queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
        queryClient.invalidateQueries({ queryKey: ['breaks'] });
        queryClient.invalidateQueries({ queryKey: ['productivity'] });
        showSnack('Break started successfully.');
      },
      onError: (err) => showSnack(parseError(err), 'error'),
    });
  };

  const handleEndBreak = () => {
    endBreak.mutate(undefined, {
      onSuccess: () => {
        const channel = new BroadcastChannel('cognitive-timesheets');
        channel.postMessage({ type: 'SESSION_SYNC' });
        channel.close();
        queryClient.invalidateQueries({ queryKey: ['attendance-my', selectedDate] });
        queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
        queryClient.invalidateQueries({ queryKey: ['breaks'] });
        queryClient.invalidateQueries({ queryKey: ['productivity'] });
        showSnack('Break ended successfully.');
      },
      onError: (err) => showSnack(parseError(err), 'error'),
    });
  };

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
  const isClockedIn = !!myAttendance?.clockIn;
  const isClockedOut = !!myAttendance?.clockOut;
  const isOnBreak = !!activeBreak;

  const canClockIn = isToday && !myLoading && !myAttendance?.clockIn;
  const canClockOut = isToday && !myLoading && !!myAttendance?.clockIn && !myAttendance?.clockOut && !isOnBreak;
  const canStartBreak = isToday && !myLoading && isClockedIn && !isClockedOut && !isOnBreak;
  const canEndBreak = isToday && !myLoading && isOnBreak;

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
                      onClick={() => setClockInConfirmOpen(true)}
                      disabled={clockIn.isPending}
                    >
                      {clockIn.isPending ? 'Clocking In…' : 'Clock In'}
                    </Button>
                  )}
                  {canStartBreak && (
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={handleStartBreak}
                      disabled={startBreak.isPending}
                    >
                      {startBreak.isPending ? 'Starting Break…' : 'Start Break'}
                    </Button>
                  )}
                  {canEndBreak && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleEndBreak}
                      disabled={endBreak.isPending}
                    >
                      {endBreak.isPending ? 'Ending Break…' : 'End Break'}
                    </Button>
                  )}
                  {canClockOut && (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<LogoutIcon />}
                      onClick={() => setClockOutConfirmOpen(true)}
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
                  {/* Report missed clock-in for a past day */}
                  <Button
                    variant="outlined"
                    size="small"
                    color="info"
                    startIcon={<AccessTimeIcon />}
                    onClick={() => {
                      setMissedClockinDate(selectedDate !== today ? selectedDate : '');
                      setMissedClockinDialogOpen(true);
                    }}
                  >
                    Forgot to Clock In?
                  </Button>
                  {/* Report missed clock-out for a past day */}
                  <Button
                    variant="outlined"
                    size="small"
                    color="warning"
                    startIcon={<AccessTimeIcon />}
                    onClick={() => {
                      setMissedDate(selectedDate !== today ? selectedDate : '');
                      setMissedDialogOpen(true);
                    }}
                  >
                    Forgot to Clock Out?
                  </Button>
                </Stack>
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Date Picker */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
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

      {/* Admin: Missed Clock-In Requests Panel */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTimeIcon sx={{ color: 'info.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Missed Clock-In Requests
              </Typography>
              {pendingClockinRequests.length > 0 && (
                <Chip label={pendingClockinRequests.length} color="info" size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
              )}
            </Stack>
            <Button size="small" variant="outlined" onClick={() => setShowPendingClockinRequests((v) => !v)}>
              {showPendingClockinRequests ? 'Hide' : 'View Pending'}
            </Button>
          </Stack>
        </Box>
        {showPendingClockinRequests && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            {pendingClockinRequests.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No pending requests.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Requested Clock-In</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingClockinRequests.map((req: any) => (
                      <TableRow key={req.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{req.employee_name || '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">{req.employee_code || ''}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{req.attendance_date}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{fmtTime(req.requested_clock_in)}</Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{req.reason}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(req.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              disabled={approveMissedClockinRequest.isPending}
                              onClick={() => approveMissedClockinRequest.mutate({ id: req.id })}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              disabled={rejectMissedClockinRequest.isPending}
                              onClick={() => rejectMissedClockinRequest.mutate({ id: req.id, notes: 'Rejected by admin' })}
                            >
                              Reject
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Card>

      {/* Admin: Missed Clock-Out Requests Panel */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTimeIcon sx={{ color: 'warning.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Missed Clock-Out Requests
              </Typography>
              {pendingRequests.length > 0 && (
                <Chip label={pendingRequests.length} color="warning" size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
              )}
            </Stack>
            <Button size="small" variant="outlined" onClick={() => setShowPendingRequests((v) => !v)}>
              {showPendingRequests ? 'Hide' : 'View Pending'}
            </Button>
          </Stack>
        </Box>
        {showPendingRequests && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            {pendingRequests.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No pending requests.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Requested Clock-Out</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingRequests.map((req: any) => (
                      <TableRow key={req.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{req.employee_name || '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">{req.employee_code || ''}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{req.attendance_date}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{fmtTime(req.requested_clock_out)}</Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{req.reason}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(req.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              disabled={approveMissedRequest.isPending}
                              onClick={() => approveMissedRequest.mutate({ id: req.id })}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              disabled={rejectMissedRequest.isPending}
                              onClick={() => rejectMissedRequest.mutate({ id: req.id, notes: 'Rejected by admin' })}
                            >
                              Reject
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Card>

      {/* Missed Clock-In Request Dialog (Employee) */}
      <Dialog open={missedClockinDialogOpen} onClose={() => setMissedClockinDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Report Missed Clock-In</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: '0.875rem' }}>
            Enter the date and the time you actually started work. Your request will go to the admin for approval before the attendance record is updated.
          </DialogContentText>
          <Stack spacing={2.5}>
            <TextField
              label="Date you forgot to clock in"
              type="date"
              size="small"
              fullWidth
              value={missedClockinDate}
              onChange={(e) => setMissedClockinDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              inputProps={{ max: today }}
            />
            <TextField
              label="Time you actually arrived (your local time)"
              type="time"
              size="small"
              fullWidth
              value={missedClockinTime}
              onChange={(e) => setMissedClockinTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Reason"
              size="small"
              fullWidth
              multiline
              rows={3}
              value={missedClockinReason}
              onChange={(e) => setMissedClockinReason(e.target.value)}
              placeholder="e.g. Arrived on time but system was down, forgot to clock in, technical issues…"
              inputProps={{ maxLength: 500 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMissedClockinDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!missedClockinDate || !missedClockinTime || !missedClockinReason.trim() || submitMissedClockinRequest.isPending}
            onClick={handleSubmitMissedClockinRequest}
          >
            {submitMissedClockinRequest.isPending ? 'Submitting…' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Missed Clock-Out Request Dialog (Employee) */}
      <Dialog open={missedDialogOpen} onClose={() => setMissedDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Report Missed Clock-Out</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: '0.875rem' }}>
            Enter the date and the time you actually left. Your request will go to the admin for approval before the attendance record is updated.
          </DialogContentText>
          <Stack spacing={2.5}>
            <TextField
              label="Date you forgot to clock out"
              type="date"
              size="small"
              fullWidth
              value={missedDate}
              onChange={(e) => setMissedDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              inputProps={{ max: today }}
            />
            <TextField
              label="Time you actually left (your local time)"
              type="time"
              size="small"
              fullWidth
              value={missedTime}
              onChange={(e) => setMissedTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Reason"
              size="small"
              fullWidth
              multiline
              rows={3}
              value={missedReason}
              onChange={(e) => setMissedReason(e.target.value)}
              placeholder="e.g. Left in a hurry for an emergency, forgot to clock out on the system…"
              inputProps={{ maxLength: 500 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMissedDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={!missedDate || !missedTime || !missedReason.trim() || submitMissedRequest.isPending}
            onClick={handleSubmitMissedRequest}
          >
            {submitMissedRequest.isPending ? 'Submitting…' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* ── Shift & Workdays Info (read-only, sourced from Master Data → Calendar Configuration) ── */}
      <ShiftInfoCard />

      {/* Clock In Confirmation Dialog */}
      <Dialog
        open={clockInConfirmOpen}
        onClose={() => setClockInConfirmOpen(false)}
        aria-labelledby="clock-in-dialog-title"
        aria-describedby="clock-in-dialog-description"
      >
        <DialogTitle id="clock-in-dialog-title" sx={{ fontWeight: 600 }}>
          Confirm Clock In
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="clock-in-dialog-description">
            Are you sure you want to clock in? This will start recording your working hours for today.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClockInConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleClockInConfirm} color="success" variant="contained" autoFocus>
            Clock In
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clock Out Confirmation Dialog */}
      <Dialog
        open={clockOutConfirmOpen}
        onClose={() => setClockOutConfirmOpen(false)}
        aria-labelledby="clock-out-dialog-title"
        aria-describedby="clock-out-dialog-description"
      >
        <DialogTitle id="clock-out-dialog-title" sx={{ fontWeight: 600 }}>
          Confirm Clock Out
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="clock-out-dialog-description">
            Are you sure you want to clock out? This will end your working hours for today.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClockOutConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleClockOutConfirm} color="warning" variant="contained" autoFocus sx={{ color: 'white' }}>
            Clock Out
          </Button>
        </DialogActions>
      </Dialog>

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
