import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import WorkIcon from '@mui/icons-material/Work';
import TimerIcon from '@mui/icons-material/Timer';
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
// POLICY SETTINGS PANEL COMPONENT
// ==========================================

interface PolicySettingsPanelProps {
  showSnack: (message: any, severity?: 'success' | 'error') => void;
}

const PolicySettingsPanel: React.FC<PolicySettingsPanelProps> = ({ showSnack }) => {
  const queryClient = useQueryClient();

  const { data: rule, isLoading } = useQuery<any>({
    queryKey: ['attendance-rules'],
    queryFn: async () => {
      const res = await api.get('/attendance/rules');
      return res.data?.data?.rule || res.data?.data || null;
    },
  });

  const [draft, setDraft] = useState<Record<string, any>>({});

  const isDirty = Object.keys(draft).length > 0;

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await api.put('/attendance/rules', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-rules'] });
      setDraft({});
      showSnack('Workforce policy updated successfully.', 'success');
    },
    onError: (err: any) => {
      showSnack(parseError(err), 'error');
    },
  });

  const getValue = (field: string) => {
    if (field in draft) return draft[field];
    return rule?.[field] ?? '';
  };

  const handleChange = (field: string, value: any) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const payload: Record<string, any> = {};
    Object.entries(draft).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) {
        payload[k] = typeof v === 'string' && !isNaN(Number(v)) ? Number(v) : v;
      }
    });
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <Card sx={{ p: 3 }}>
        <Typography color="text.secondary">Loading policy settings…</Typography>
      </Card>
    );
  }

  return (
    <Box>
      {/* Section 1: Office Hours */}
      <Accordion defaultExpanded sx={{ mb: 1.5, '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', overflow: 'hidden' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'background.paper', px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WorkIcon color="primary" fontSize="small" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Office Hours &amp; Attendance Rules
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Configure work schedule, late marks, and daily thresholds
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Office Start Time"
                type="time"
                size="small"
                fullWidth
                value={getValue('office_start_time')}
                onChange={(e) => handleChange('office_start_time', e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="When the official workday begins"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Office End Time"
                type="time"
                size="small"
                fullWidth
                value={getValue('office_end_time')}
                onChange={(e) => handleChange('office_end_time', e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="When the official workday ends"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Late Mark Grace Period"
                type="number"
                size="small"
                fullWidth
                value={getValue('late_mark_after_minutes')}
                onChange={(e) => handleChange('late_mark_after_minutes', e.target.value)}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">min</InputAdornment> } }}
                helperText="Minutes after start time before marking late"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Half Day Hours"
                type="number"
                size="small"
                fullWidth
                value={getValue('half_day_hours')}
                onChange={(e) => handleChange('half_day_hours', e.target.value)}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">hrs</InputAdornment> } }}
                helperText="Threshold for half-day classification"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Overtime Threshold"
                type="number"
                size="small"
                fullWidth
                value={getValue('overtime_threshold_hours')}
                onChange={(e) => handleChange('overtime_threshold_hours', e.target.value)}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">hrs</InputAdornment> } }}
                helperText="Daily hours before overtime accrues"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <TextField
                label="Working Days"
                size="small"
                fullWidth
                value={getValue('work_days')}
                onChange={(e) => handleChange('work_days', e.target.value)}
                helperText="Comma-separated: MON,TUE,WED,THU,FRI"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Section 2: Productivity Policy */}
      <Accordion defaultExpanded sx={{ mb: 1.5, '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', overflow: 'hidden' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'background.paper', px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TimerIcon color="success" fontSize="small" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Productivity &amp; Break Policy
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Set required productive hours and break time limits for KPI calculations
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                label="Required Productive Hours"
                type="number"
                size="small"
                fullWidth
                value={getValue('required_productive_hours')}
                onChange={(e) => handleChange('required_productive_hours', e.target.value)}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">hrs/day</InputAdornment> } }}
                helperText="Daily target for Productivity % and KPI calculations"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                label="Max Break Time"
                type="number"
                size="small"
                fullWidth
                value={getValue('max_break_minutes')}
                onChange={(e) => handleChange('max_break_minutes', e.target.value)}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">min</InputAdornment> } }}
                helperText="Exceeding this triggers a warning in Break KPI"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                label="Min Break Time"
                type="number"
                size="small"
                fullWidth
                value={getValue('min_break_minutes')}
                onChange={(e) => handleChange('min_break_minutes', e.target.value)}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">min</InputAdornment> } }}
                helperText="Minimum recommended break per day"
              />
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
              KPI Formula Reference
            </Typography>
            <Typography variant="caption" component="span">
              Productivity % = Productive ÷ Org Time × 100 &nbsp;|&nbsp;
              Org Utilization % = Org ÷ Presence × 100 &nbsp;|&nbsp;
              Attendance Util % = Productive ÷ Presence × 100
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>

      {/* Save Button */}
      {isDirty && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Policy Changes'}
          </Button>
        </Box>
      )}
    </Box>
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

      {/* ── Workforce Policy Settings ── */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <SettingsIcon color="action" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Workforce Policy Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            — Configure attendance rules and productivity targets. Changes affect all employees.
          </Typography>
        </Box>
        <PolicySettingsPanel showSnack={showSnack} />
      </Box>

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
