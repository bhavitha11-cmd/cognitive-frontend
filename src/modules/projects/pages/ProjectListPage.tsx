import React, { useState, useCallback } from 'react';
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
  // Dialog imports
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Grid,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Select,
  Switch,
  TextField,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

import { SearchFilters } from '../../../components/SearchFilters';
import {
  useGetProjects,
  useUpdateProjectStatus,
  useDeleteProject,
  useUpdateProject,
  useGetHolidays,
} from '../services/projectService';
import { useGetClients } from '../../clients/services/clientService';
import { useGetEmployees, useGetDepartments } from '../../hr/services/hrService';
import { parseError } from '../../../utils/api';
import { calculateWorkingHours, calculateEndDate } from '../../../utils/projectScheduler';
import type { Project } from '../types';
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
  'Yet To Start': ['In Progress', 'On Hold', 'Completed', 'Cancelled'],
  'In Progress':  ['Yet To Start', 'On Hold', 'Completed', 'Cancelled'],
  'On Hold':      ['Yet To Start', 'In Progress', 'Completed', 'Cancelled'],
  'Completed':    ['Yet To Start', 'In Progress', 'On Hold', 'Cancelled'],
  'Cancelled':    ['Yet To Start', 'In Progress', 'On Hold', 'Completed'],
};

interface RowActionsProps {
  project: Project;
  onStatusChange: (project: Project, status: string) => void;
  onView: (id: string) => void;
  onEdit: (project: Project) => void;
  canEdit?: boolean;
}

const RowActions: React.FC<RowActionsProps> = ({ project, onStatusChange, onView, onEdit, canEdit = true }) => {
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
        {transitions.map((s) => (
          <MenuItem
            key={s}
            dense
            onClick={() => {
              handleClose();
              onStatusChange(project, s);
            }}
          >
            <StatusChip status={s} />
            <Typography variant="caption" sx={{ ml: 1 }}>
              Move to {STATUS_COLORS[s]?.label || s}
            </Typography>
          </MenuItem>
        ))}

      </Menu>
    </>
  );
};

// ==========================================
// STATUS CHANGE POPOVER (inline chip click)
// ==========================================

interface StatusPopoverProps {
  project: Project;
  onStatusChange: (project: Project, status: string) => void;
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
              onStatusChange(project, s);
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
// EDIT PROJECT DIALOG
// ==========================================

const editProjectSchema = z
  .object({
    partNumber: z.string().min(1, 'Part Number is required.'),
    name: z.string().min(3, 'Package Name must be at least 3 characters'),
    partName: z.string().min(1, 'Part Name is required.'),
    description: z.string().optional(),
    clientId: z.string().min(1, 'Client is required'),
    projectManagerId: z.string().optional(),
    departmentId: z.string().min(1, 'Department is required.'),
    status: z.string().min(1),
    originalStatus: z.string().optional(),
    statusReason: z.string().optional(),
    priority: z.string().min(1),
    isBillable: z.boolean(),
    plannedStartDate: z.string().optional(),
    plannedEndDate: z.string().optional(),
    estimatedHours: z.coerce.number().min(0, 'Estimated hours must be 0 or more'),
    contractHours: z.coerce.number().min(0).optional(),
    invoiceStatus: z.string().min(1),
    tokForm: z.string().optional(),
    feedbackStatus: z.string().min(1),
  })
  .refine(
    (data) => {
      if (data.plannedStartDate && data.plannedEndDate) {
        return new Date(data.plannedEndDate) >= new Date(data.plannedStartDate);
      }
      return true;
    },
    { message: 'Planned end date cannot be before the start date', path: ['plannedEndDate'] }
  )
  .refine(
    (data) => {
      if (data.status === 'Cancelled' || (data.originalStatus === 'Cancelled' && data.status !== 'Cancelled')) {
        return !!data.statusReason && data.statusReason.trim().length > 0;
      }
      return true;
    },
    { message: 'Reason is required for this status change.', path: ['statusReason'] }
  );

type EditProjectFormInputs = z.infer<typeof editProjectSchema>;

interface EditProjectDialogProps {
  project: Project | null;
  open: boolean;
  onClose: () => void;
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({ project, open, onClose }) => {
  const updateProject = useUpdateProject();
  const { data: clientsData } = useGetClients({ limit: 200 });
  const { data: employees } = useGetEmployees({ limit: 200, accountStatus: 'ACTIVE' });
  const { data: departments = [] } = useGetDepartments();
  const { data: holidays = [] } = useGetHolidays();

  const clients = clientsData?.clients || [];
  const managers = employees || [];

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditProjectFormInputs>({
    resolver: zodResolver(editProjectSchema) as any,
  });

  React.useEffect(() => {
    if (project) {
      reset({
        partNumber: project.partNumber || '',
        name: project.name || '',
        partName: project.partName || '',
        description: project.description || '',
        clientId: project.clientId || '',
        projectManagerId: project.projectManagerId || '',
        departmentId: project.departmentId || '',
        status: project.status || 'Yet To Start',
        originalStatus: project.status || 'Yet To Start',
        statusReason: project.statusReason || '',
        priority: project.priority || 'MEDIUM',
        isBillable: project.isBillable ?? true,
        plannedStartDate: project.plannedStartDate ? project.plannedStartDate.split('T')[0] : '',
        plannedEndDate: project.plannedEndDate ? project.plannedEndDate.split('T')[0] : '',
        estimatedHours: project.estimatedHours ?? 0,
        contractHours: project.contractHours ?? undefined,
        invoiceStatus: project.invoiceStatus || 'PENDING',
        tokForm: project.tokForm || '',
        feedbackStatus: project.feedbackStatus || 'PENDING',
      });
    }
  }, [project, reset]);

  const plannedStartDate = watch('plannedStartDate');
  const plannedEndDate = watch('plannedEndDate');
  const estimatedHours = watch('estimatedHours');
  const status = watch('status');
  const originalStatus = watch('originalStatus');
  const showReasonField = status === 'Cancelled' || (originalStatus === 'Cancelled' && status !== 'Cancelled');

  // Auto-calculate Planned End Date when Start Date or Estimated Hours change
  React.useEffect(() => {
    if (plannedStartDate && estimatedHours > 0) {
      const computedEndDate = calculateEndDate(plannedStartDate, estimatedHours, holidays);
      setValue('plannedEndDate', computedEndDate, { shouldValidate: true });
    }
  }, [plannedStartDate, estimatedHours, holidays, setValue]);

  // Calculate available capacity dynamically in real time
  const availableCapacity = React.useMemo(() => {
    if (plannedStartDate && plannedEndDate) {
      return calculateWorkingHours(plannedStartDate, plannedEndDate, holidays);
    }
    return 0;
  }, [plannedStartDate, plannedEndDate, holidays]);

  const isCapacityExceeded = estimatedHours > availableCapacity;

  // Real-time capacity error handling
  React.useEffect(() => {
    if (plannedStartDate && plannedEndDate && estimatedHours > 0) {
      if (isCapacityExceeded) {
        setError('estimatedHours', {
          type: 'manual',
          message: 'Estimated hours exceed available working hours between selected dates.',
        });
      } else {
        clearErrors('estimatedHours');
      }
    } else {
      clearErrors('estimatedHours');
    }
  }, [isCapacityExceeded, plannedStartDate, plannedEndDate, estimatedHours, setError, clearErrors]);

  const onSubmit = async (data: EditProjectFormInputs) => {
    if (!project) return;

    if (data.plannedStartDate && data.plannedEndDate) {
      const capacity = calculateWorkingHours(data.plannedStartDate, data.plannedEndDate, holidays);
      if (data.estimatedHours > capacity) {
        setError('estimatedHours', {
          type: 'manual',
          message: 'Estimated hours exceed available working hours between selected dates.',
        });
        return;
      }
    }

    try {
      await updateProject.mutateAsync({
        id: project.id,
        data: {
          partNumber: data.partNumber.trim().toUpperCase(),
          name: data.name.trim(),
          partName: data.partName.trim(),
          description: data.description?.trim() || undefined,
          clientId: data.clientId,
          projectManagerId: data.projectManagerId || undefined,
          departmentId: data.departmentId,
          status: data.status,
          statusReason: data.statusReason || undefined,
          priority: data.priority,
          isBillable: data.isBillable,
          plannedStartDate: data.plannedStartDate || undefined,
          plannedEndDate: data.plannedEndDate || undefined,
          estimatedHours: data.estimatedHours,
          contractHours: data.contractHours || undefined,
          invoiceStatus: data.invoiceStatus,
          tokForm: data.tokForm?.trim() || undefined,
          feedbackStatus: data.feedbackStatus,
        },
      });
      onClose();
    } catch (_err) {
      // error displayed via updateProject.error
    }
  };

  const isDeptDisabled = !!project && (project.taskCount ?? 0) > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Edit Project</DialogTitle>
      <DialogContent dividers sx={{ py: 3 }}>
        {updateProject.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {parseError(updateProject.error)}
          </Alert>
        )}
        <form id="edit-project-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Section 1: Project Identity */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
            Project Identity
          </Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Part Number */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="partNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Part Number *"
                    placeholder="e.g. 2025-001"
                    fullWidth
                    size="small"
                    error={!!errors.partNumber}
                    helperText={errors.partNumber?.message || 'Auto-uppercased on save'}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Grid>

            {/* Package Name */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Package Name *"
                    placeholder="e.g. 97 PARTS PACKAGE"
                    fullWidth
                    size="small"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Grid>

            {/* Part Name */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="partName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Part Name *"
                    placeholder="e.g. BRACKET"
                    fullWidth
                    size="small"
                    error={!!errors.partName}
                    helperText={errors.partName?.message}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Grid>

            {/* Department */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small" error={!!errors.departmentId} disabled={isDeptDisabled}>
                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                  Department *
                </Typography>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} displayEmpty>
                      <MenuItem value="" disabled>
                        -- Select Department --
                      </MenuItem>
                      {departments.map((d: any) => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.name} {d.code ? `(${d.code})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <FormHelperText>
                  {errors.departmentId?.message || (isDeptDisabled ? "Locked: Project has active tasks" : "")}
                </FormHelperText>
              </FormControl>
            </Grid>

            {/* Client */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small" error={!!errors.clientId}>
                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                  Client *
                </Typography>
                <Controller
                  name="clientId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} displayEmpty>
                      <MenuItem value="" disabled>
                        -- Select Client --
                      </MenuItem>
                      {clients.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                          {c.clientCode ? ` (${c.clientCode})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.clientId && <FormHelperText>{errors.clientId.message}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Project Manager */}
            <Grid size={{ xs: 12, sm: 4 }}>
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
                      {managers.map((e) => (
                        <MenuItem key={e.id} value={e.id}>
                          {e.firstName} {e.lastName}
                          {e.designationName ? ` — ${e.designationName}` : ''}
                        </MenuItem>
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
                    placeholder="Describe the project scope and deliverables..."
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Section 2: Classification & Schedule */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
            Classification & Schedule
          </Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Status */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                  Status
                </Typography>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <MenuItem value="Yet To Start">Yet To Start</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="On Hold">On Hold</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            {/* Priority */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                  Priority
                </Typography>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="CRITICAL">Critical</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            {/* Planned Start Date */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="plannedStartDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Planned Start Date"
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={!!errors.plannedStartDate}
                    helperText={errors.plannedStartDate?.message}
                  />
                )}
              />
            </Grid>

            {/* Planned End Date */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="plannedEndDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Planned End Date"
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={!!errors.plannedEndDate}
                    helperText={errors.plannedEndDate?.message}
                  />
                )}
              />
            </Grid>

            {/* Live Capacity Info Text */}
            {plannedStartDate && plannedEndDate && (
              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: isCapacityExceeded ? 'error.main' : 'success.main',
                  }}
                >
                  Available Capacity: {availableCapacity} Hours | Estimated Effort: {estimatedHours} Hours
                </Typography>
              </Grid>
            )}

            {/* Status Change Reason Prompt */}
            {showReasonField && (
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="statusReason"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Reason for Status Change *"
                      placeholder="Provide a reason for cancelling or activating this project..."
                      fullWidth
                      size="small"
                      error={!!errors.statusReason}
                      helperText={errors.statusReason?.message || 'Required when cancelling or reviving a project'}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Section 3: Hours & Finance */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
            Hours & Finance
          </Typography>
          <Grid container spacing={3}>
            {/* Estimated Hours */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="estimatedHours"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Estimated Hours"
                    fullWidth
                    size="small"
                    error={!!errors.estimatedHours}
                    helperText={errors.estimatedHours?.message}
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: { endAdornment: <InputAdornment position="end">hrs</InputAdornment> },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Contract Hours */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="contractHours"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Contract Hours"
                    fullWidth
                    size="small"
                    error={!!errors.contractHours}
                    helperText={errors.contractHours?.message || 'Leave blank if same as estimated'}
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: { endAdornment: <InputAdornment position="end">hrs</InputAdornment> },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Is Billable */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="isBillable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Billable Project
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Hours are charged to client
                        </Typography>
                      </Box>
                    }
                  />
                )}
              />
            </Grid>

            {/* Invoice Status */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                  Invoice Status
                </Typography>
                <Controller
                  name="invoiceStatus"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="INVOICED">Invoiced</MenuItem>
                      <MenuItem value="PARTIALLY_INVOICED">Partially Invoiced</MenuItem>
                      <MenuItem value="NOT_APPLICABLE">Not Applicable</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            {/* TOK Form */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="tokForm"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="TOK Form Reference"
                    placeholder="e.g. TOK-2025-001"
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
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={isSubmitting || updateProject.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="edit-project-form"
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={isSubmitting || updateProject.isPending || isCapacityExceeded}
        >
          {updateProject.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
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
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [statusChangeRequest, setStatusChangeRequest] = useState<{ project: Project; status: string } | null>(null);
  const [statusReasonInput, setStatusReasonInput] = useState('');

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
    (project: Project, status: string) => {
      if (status === 'Cancelled' || project.status === 'Cancelled') {
        setStatusChangeRequest({ project, status });
        setStatusReasonInput('');
      } else {
        updateStatus.mutate({ id: project.id, status });
      }
    },
    [updateStatus]
  );

  const handleConfirmStatusChange = useCallback(() => {
    if (!statusChangeRequest) return;
    updateStatus.mutate({
      id: statusChangeRequest.project.id,
      status: statusChangeRequest.status,
      reason: statusReasonInput.trim(),
    });
    setStatusChangeRequest(null);
    setStatusReasonInput('');
  }, [statusChangeRequest, statusReasonInput, updateStatus]);


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
        {useAuthStore.getState().hasPermission('Projects', 'create') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/create')}
          >
            Create Project
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2 }}>
        <SearchFilters
          searchQuery={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
          searchPlaceholder="Search by package name or part number..."
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
          <Table sx={{ minWidth: 1100 }} size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Part Number</TableCell>
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
                    {/* Part Number */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: 'primary.main', fontFamily: 'monospace', fontSize: '0.8rem' }}
                      >
                        {project.partNumber}
                      </Typography>
                    </TableCell>

                    {/* Package Name & Part Name */}
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Tooltip title={project.name}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {project.name}
                        </Typography>
                      </Tooltip>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 550, color: 'text.secondary' }}>
                        Part: {project.partName}
                      </Typography>
                      {project.description && (
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontStyle: 'italic' }}>
                          {project.description}
                        </Typography>
                      )}
                      {project.statusReason && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            fontWeight: 600,
                            color: project.status === 'Cancelled' ? 'error.main' : 'success.main'
                          }}
                        >
                          Status Reason: {project.statusReason}
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
                              project.status !== 'Completed' &&
                              project.status !== 'Cancelled'
                                ? 'error.main'
                                : 'text.primary',
                            fontWeight:
                              new Date(project.plannedEndDate) < new Date() &&
                              project.status !== 'Completed' &&
                              project.status !== 'Cancelled'
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
                        onView={handleRowClick}
                        onEdit={setEditingProject}
                        canEdit={useAuthStore.getState().hasPermission('Projects', 'edit')}
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

      <EditProjectDialog
        project={editingProject}
        open={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
      />

      <Dialog
        open={Boolean(statusChangeRequest)}
        onClose={() => setStatusChangeRequest(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reason for Status Change</DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            You are changing the status of project <strong>{statusChangeRequest?.project.name}</strong> ({statusChangeRequest?.project.partNumber}) to <strong>{statusChangeRequest?.status}</strong>. Please provide a reason:
          </Typography>
          <TextField
            autoFocus
            label="Reason *"
            placeholder="e.g. Scope revised or client cancelled..."
            fullWidth
            size="small"
            value={statusReasonInput}
            onChange={(e) => setStatusReasonInput(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setStatusChangeRequest(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmStatusChange}
            variant="contained"
            color="primary"
            disabled={!statusReasonInput.trim()}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectListPage;
