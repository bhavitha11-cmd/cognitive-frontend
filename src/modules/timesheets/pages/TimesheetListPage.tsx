import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';

import { parseError } from '../../../utils/api';
import { useGetMySessions } from '../services/workSessionService';
import { useGetTasks } from '../../tasks/services/taskService';
import { useGetProjects } from '../../projects/services/projectService';

// ==========================================
// HELPERS
// ==========================================
const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
};

const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getWeekRange = () => {
  const now = new Date();
  const monday = getMonday(now);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: formatDateISO(monday), end: formatDateISO(sunday) };
};

const STATUS_META: Record<string, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' }> = {
  RUNNING: { label: 'Running', color: 'success' },
  PAUSED: { label: 'Paused', color: 'warning' },
  COMPLETED: { label: 'Completed', color: 'primary' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
  ABANDONED: { label: 'Abandoned', color: 'error' },
};

const TYPE_META: Record<string, string> = {
  REGULAR: 'Regular Work',
  REWORK: 'Rework Cycle',
};

export const TimesheetListPage: React.FC = () => {
  const navigate = useNavigate();
  const weekRange = useMemo(() => getWeekRange(), []);

  // Filter States
  const [dateFrom, setDateFrom] = useState(weekRange.start);
  const [dateTo, setDateTo] = useState(weekRange.end);
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Queries
  const { data: tasksData } = useGetTasks({ limit: 300 });
  const { data: projectsData } = useGetProjects({ limit: 100 });

  const tasksMap = useMemo(() => {
    const map = new Map<string, any>();
    tasksData?.tasks?.forEach((t) => map.set(t.id, t));
    return map;
  }, [tasksData]);

  const projectsMap = useMemo(() => {
    const map = new Map<string, any>();
    projectsData?.projects?.forEach((p) => map.set(p.id, p));
    return map;
  }, [projectsData]);

  const queryParams = useMemo(
    () => ({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      status: statusFilter || undefined,
      skip: page * rowsPerPage,
      limit: rowsPerPage,
    }),
    [page, rowsPerPage, dateFrom, dateTo, statusFilter]
  );

  const { data, isLoading, isError, error, refetch } = useGetMySessions(queryParams);
  const rawSessions = data?.sessions ?? [];
  const totalCount = data?.total ?? 0;

  // Filter sessions by project client-side since API filters sessions mainly by user, dates and status
  const sessions = useMemo(() => {
    if (!projectFilter) return rawSessions;
    return rawSessions.filter((s) => s.projectId === projectFilter);
  }, [rawSessions, projectFilter]);

  // Project select options derived from projects loaded
  const projectOptions = useMemo(() => {
    return projectsData?.projects ?? [];
  }, [projectsData]);

  const totalHours = useMemo(() => {
    const mins = sessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
    return mins / 60.0;
  }, [sessions]);

  const handleResetFilters = () => {
    const wr = getWeekRange();
    setDateFrom(wr.start);
    setDateTo(wr.end);
    setProjectFilter('');
    setStatusFilter('');
    setPage(0);
  };

  const fmtTime = (isoString?: string) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const fmtDuration = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${hrs}h ${m > 0 ? m + 'm' : ''}`.trim() || '0m';
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Session History
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Review your tracked engineering work sessions and request corrections.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<EditCalendarIcon />}
          onClick={() => navigate('/timesheets/create')}
        >
          Manual Correction
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          {/* Date From */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              label="From"
              type="date"
              size="small"
              fullWidth
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(0);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          {/* Date To */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              label="To"
              type="date"
              size="small"
              fullWidth
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(0);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          {/* Project Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                value={projectFilter}
                label="Project"
                onChange={(e) => {
                  setProjectFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Projects</MenuItem>
                {projectOptions.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="RUNNING">Running</MenuItem>
                <MenuItem value="PAUSED">Paused</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="ABANDONED">Abandoned</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Reset */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Button variant="outlined" size="small" onClick={handleResetFilters} fullWidth sx={{ height: 38 }}>
              This Week
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Error */}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => refetch()}>
          {parseError(error)}
        </Alert>
      )}

      {/* Table */}
      <Card>
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Session Type</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                      No work sessions found for this period.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => {
                  const statusMeta = STATUS_META[session.status] ?? { label: session.status, color: 'default' };
                  const taskObj = tasksMap.get(session.taskId);
                  const projectObj = projectsMap.get(session.projectId);

                  return (
                    <TableRow key={session.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatDateISO(new Date(session.startTime))}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} color="primary">
                          {taskObj?.taskCode || '—'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" noWrap>
                          {taskObj?.title || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 160 }}>
                        <Typography variant="body2" noWrap>
                          {projectObj?.name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>{fmtTime(session.startTime)}</TableCell>
                      <TableCell>{fmtTime(session.endTime)}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {fmtDuration(session.durationMinutes)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={TYPE_META[session.sessionType] || session.sessionType}
                          size="small"
                          color={session.sessionType === 'REWORK' ? 'warning' : 'default'}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 18 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={statusMeta.label}
                          color={statusMeta.color}
                          size="small"
                          sx={{ fontWeight: 600, minWidth: 80 }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200, fontSize: '0.8rem' }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
                          {session.remarks || session.pauseReason || '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Total Row */}
        {!isLoading && sessions.length > 0 && (
          <Box
            sx={{
              px: 3,
              py: 1.5,
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
              Total Productive Time:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.dark' }}>
              {totalHours.toFixed(1)} hrs
            </Typography>
          </Box>
        )}

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Card>
    </Box>
  );
};

export default TimesheetListPage;
