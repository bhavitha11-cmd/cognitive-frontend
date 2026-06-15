import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

import { SearchFilters } from '../../../components/SearchFilters';
import {
  useGetProjects,
  useUpdateProjectStatus,
  useDeleteProject,
} from '../services/projectService';
import { useGetClients } from '../../clients/services/clientService';
import type { Project } from '../types';

// ==========================================
// CHIP HELPERS
// ==========================================

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:     { bg: '#e2e8f0', color: '#475569', label: 'Draft' },
  ACTIVE:    { bg: '#dcfce7', color: '#166534', label: 'Active' },
  ON_HOLD:   { bg: '#fef3c7', color: '#92400e', label: 'On Hold' },
  COMPLETED: { bg: '#dbeafe', color: '#1e40af', label: 'Completed' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const PRIORITY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  LOW:      { bg: '#dbeafe', color: '#1e40af', label: 'Low' },
  MEDIUM:   { bg: '#ffedd5', color: '#9a3412', label: 'Medium' },
  HIGH:     { bg: '#fee2e2', color: '#b91c1c', label: 'High' },
  CRITICAL: { bg: '#fecdd3', color: '#7f1d1d', label: 'Critical' },
};

const StatusChip: React.FC<{
  status: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  interactive?: boolean;
}> = ({ status, onClick, interactive }) => {
  const cfg = STATUS_COLORS[status] || { bg: '#e2e8f0', color: '#475569', label: status };
  return (
    <Chip
      label={cfg.label}
      size="small"
      onClick={interactive ? onClick : undefined}
      sx={{
        bgcolor: cfg.bg,
        color: cfg.color,
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 22,
        cursor: interactive ? 'pointer' : 'default',
        '&:hover': interactive ? { opacity: 0.85 } : {},
      }}
    />
  );
};

const PriorityChip: React.FC<{ priority: string }> = ({ priority }) => {
  const cfg = PRIORITY_COLORS[priority] || { bg: '#e2e8f0', color: '#475569', label: priority };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{
        bgcolor: cfg.bg,
        color: cfg.color,
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 22,
      }}
    />
  );
};

// ==========================================
// ROW ACTIONS MENU
// ==========================================

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT:     ['ACTIVE', 'CANCELLED'],
  ACTIVE:    ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
  ON_HOLD:   ['ACTIVE', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

interface RowActionsProps {
  project: Project;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const RowActions: React.FC<RowActionsProps> = ({ project, onStatusChange, onDelete, onView }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const transitions = STATUS_TRANSITIONS[project.status] || [];

  return (
    <>
      <Tooltip title="Actions">
        <IconButton size="small" onClick={handleOpen}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        <MenuItem
          onClick={() => {
            handleClose();
            onView(project.id);
          }}
          dense
        >
          <OpenInNewIcon fontSize="small" sx={{ mr: 1 }} />
          View Detail
        </MenuItem>
        {transitions.map((s) => (
          <MenuItem
            key={s}
            dense
            onClick={() => {
              handleClose();
              onStatusChange(project.id, s);
            }}
          >
            <StatusChip status={s} />
            <Typography variant="caption" sx={{ ml: 1 }}>
              Move to {STATUS_COLORS[s]?.label || s}
            </Typography>
          </MenuItem>
        ))}
        {transitions.length > 0 && <Box component="hr" sx={{ my: 0.5, border: 0, borderTop: '1px solid #e2e8f0' }} />}
        <MenuItem
          dense
          onClick={() => {
            handleClose();
            onDelete(project.id);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

// ==========================================
// STATUS CHANGE POPOVER (inline chip click)
// ==========================================

interface StatusPopoverProps {
  project: Project;
  onStatusChange: (id: string, status: string) => void;
}

const StatusChangeChip: React.FC<StatusPopoverProps> = ({ project, onStatusChange }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const transitions = STATUS_TRANSITIONS[project.status] || [];

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (transitions.length > 0) {
      setAnchorEl(e.currentTarget as HTMLElement);
    }
  };

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <StatusChip
        status={project.status}
        onClick={handleClick}
        interactive={transitions.length > 0}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        slotProps={{ paper: { sx: { minWidth: 140 } } }}
      >
        <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', color: 'text.secondary', fontWeight: 600 }}>
          Change status
        </Typography>
        {transitions.map((s) => (
          <MenuItem
            key={s}
            dense
            onClick={() => {
              handleClose();
              onStatusChange(project.id, s);
            }}
          >
            <StatusChip status={s} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================

export const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  const { data: projectsData, isLoading: projectsLoading } = useGetProjects({
    skip: page * rowsPerPage,
    limit: rowsPerPage,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    clientId: clientFilter !== 'all' ? clientFilter : undefined,
  });

  const { data: clientsData } = useGetClients({ limit: 200 });

  const updateStatus = useUpdateProjectStatus();
  const deleteProject = useDeleteProject();

  const projects = projectsData?.projects || [];
  const totalCount = projectsData?.total ?? 0;
  const clients = clientsData?.clients || [];

  const handleStatusChange = useCallback(
    (id: string, status: string) => {
      updateStatus.mutate({ id, status });
    },
    [updateStatus]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm('Are you sure you want to delete this project?')) {
        deleteProject.mutate(id);
      }
    },
    [deleteProject]
  );

  const handleRowClick = (id: string) => {
    navigate(`/projects/${id}`);
  };

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const progressPercent = (project: Project): number => {
    if (!project.taskCount) return 0;
    return Math.round((project.completedTaskCount / project.taskCount) * 100);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Engineering packages and client deliverables
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/projects/create')}
        >
          Create Project
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2 }}>
        <SearchFilters
          searchQuery={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
          searchPlaceholder="Search by project name or code..."
          filters={[
            {
              value: statusFilter,
              placeholder: 'All Statuses',
              options: [
                { value: 'DRAFT', label: 'Draft' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'ON_HOLD', label: 'On Hold' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ],
              onChange: (val) => {
                setStatusFilter(val);
                setPage(0);
              },
            },
            {
              value: clientFilter,
              placeholder: 'All Clients',
              options: clientOptions,
              onChange: (val) => {
                setClientFilter(val);
                setPage(0);
              },
            },
          ]}
        />
      </Card>

      {/* Table */}
      <Card>
        {projectsLoading && <LinearProgress />}
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 1100 }} size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Project Code</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Package Name</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Manager</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">Est. Hrs</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">Act. Hrs</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Tasks</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Delivery</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => {
                const pct = progressPercent(project);
                return (
                  <TableRow
                    key={project.id}
                    hover
                    onClick={() => handleRowClick(project.id)}
                    sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                  >
                    {/* Project Code */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: 'primary.main', fontFamily: 'monospace', fontSize: '0.8rem' }}
                      >
                        {project.projectCode}
                      </Typography>
                    </TableCell>

                    {/* Package Name */}
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Tooltip title={project.name}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {project.name}
                        </Typography>
                      </Tooltip>
                      {project.description && (
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          {project.description}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Client */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {project.clientName || '—'}
                      </Typography>
                    </TableCell>

                    {/* Manager */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {project.projectManagerName || '—'}
                      </Typography>
                    </TableCell>

                    {/* Status — clickable to change */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <StatusChangeChip project={project} onStatusChange={handleStatusChange} />
                    </TableCell>

                    {/* Priority */}
                    <TableCell>
                      <PriorityChip priority={project.priority} />
                    </TableCell>

                    {/* Est. Hours */}
                    <TableCell align="right">
                      <Typography variant="body2">{project.estimatedHours.toLocaleString()}</Typography>
                    </TableCell>

                    {/* Act. Hours */}
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            project.actualHours > project.estimatedHours && project.estimatedHours > 0
                              ? 'error.main'
                              : 'text.primary',
                          fontWeight: project.actualHours > project.estimatedHours ? 700 : 400,
                        }}
                      >
                        {project.actualHours.toLocaleString()}
                      </Typography>
                    </TableCell>

                    {/* Tasks with progress bar */}
                    <TableCell sx={{ minWidth: 120 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {project.completedTaskCount}/{project.taskCount}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 5,
                            borderRadius: 3,
                            mt: 0.5,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              bgcolor:
                                pct === 100
                                  ? 'success.main'
                                  : pct >= 50
                                  ? 'primary.main'
                                  : 'warning.main',
                            },
                          }}
                        />
                      </Box>
                    </TableCell>

                    {/* Delivery date */}
                    <TableCell>
                      {project.plannedEndDate ? (
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              new Date(project.plannedEndDate) < new Date() &&
                              project.status !== 'COMPLETED' &&
                              project.status !== 'CANCELLED'
                                ? 'error.main'
                                : 'text.primary',
                            fontWeight:
                              new Date(project.plannedEndDate) < new Date() &&
                              project.status !== 'COMPLETED' &&
                              project.status !== 'CANCELLED'
                                ? 700
                                : 400,
                          }}
                        >
                          {new Date(project.plannedEndDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        project={project}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        onView={handleRowClick}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}

              {!projectsLoading && projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No projects found. Create your first project to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>
    </Box>
  );
};

export default ProjectListPage;
