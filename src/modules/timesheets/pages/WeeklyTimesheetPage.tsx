import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Tooltip,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import SendIcon from '@mui/icons-material/Send';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { api, parseError } from '../../../utils/api';
import { useGetTimeEntries } from '../services/timesheetService';
import { useGetEmployees } from '../../hr/services/hrService';
import { useAuthStore } from '../../../store/useAuthStore';


// ==========================================
// HELPERS
// ==========================================
const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const getWeekDates = (monday: Date): Date[] => {
  return DAY_LABELS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const formatWeekRange = (monday: Date): string => {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${monday.toLocaleDateString('en-US', opts)} — ${sunday.toLocaleDateString('en-US', opts)}`;
};

export const WeeklyTimesheetPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Auth Store details
  const authUser = useAuthStore((s) => s.user);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const roles = useAuthStore((s) => s.roles);
  
  const isManagerOrAdmin = useMemo(() => {
    if (isSuperAdmin()) return true;
    const managerRoleKeywords = ['manager', 'admin', 'ceo', 'lead', 'atl', 'tl', 'development', 'bd', 'head', 'supervisor'];
    return roles.some((r) => {
      const lower = r.toLowerCase();
      return managerRoleKeywords.some((kw) => lower.includes(kw));
    }) || roles.length > 0;
  }, [isSuperAdmin, roles]);

  const currentEmployeeId = authUser?.employeeId;

  // Filter States
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(currentEmployeeId || '');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectActionType, setRejectActionType] = useState<'REJECT' | 'RETURN'>('REJECT');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const weekDates = useMemo(() => getWeekDates(monday), [monday]);
  const dateFrom = formatDateISO(weekDates[0]);
  const dateTo = formatDateISO(weekDates[6]);

  // Queries
  const { data: employeesData } = useGetEmployees({ limit: 200 }, { enabled: isManagerOrAdmin });
  const employees = employeesData?.employees ?? [];

  const { data: entriesData, isLoading: entriesLoading, refetch: refetchEntries } = useGetTimeEntries({
    employeeId: selectedEmployeeId || undefined,
    dateFrom,
    dateTo,
    limit: 200,
  });

  const entries = entriesData?.entries ?? [];

  // Group entries by task ID
  const taskRows = useMemo(() => {
    const map = new Map<string, { taskId: string; taskCode: string; taskTitle: string; projectName: string; days: Record<string, number> }>();
    
    for (const e of entries) {
      if (!e.taskId) continue;
      const dateKey = e.date;
      let row = map.get(e.taskId);
      if (!row) {
        row = {
          taskId: e.taskId,
          taskCode: e.taskCode || '—',
          taskTitle: e.taskTitle || '—',
          projectName: e.projectName || '—',
          days: {},
        };
        map.set(e.taskId, row);
      }
      row.days[dateKey] = (row.days[dateKey] || 0) + (e.hoursSpent ?? 0);
    }
    
    return Array.from(map.values());
  }, [entries]);

  // Derive Week status
  // APPROVED: All time entries are APPROVED
  // SUBMITTED: All time entries are SUBMITTED (and none DRAFT/REJECTED)
  // DRAFT: Has DRAFT/REJECTED entries, or no entries yet.
  const weekStatus = useMemo<'DRAFT' | 'SUBMITTED' | 'APPROVED'>(() => {
    if (entries.length === 0) return 'DRAFT';
    
    const statuses = entries.map((e) => e.status);
    if (statuses.every((s) => s === 'APPROVED')) return 'APPROVED';
    if (statuses.every((s) => s === 'APPROVED' || s === 'SUBMITTED') && statuses.includes('SUBMITTED')) return 'SUBMITTED';
    return 'DRAFT';
  }, [entries]);

  // Timesheet Locking Check: lock if status is SUBMITTED or APPROVED
  const isTimesheetLocked = weekStatus === 'SUBMITTED' || weekStatus === 'APPROVED';

  // Actions Mutations
  const submitWeekMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/time-entries/submit-week', {
        date_from: dateFrom,
        date_to: dateTo,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      refetchEntries();
      alert('Timesheet submitted successfully.');
    },
    onError: (err) => {
      alert('Failed to submit week: ' + parseError(err));
    },
  });

  const approveWeekMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/time-entries/approve-week', {
        employee_id: selectedEmployeeId,
        date_from: dateFrom,
        date_to: dateTo,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      refetchEntries();
      alert('Timesheet approved successfully.');
    },
    onError: (err) => {
      alert('Failed to approve week: ' + parseError(err));
    },
  });

  const rejectWeekMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await api.post('/time-entries/reject-week', {
        employee_id: selectedEmployeeId,
        date_from: dateFrom,
        date_to: dateTo,
        reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      refetchEntries();
      setRejectDialogOpen(false);
      setRejectReason('');
      alert('Timesheet rejected/returned successfully.');
    },
    onError: (err) => {
      alert('Failed to reject: ' + parseError(err));
    },
  });

  const getTaskTotalHours = (rowDays: Record<string, number>): number => {
    return Object.values(rowDays).reduce((sum, v) => sum + v, 0);
  };

  const getWeekTotalHours = (): number => {
    return entries.reduce((sum, e) => sum + (e.hoursSpent ?? 0), 0);
  };

  const getDayTotalHours = (dateKey: string): number => {
    return entries
      .filter((e) => e.date === dateKey)
      .reduce((sum, e) => sum + (e.hoursSpent ?? 0), 0);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newMonday = new Date(monday);
    newMonday.setDate(monday.getDate() + (direction === 'next' ? 7 : -7));
    setMonday(newMonday);
    setPage(0);
  };

  const goToToday = () => {
    setMonday(getMonday(new Date()));
    setPage(0);
  };

  const getDayLabel = (date: Date) => {
    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          {DAY_LABELS[date.getDay() === 0 ? 6 : date.getDay() - 1]}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: isToday ? 800 : 500,
            color: isToday ? 'primary.main' : 'text.primary',
            bgcolor: isToday ? 'primary.50' : 'transparent',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
          }}
        >
          {date.getDate()}
        </Typography>
      </Box>
    );
  };

  const paginatedRows = taskRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const getStatusChipColor = (status: string) => {
    if (status === 'APPROVED') return 'success';
    if (status === 'SUBMITTED') return 'warning';
    return 'default';
  };

  const handleOpenRejectDialog = (type: 'REJECT' | 'RETURN') => {
    setRejectActionType(type);
    setRejectReason(type === 'RETURN' ? 'Returned for correction' : '');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert('A reason is required to reject/return.');
      return;
    }
    rejectWeekMutation.mutate(rejectReason.trim());
  };

  const approvedByInfo = useMemo(() => {
    const approvedEntry = entries.find((e) => e.status === 'APPROVED' && (e.approvedByName || e.approvedBy));
    if (!approvedEntry) return null;
    const name = approvedEntry.approvedByName || 'Manager';
    const dateStr = approvedEntry.approvedAt ? new Date(approvedEntry.approvedAt).toLocaleDateString() : '';
    return { name, dateStr };
  }, [entries]);

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Weekly Timesheet
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Auto-generated summary from your task work sessions.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            icon={isTimesheetLocked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
            label={isTimesheetLocked ? 'Locked' : 'Open'}
            color={isTimesheetLocked ? 'warning' : 'success'}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 600 }}
          />
          <Tooltip title={approvedByInfo ? `Approved by ${approvedByInfo.name}${approvedByInfo.dateStr ? ` on ${approvedByInfo.dateStr}` : ''}` : `Status: ${weekStatus}`}>
            <Chip
              label={approvedByInfo && weekStatus === 'APPROVED' ? `Approved by ${approvedByInfo.name}` : `Status: ${weekStatus}`}
              color={getStatusChipColor(weekStatus)}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Tooltip>
          <Button variant="outlined" color="secondary" onClick={() => navigate('/timesheets')} size="small">
            Session History
          </Button>
        </Stack>
      </Box>

      {/* Week Navigation & Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size="auto">
              <IconButton onClick={() => navigateWeek('prev')} size="small">
                <ChevronLeftIcon />
              </IconButton>
            </Grid>
            <Grid size="auto">
              <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 260, textAlign: 'center' }}>
                {formatWeekRange(monday)}
              </Typography>
            </Grid>
            <Grid size="auto">
              <IconButton onClick={() => navigateWeek('next')} size="small">
                <ChevronRightIcon />
              </IconButton>
            </Grid>
            <Grid size="auto">
              <Tooltip title="Go to current week">
                <IconButton onClick={goToToday} size="small" color="primary">
                  <TodayIcon />
                </IconButton>
              </Tooltip>
            </Grid>

            {/* Manager Filter */}
            {isManagerOrAdmin && (
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Employee</InputLabel>
                  <Select
                    value={selectedEmployeeId}
                    label="Employee"
                    onChange={(e) => {
                      setSelectedEmployeeId(e.target.value);
                      setPage(0);
                    }}
                  >
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.username})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid size="grow" sx={{ flexGrow: 1 }} />
            
            {/* Total Hours */}
            <Grid size="auto" sx={{ mr: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mr: 1, display: 'inline' }}>
                Week Total:
              </Typography>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 700, display: 'inline' }}>
                {getWeekTotalHours().toFixed(1)} hrs
              </Typography>
            </Grid>

            {/* Action Buttons */}
            <Grid size="auto">
              {/* Employee Submit Button */}
              {selectedEmployeeId === currentEmployeeId && weekStatus === 'DRAFT' && getWeekTotalHours() > 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={submitWeekMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                  onClick={() => submitWeekMutation.mutate()}
                  disabled={submitWeekMutation.isPending}
                >
                  Submit Week
                </Button>
              )}

              {/* Manager Approval Buttons */}
              {isManagerOrAdmin && selectedEmployeeId !== currentEmployeeId && weekStatus === 'SUBMITTED' && (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => approveWeekMutation.mutate()}
                    disabled={approveWeekMutation.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => handleOpenRejectDialog('REJECT')}
                    disabled={rejectWeekMutation.isPending}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<UndoIcon />}
                    onClick={() => handleOpenRejectDialog('RETURN')}
                    disabled={rejectWeekMutation.isPending}
                  >
                    Return
                  </Button>
                </Stack>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Timesheet Grid */}
      <Card>
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 200, fontWeight: 700 }}>Task</TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: 700 }}>Project</TableCell>
                {weekDates.map((date) => (
                  <TableCell key={date.toISOString()} sx={{ px: 0.5, minWidth: 70 }} align="center">
                    {getDayLabel(date)}
                  </TableCell>
                ))}
                <TableCell sx={{ minWidth: 70, fontWeight: 700 }} align="center">
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entriesLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      No hours logged during this week.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => {
                  const total = getTaskTotalHours(row.days);
                  return (
                    <TableRow key={row.taskId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.taskCode}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', maxWidth: 220 }} noWrap>
                          {row.taskTitle}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {row.projectName}
                        </Typography>
                      </TableCell>
                      {weekDates.map((date) => {
                        const dateKey = formatDateISO(date);
                        const val = row.days[dateKey] || 0;
                        return (
                          <TableCell key={dateKey} align="center" sx={{ px: 0.5, py: 1 }}>
                            <Box
                              sx={{
                                width: 44,
                                py: 0.75,
                                border: '1px solid',
                                borderColor: val > 0 ? 'primary.light' : 'divider',
                                borderRadius: 1,
                                bgcolor: val > 0 ? 'primary.light' : 'transparent',
                                color: val > 0 ? 'primary.dark' : 'text.disabled',
                                fontWeight: val > 0 ? 700 : 400,
                                fontSize: '0.85rem',
                                display: 'inline-block',
                              }}
                            >
                              {val > 0 ? val.toFixed(1) : '—'}
                            </Box>
                          </TableCell>
                        );
                      })}
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: total > 0 ? 'primary.dark' : 'text.disabled' }}
                        >
                          {total.toFixed(1)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}

              {/* Column Totals Row */}
              {!entriesLoading && taskRows.length > 0 && (
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                    Daily Totals
                  </TableCell>
                  {weekDates.map((date) => {
                    const dateKey = formatDateISO(date);
                    const dayTotal = getDayTotalHours(dateKey);
                    return (
                      <TableCell key={dateKey} align="center" sx={{ fontWeight: 700, color: dayTotal > 0 ? 'text.primary' : 'text.disabled' }}>
                        {dayTotal > 0 ? dayTotal.toFixed(1) : '—'}
                      </TableCell>
                    );
                  })}
                  <TableCell align="center" sx={{ fontWeight: 800, color: 'primary.dark' }}>
                    {getWeekTotalHours().toFixed(1)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {taskRows.length > rowsPerPage && (
          <TablePagination
            rowsPerPageOptions={[15, 30, 50]}
            component="div"
            count={taskRows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_e, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt((e.target as HTMLInputElement).value, 10)); setPage(0); }}
          />
        )}
      </Card>

      {/* Reject / Return Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {rejectActionType === 'RETURN' ? 'Return Timesheet' : 'Reject Timesheet'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason / Remarks"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            error={!rejectReason.trim()}
            helperText={!rejectReason.trim() ? 'A reason is required.' : ''}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRejectDialogOpen(false)} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReject}
            color={rejectActionType === 'RETURN' ? 'warning' : 'error'}
            variant="contained"
            disabled={!rejectReason.trim() || rejectWeekMutation.isPending}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeeklyTimesheetPage;
