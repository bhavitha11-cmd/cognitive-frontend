import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Grid,
  FormControl,
  Select,
  TextField,
  FormHelperText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

import { SearchFilters } from '../../../components/SearchFilters';
import {
  useGetProjects,
  useUpdateProject,
  useDeleteProject,
} from '../services/projectService';
import { useGetClients } from '../../clients/services/clientService';
import { useGetEmployees, useGetDepartments } from '../../hr/services/hrService';
import { parseError } from '../../../utils/api';
import type { ParentProject } from '../types';
import { useAuthStore } from '../../../store/useAuthStore';

// ==========================================
// CHIP HELPERS
// ==========================================

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  'Yet To Start': { bg: '#e2e8f0', color: '#475569', label: 'Yet To Start' },
  'In Progress':  { bg: '#dcfce7', color: '#166534', label: 'In Progress' },
  'On Hold':      { bg: '#fef3c7', color: '#92400e', label: 'On Hold' },
  'Completed':    { bg: '#dbeafe', color: '#1e40af', label: 'Completed' },
  'Cancelled':    { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_COLORS[status] || { bg: '#e2e8f0', color: '#475569', label: status };
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

interface RowActionsProps {
  project: ParentProject;
  onView: (id: string) => void;
  onEdit: (project: ParentProject) => void;
  onDelete: (project: ParentProject) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const RowActions: React.FC<RowActionsProps> = ({
  project,
  onView,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

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
        {canEdit && (
          <MenuItem
            onClick={() => {
              handleClose();
              onEdit(project);
            }}
            dense
          >
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem
            onClick={() => {
              handleClose();
              onDelete(project);
            }}
            dense
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

// ==========================================
// EDIT PROJECT DIALOG
// ==========================================

const editSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  projectManagerId: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
});

type EditProjectFormInputs = z.infer<typeof editSchema>;

interface EditProjectDialogProps {
  project: ParentProject | null;
  open: boolean;
  onClose: () => void;
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({ project, open, onClose }) => {
  const updateProject = useUpdateProject();
  const { data: clientsData } = useGetClients({ limit: 200 });
  const { data: employeesData } = useGetEmployees({ limit: 200 });
  const { data: departmentsData } = useGetDepartments({ limit: 100 });

  const clients = clientsData?.clients || [];
  const managers = employeesData?.employees || [];
  const departments = departmentsData || [];

  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin());

  const filteredManagers = useMemo(() => {
    if (isSuperAdmin) return managers;
    const currentEmpId = currentUser?.employeeId;
    return managers.filter(
      (m) => m.id === currentEmpId || m.reportingManagerId === currentEmpId
    );
  }, [managers, isSuperAdmin, currentUser]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditProjectFormInputs>({
    resolver: zodResolver(editSchema),
  });

  React.useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
        clientId: project.clientId,
        projectManagerId: project.projectManagerId || '',
        departmentId: project.departmentId,
      });
    }
  }, [project, reset]);

  const onSubmit = async (data: EditProjectFormInputs) => {
    if (!project) return;
    try {
      await updateProject.mutateAsync({
        id: project.id,
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          clientId: data.clientId,
          projectManagerId: data.projectManagerId || undefined,
          departmentId: data.departmentId,
        },
      });
      onClose();
    } catch (_err) {
      // Handled by updateProject.error
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Project Metadata</DialogTitle>
      <DialogContent dividers sx={{ py: 3 }}>
        {updateProject.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {parseError(updateProject.error)}
          </Alert>
        )}
        <form id="edit-project-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            {/* Project Name */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Project Name *"
                    fullWidth
                    size="small"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Grid>

            {/* Client */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" error={!!errors.clientId}>
                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                  Client *
                </Typography>
                <Controller
                  name="clientId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} displayEmpty>
                      <MenuItem value="" disabled>-- Select Client --</MenuItem>
                      {clients.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.clientId && <FormHelperText>{errors.clientId.message}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Department */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" error={!!errors.departmentId}>
                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                  Department *
                </Typography>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} displayEmpty>
                      <MenuItem value="" disabled>-- Select Department --</MenuItem>
                      {departments.map((d) => (
                        <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.departmentId && <FormHelperText>{errors.departmentId.message}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Project Manager */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                  Project Manager
                </Typography>
                <Controller
                  name="projectManagerId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} displayEmpty>
                      <MenuItem value="">-- Unassigned --</MenuItem>
                      {filteredManagers.map((m) => (
                        <MenuItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            {/* Description */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    placeholder="Describe the project scope..."
                    multiline
                    rows={3}
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button
          type="submit"
          form="edit-project-form"
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={isSubmitting || updateProject.isPending}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==========================================
// DELETE CONFIRM DIALOG
// ==========================================

interface DeleteDialogProps {
  open: boolean;
  project: ParentProject | null;
  onClose: () => void;
}

const DeleteProjectDialog: React.FC<DeleteDialogProps> = ({ open, project, onClose }) => {
  const deleteProject = useDeleteProject();

  const handleConfirmDelete = async () => {
    if (!project) return;
    try {
      await deleteProject.mutateAsync(project.id);
      onClose();
    } catch (_err) {
      // Handled by deleteProject.error
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete Project</DialogTitle>
      <DialogContent dividers>
        {deleteProject.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {parseError(deleteProject.error)}
          </Alert>
        )}
        <Typography variant="body2">
          Are you sure you want to delete the project <strong>{project?.name}</strong>?
          This will also soft-delete all Parts associated with it.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={deleteProject.isPending}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirmDelete}
          disabled={deleteProject.isPending}
          startIcon={<DeleteIcon />}
        >
          {deleteProject.isPending ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================

const formatDate = (date?: string) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  const [editingProject, setEditingProject] = useState<ParentProject | null>(null);
  const [deletingProject, setDeletingProject] = useState<ParentProject | null>(null);

  const { data: projectsData, isLoading: projectsLoading } = useGetProjects({
    skip: page * rowsPerPage,
    limit: rowsPerPage,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    clientId: clientFilter !== 'all' ? clientFilter : undefined,
  });

  const { data: clientsData } = useGetClients({ limit: 200 });

  const projects = projectsData?.projects || [];
  const totalCount = projectsData?.total ?? 0;
  const clients = clientsData?.clients || [];

  const handleRowClick = (id: string) => {
    navigate(`/projects/${id}`);
  };

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Engineering packages and client deliverables
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2 }}>
        <SearchFilters
          searchQuery={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
          searchPlaceholder="Search projects by name..."
          filters={[
            {
              value: statusFilter,
              placeholder: 'All Statuses',
              options: [
                { value: 'Yet To Start', label: 'Yet To Start' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'On Hold', label: 'On Hold' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' },
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
          <Table sx={{ minWidth: 1200 }} size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Project Name</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Manager</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="center">Parts</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">Est. Hours</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">Act. Hours</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="center">Progress</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Planned Start</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Planned End</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Actual Start</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Actual End</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  hover
                  onClick={() => handleRowClick(project.id)}
                  sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                >
                  {/* Name */}
                  <TableCell sx={{ fontWeight: 600 }}>{project.name}</TableCell>

                  {/* Client */}
                  <TableCell>{project.clientName || '—'}</TableCell>

                  {/* Manager */}
                  <TableCell>{project.projectManagerName || '—'}</TableCell>

                  {/* Total Parts */}
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{project.partCount}</TableCell>

                  {/* Est. Hours */}
                  <TableCell align="right">{project.estimatedHours.toLocaleString()}h</TableCell>

                  {/* Act. Hours */}
                  <TableCell align="right">{project.actualHours.toLocaleString()}h</TableCell>

                  {/* Progress */}
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={project.progress}
                        sx={{ width: 50, height: 6, borderRadius: 3 }}
                        color={project.progress >= 100 ? 'success' : 'primary'}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                        {Math.round(project.progress)}%
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StatusChip status={project.status} />
                  </TableCell>

                  {/* Start Date */}
                  <TableCell>{formatDate(project.plannedStartDate)}</TableCell>

                  {/* End Date */}
                  <TableCell>{formatDate(project.plannedEndDate)}</TableCell>

                  {/* Actual Start Date */}
                  <TableCell>{formatDate(project.actualStartDate)}</TableCell>

                  {/* Actual End Date */}
                  <TableCell>{formatDate(project.actualEndDate)}</TableCell>

                  {/* Actions */}
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      project={project}
                      onView={handleRowClick}
                      onEdit={setEditingProject}
                      onDelete={setDeletingProject}
                      canEdit={useAuthStore.getState().hasPermission('Projects', 'edit')}
                      canDelete={useAuthStore.getState().hasPermission('Projects', 'delete') || useAuthStore.getState().hasPermission('Projects', 'activate')}
                    />
                  </TableCell>
                </TableRow>
              ))}

              {projects.length === 0 && !projectsLoading && (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No projects found.</Typography>
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
          onPageChange={(_e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Dialogs */}
      <EditProjectDialog
        project={editingProject}
        open={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
      />
      <DeleteProjectDialog
        project={deletingProject}
        open={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
      />
    </Box>
  );
};

export default ProjectListPage;
