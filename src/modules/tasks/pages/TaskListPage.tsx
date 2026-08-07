import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Card,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Select,
  TextField,
  InputAdornment,
  FormControl,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';

import { DataTable } from '../../../components/DataTable';
import type { Column } from '../../../components/DataTable';
import {
  useGetTasks,
  useToggleTaskActive,
} from '../services/taskService';
import type { Task } from '../types';
import { useAuthStore } from '../../../store/useAuthStore';

// ==========================================
// STATUS / PRIORITY HELPERS
// ==========================================

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Yet To Start',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const DEPT_LABELS: Record<string, string> = {
  CAD: 'CAD',
  CAM: 'CAM',
  GEN: 'GEN',
  SALES: 'SALES',
  ADMIN: 'ADMIN',
  MKRT: 'MKRT',
  SUPRT: 'SUPRT',
};

const getStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
      return 'primary';
    case 'ON_HOLD':
      return 'warning';
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
};

const getPriorityColor = (
  priority: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (priority) {
    case 'CRITICAL':
      return 'error';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'primary';
    default:
      return 'default';
  }
};

const formatDate = (date?: string) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ==========================================
// TASK DETAIL MODAL
// ==========================================

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, open, onClose }) => {
  if (!task) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon color="primary" />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            {task.taskCode}
          </Typography>
          <Chip
            label={STATUS_LABELS[task.status] || task.status}
            size="small"
            color={getStatusColor(task.status)}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {task.title}
            </Typography>
            {task.description && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                {task.description}
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="textSecondary">
              Project
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {task.projectName || task.projectId}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="textSecondary">
              Scope
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {task.scopeName || '—'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="textSecondary">
              Department
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {task.departmentCategory || '—'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="textSecondary">
              Priority
            </Typography>
            <Box sx={{ mt: 0.25 }}>
              <Chip
                label={PRIORITY_LABELS[task.priority] || task.priority}
                size="small"
                color={getPriorityColor(task.priority)}
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="textSecondary">
              Est. Hours
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {task.estimatedHours}h
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="textSecondary">
              Actual Hours
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {task.actualHours}h
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="textSecondary">
              Received Date
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(task.receivedDate)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="textSecondary">
              Planned Delivery
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(task.plannedDeliveryDate)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="textSecondary">
              Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <LinearProgress
                variant="determinate"
                value={task.progress * 100}
                sx={{ flex: 1, height: 8, borderRadius: 4 }}
                color={task.progress >= 1 ? 'success' : 'primary'}
              />
              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 40 }}>
                {Math.round(task.progress * 100)}%
              </Typography>
            </Box>
          </Grid>

          {task.assignments.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="textSecondary">
                Assignees
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {task.assignments.map((a) => (
                  <Chip
                    key={a.id}
                    label={a.employeeName || a.employeeCode || a.employeeId}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </Grid>
          )}

          {task.remarks && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="textSecondary">
                Remarks
              </Typography>
              <Typography variant="body2">{task.remarks}</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ==========================================
// TOGGLE ACTIVE CONFIRM DIALOG
// ==========================================

interface ToggleActiveConfirmProps {
  open: boolean;
  task: Task | null;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  loading: boolean;
}

const ToggleActiveConfirmDialog: React.FC<ToggleActiveConfirmProps> = ({
  open,
  task,
  onConfirm,
  onCancel,
  loading,
}) => {
  const [reason, setReason] = React.useState('');
  const [reasonError, setReasonError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setReason('');
      setReasonError('');
    }
  }, [open]);

  if (!task) return null;
  const isDeactivating = task.isActive;

  const handleConfirm = () => {
    if (isDeactivating && !reason.trim()) {
      setReasonError('Deactivation reason is required.');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isDeactivating ? 'Deactivate Task' : 'Activate Task'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: isDeactivating ? 2 : 0 }}>
          {isDeactivating ? (
            <>
              Please provide a reason for deactivating task <strong>{task.taskCode}</strong>.
            </>
          ) : (
            <>
              Are you sure you want to activate task <strong>{task.taskCode}</strong>?
            </>
          )}
        </Typography>
        {isDeactivating && (
          <TextField
            autoFocus
            margin="dense"
            label="Deactivation Reason *"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setReasonError('');
            }}
            error={!!reasonError}
            helperText={reasonError}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color={isDeactivating ? 'warning' : 'success'}
          variant="contained"
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={16} />
          ) : isDeactivating ? (
            'Deactivate'
          ) : (
            'Activate'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================

export const TaskListPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'all'>('active');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toggleTask, setToggleTask] = useState<Task | null>(null);

  // Error state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading, isError } = useGetTasks({
    skip: 0,
    limit: 500,
  });

  const toggleMutation = useToggleTaskActive();

  const allTasks = data?.tasks ?? [];

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      // General search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          t.taskCode.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          (t.projectName && t.projectName.toLowerCase().includes(q)) ||
          (t.assignedToName && t.assignedToName.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      // Department filter
      if (deptFilter !== 'all' && t.deptCat !== deptFilter) return false;
      // Project filter
      if (projectFilter && t.projectId !== projectFilter) return false;
      return true;
    });
  }, [allTasks, searchQuery, statusFilter, deptFilter, projectFilter]);

  const handleToggleConfirm = async (reason?: string) => {
    if (!toggleTask) return;
    try {
      await toggleMutation.mutateAsync({
        id: toggleTask.id,
        isActive: !toggleTask.isActive,
        reason,
      });
      setToggleTask(null);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail ||
          err?.message ||
          `Failed to ${toggleTask.isActive ? 'deactivate' : 'activate'} task`
      );
      setToggleTask(null);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(0);
  };

  const columns: Column<Task>[] = [
    {
      id: 'taskCode',
      label: 'Part # / Code',
      getValue: (row) => row.taskCode,
      render: (row) => (
        <Box sx={{ minWidth: 140, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: row.isActive ? 'primary.main' : 'text.disabled',
              textDecoration: row.isActive ? 'none' : 'line-through',
            }}
          >
            {row.taskCode}
          </Typography>
          {!row.isActive && (
            <Chip label="Inactive" size="small" color="default" sx={{ height: 18, fontSize: '0.65rem' }} />
          )}
        </Box>
      ),
    },
    {
      id: 'title',
      label: 'Title',
      getValue: (row) => row.title,
      render: (row) => (
        <Box sx={{ maxWidth: 200 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {row.title}
          </Typography>
          {row.description && (
            <Typography variant="caption" color="textSecondary" noWrap sx={{ display: 'block' }}>
              {row.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'projectName',
      label: 'Project',
      getValue: (row) => row.projectName || row.projectId || '—',
      render: (row) => (
        <Chip
          label={row.projectName || row.projectId}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: '0.72rem', maxWidth: 130 }}
        />
      ),
    },
    {
      id: 'scopeName',
      label: 'Scope',
      getValue: (row) => row.scopeName || '—',
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          {row.scopeName || '—'}
        </Typography>
      ),
    },
    {
      id: 'departmentCategory',
      label: 'Dept',
      align: 'center',
      getValue: (row) => row.departmentCategory || '—',
      render: (row) =>
        row.departmentCategory ? (
          <Chip
            label={row.departmentCategory}
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20 }}
          />
        ) : (
          <Typography variant="body2" color="textSecondary">
            —
          </Typography>
        ),
    },
    {
      id: 'status',
      label: 'Status',
      getValue: (row) => STATUS_LABELS[row.status] || row.status,
      render: (row) => (
        <Chip
          label={STATUS_LABELS[row.status] || row.status}
          size="small"
          color={getStatusColor(row.status)}
          sx={{ fontWeight: 600, fontSize: '0.72rem', height: 22 }}
        />
      ),
    },
    {
      id: 'priority',
      label: 'Priority',
      getValue: (row) => PRIORITY_LABELS[row.priority] || row.priority,
      render: (row) => (
        <Chip
          label={PRIORITY_LABELS[row.priority] || row.priority}
          size="small"
          color={getPriorityColor(row.priority)}
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: '0.72rem', height: 22 }}
        />
      ),
    },
    {
      id: 'plannedStartDate',
      label: 'Planned Start',
      type: 'date',
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', minWidth: 90 }}>
          {formatDate(row.plannedStartDate)}
        </Typography>
      ),
    },
    {
      id: 'plannedEndDate',
      label: 'Planned End',
      type: 'date',
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', minWidth: 90 }}>
          {formatDate(row.plannedEndDate)}
        </Typography>
      ),
    },
    {
      id: 'actualStartDate',
      label: 'Actual Start',
      type: 'date',
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', minWidth: 90 }}>
          {formatDate(row.actualStartDate)}
        </Typography>
      ),
    },
    {
      id: 'actualEndDate',
      label: 'Actual End',
      type: 'date',
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', minWidth: 90 }}>
          {formatDate(row.actualEndDate)}
        </Typography>
      ),
    },
    {
      id: 'estimatedHours',
      label: 'Est. Hrs',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.estimatedHours}h
        </Typography>
      ),
    },
    {
      id: 'actualHours',
      label: 'Act. Hrs',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" color={row.actualHours > row.estimatedHours ? 'error.main' : 'text.primary'} sx={{ fontWeight: 600 }}>
          {row.actualHours}h
        </Typography>
      ),
    },
    {
      id: 'progress',
      label: 'Progress',
      render: (row) => (
        <Box sx={{ minWidth: 90 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {Math.round(row.progress * 100)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={row.progress * 100}
            sx={{ height: 6, borderRadius: 3 }}
            color={row.progress >= 1 ? 'success' : row.progress >= 0.5 ? 'primary' : 'warning'}
          />
        </Box>
      ),
    },
    {
      id: 'plannedDeliveryDate',
      label: 'Delivery Date',
      type: 'date',
      render: (row) => {
        const isCompleted = row.status === 'COMPLETED' || row.status === 'CANCELLED';
        const actualDate = row.actualDeliveryDate;
        const plannedDate = row.plannedDeliveryDate;

        if (isCompleted && actualDate) {
          // Show actual delivery date with a green badge
          return (
            <Box>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'success.dark', fontWeight: 600 }}>
                {formatDate(actualDate)}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'success.main', fontWeight: 500 }}>
                ✓ Actual
              </Typography>
            </Box>
          );
        }

        // Not completed — show planned delivery date with overdue highlight
        const isOverdue =
          plannedDate &&
          !isCompleted &&
          new Date(plannedDate) < new Date();
        return (
          <Box>
            <Typography
              variant="body2"
              sx={{ fontSize: '0.8rem', color: isOverdue ? 'error.main' : 'text.primary', fontWeight: isOverdue ? 700 : 400 }}
            >
              {formatDate(plannedDate)}
            </Typography>
            {isOverdue && (
              <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'error.main' }}>
                ⚠ Overdue
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      id: 'assignments',
      label: 'Assignees',
      render: (row) => {
        if (!row.assignments || row.assignments.length === 0) {
          return (
            <Typography variant="caption" color="textSecondary">
              Unassigned
            </Typography>
          );
        }
        return (
          <AvatarGroup max={3} sx={{ justifyContent: 'flex-start' }}>
            {row.assignments.map((a) => {
              const name = a.employeeName || a.employeeCode || '?';
              return (
                <Tooltip key={a.id} title={name}>
                  <Avatar
                    sx={{
                      width: 26,
                      height: 26,
                      fontSize: '0.7rem',
                      bgcolor: 'primary.main',
                    }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              );
            })}
          </AvatarGroup>
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTask(row);
                setDetailOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {useAuthStore.getState().hasPermission('Tasks', 'edit') && (
            <Tooltip title="Edit Task">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/tasks/${row.id}/edit`);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {useAuthStore.getState().hasPermission('Tasks', 'activate') && (
            <Tooltip title={row.isActive ? 'Deactivate Task' : 'Activate Task'}>
              <IconButton
                size="small"
                color={row.isActive ? 'warning' : 'success'}
                onClick={(e) => {
                  e.stopPropagation();
                  setToggleTask(row);
                }}
              >
                {row.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Engineering Tasks
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage part-level scope of work assignments
          </Typography>
        </Box>
        {useAuthStore.getState().hasPermission('Tasks', 'create') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/tasks/create')}
          >
            Create Task
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {(isError || errorMsg) && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>
          {errorMsg || 'Failed to load tasks. Please try again.'}
        </Alert>
      )}

      {/* Filter Toolbar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          {/* Search */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              placeholder="Search by part # or title..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          {/* Status Filter */}
          <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
            <FormControl fullWidth size="small">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                displayEmpty
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <MenuItem key={val} value={val}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Department Filter */}
          <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
            <FormControl fullWidth size="small">
              <Select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setPage(0);
                }}
                displayEmpty
              >
                <MenuItem value="all">All Departments</MenuItem>
                {Object.entries(DEPT_LABELS).map(([val, label]) => (
                  <MenuItem key={val} value={val}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Project Filter */}
          <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
            <TextField
              placeholder="Filter by project ID..."
              variant="outlined"
              size="small"
              fullWidth
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setPage(0);
              }}
            />
          </Grid>

          {/* Active Status Filter */}
          <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
            <FormControl fullWidth size="small">
              <Select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value as any);
                  setPage(0);
                }}
              >
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
                <MenuItem value="all">All Tasks</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Tasks Table */}
      <Card>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              '& .MuiTableRow-root': { cursor: 'pointer' },
            }}
          >
            <DataTable<Task>
              columns={columns}
              data={filteredTasks}
              keyExtractor={(row) => row.id}
              onRowClick={(row) => {
                setSelectedTask(row);
                setDetailOpen(true);
              }}
            />
          </Box>
        )}
      </Card>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedTask(null);
        }}
      />

      {/* Toggle Active Confirmation */}
      <ToggleActiveConfirmDialog
        open={!!toggleTask}
        task={toggleTask}
        onConfirm={handleToggleConfirm}
        onCancel={() => setToggleTask(null)}
        loading={toggleMutation.isPending}
      />
    </Box>
  );
};

export default TaskListPage;
