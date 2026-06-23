import React, { useState, useCallback } from 'react';
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
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';

import { DataTable } from '../../../components/DataTable';
import type { Column } from '../../../components/DataTable';
import {
  useGetTasks,
  useDeleteTask,
  useUpdateTaskStatus,
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
// DELETE CONFIRM DIALOG
// ==========================================

interface DeleteConfirmProps {
  open: boolean;
  taskCode: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmProps> = ({
  open,
  taskCode,
  onConfirm,
  onCancel,
  loading,
}) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontWeight: 700 }}>Delete Task</DialogTitle>
    <DialogContent>
      <Typography variant="body2">
        Are you sure you want to delete task <strong>{taskCode}</strong>? This action cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} disabled={loading}>
        Cancel
      </Button>
      <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
        {loading ? <CircularProgress size={16} /> : 'Delete'}
      </Button>
    </DialogActions>
  </Dialog>
);

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

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  // Error state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading, isError } = useGetTasks({
    skip: page * rowsPerPage,
    limit: rowsPerPage,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    deptCat: deptFilter !== 'all' ? deptFilter : undefined,
    search: searchQuery || undefined,
    projectId: projectFilter || undefined,
  });

  const deleteMutation = useDeleteTask();

  const tasks = data?.tasks ?? [];
  const totalCount = data?.total ?? 0;

  const handleRowClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTask) return;
    try {
      await deleteMutation.mutateAsync(deleteTask.id);
      setDeleteTask(null);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || err?.message || 'Failed to delete task');
      setDeleteTask(null);
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
      render: (row) => (
        <Box sx={{ minWidth: 140 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem', color: 'primary.main' }}
          >
            {row.taskCode}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'title',
      label: 'Title',
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
          {useAuthStore.getState().hasPermission('Tasks', 'delete') && (
            <Tooltip title="Delete Task">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTask(row);
                }}
              >
                <DeleteIcon fontSize="small" />
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
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
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
              data={tasks}
              keyExtractor={(row) => row.id}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              onPageChange={(newPage) => setPage(newPage)}
              onRowsPerPageChange={(newSize) => {
                setRowsPerPage(newSize);
                setPage(0);
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

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTask}
        taskCode={deleteTask?.taskCode ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTask(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default TaskListPage;
