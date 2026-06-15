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
  IconButton,
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
  Tooltip,
  Typography,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import { parseError } from '../../../utils/api';
import {
  useGetTimeEntries,
  useDeleteTimeEntry,
  useSubmitTimeEntry,
} from '../services/timesheetService';
import type { TimeEntry } from '../types';

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

const STATUS_META: Record<
  TimeEntry['status'],
  { label: string; color: 'default' | 'primary' | 'success' | 'error' }
> = {
  DRAFT: { label: 'Draft', color: 'default' },
  SUBMITTED: { label: 'Submitted', color: 'primary' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
};

const TYPE_META: Record<string, string> = {
  REGULAR: 'Regular',
  OVERTIME: 'Overtime',
  CORRECTION: 'Correction',
};

// ==========================================
// USER HELPERS
// ==========================================

const getCurrentUser = () => {
  try {
    const profile = localStorage.getItem('cognitive_profile');
    if (profile) return JSON.parse(profile);
  } catch {
    // ignore
  }
  return null;
};

const isAdmin = (profile: any): boolean => {
  if (!profile) return false;
  const adminRoles = ['Administrator', 'CEO', 'ADMIN', 'Chief Executive Officer', 'Manager'];
  const roles: string[] = profile.roles || [];
  return roles.some((r) => adminRoles.includes(r));
};

// ==========================================
// COMPONENT
// ==========================================

export const TimesheetListPage: React.FC = () => {
  const navigate = useNavigate();
  const profile = getCurrentUser();
  const userIsAdmin = isAdmin(profile);
  const currentEmployeeId: string | undefined = profile?.id || profile?.employee_id;

  const weekRange = useMemo(() => getWeekRange(), []);

  const [dateFrom, setDateFrom] = useState(weekRange.start);
  const [dateTo, setDateTo] = useState(weekRange.end);
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const queryParams = useMemo(
    () => ({
      skip: page * rowsPerPage,
      limit: rowsPerPage,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      employeeId: userIsAdmin ? undefined : currentEmployeeId,
      projectId: projectFilter || undefined,
      status: statusFilter || undefined,
    }),
    [page, rowsPerPage, dateFrom, dateTo, userIsAdmin, currentEmployeeId, projectFilter, statusFilter]
  );

  const { data, isLoading, isError, error, refetch } = useGetTimeEntries(queryParams);
  const deleteMutation = useDeleteTimeEntry();
  const submitMutation = useSubmitTimeEntry();

  const entries = data?.entries ?? [];
  const totalCount = data?.total ?? 0;

  // Derive unique project names for filter dropdown
  const projectOptions = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach((e) => {
      if (e.projectId && e.projectName) map.set(e.projectId, e.projectName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [entries]);

  const totalHours = useMemo(
    () => entries.reduce((sum, e) => sum + (e.hoursSpent ?? 0), 0),
    [entries]
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this time entry?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert('Failed to delete: ' + parseError(err));
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      await submitMutation.mutateAsync(id);
    } catch (err) {
      alert('Failed to submit: ' + parseError(err));
    }
  };

  const handleResetFilters = () => {
    const wr = getWeekRange();
    setDateFrom(wr.start);
    setDateTo(wr.end);
    setProjectFilter('');
    setStatusFilter('');
    setPage(0);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Timesheets
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/timesheets/create')}
        >
          Log Time
        </Button>
      </Box>

      {/* Filter Toolbar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
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
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="SUBMITTED">Submitted</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Reset */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Button variant="outlined" size="small" onClick={handleResetFilters} fullWidth>
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
                <TableCell>Task Code</TableCell>
                <TableCell>Task Title</TableCell>
                <TableCell>Project</TableCell>
                {userIsAdmin && <TableCell>Employee</TableCell>}
                <TableCell>Type</TableCell>
                <TableCell align="right">Hours</TableCell>
                <TableCell align="center">Billable</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={userIsAdmin ? 10 : 9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userIsAdmin ? 10 : 9} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                      No time entries found for the selected period.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const statusMeta = STATUS_META[entry.status] ?? { label: entry.status, color: 'default' as const };
                  const isDraft = entry.status === 'DRAFT';
                  return (
                    <TableRow key={entry.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {entry.date}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {entry.taskCode ? (
                          <Chip
                            label={entry.taskCode}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap>
                          {entry.taskTitle || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 160 }}>
                        <Typography variant="body2" noWrap>
                          {entry.projectName || '—'}
                        </Typography>
                      </TableCell>
                      {userIsAdmin && (
                        <TableCell>
                          <Typography variant="body2">{entry.employeeName || entry.employeeCode || '—'}</Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {TYPE_META[entry.entryType] ?? entry.entryType}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                          {entry.hoursSpent.toFixed(2)}h
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color={entry.isBillable ? 'success.main' : 'textSecondary'}>
                          {entry.isBillable ? 'Yes' : 'No'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={statusMeta.label}
                          color={statusMeta.color}
                          size="small"
                          sx={{ fontWeight: 600, minWidth: 80 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {isDraft && (
                          <>
                            <Tooltip title="Submit for approval">
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleSubmit(entry.id)}
                                  disabled={submitMutation.isPending}
                                >
                                  <SendIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Delete entry">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(entry.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        )}
                        {entry.status === 'REJECTED' && (
                          <Tooltip title={entry.rejectionReason || 'Rejected'}>
                            <Chip label="Reason" size="small" variant="outlined" color="error" sx={{ cursor: 'pointer' }} />
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Total Hours Row */}
        {!isLoading && entries.length > 0 && (
          <Box
            sx={{
              px: 3,
              py: 1.5,
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
              Total hours (this page):
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.dark' }}>
              {totalHours.toFixed(2)}h
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
