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
  FormControlLabel,
  Switch,
  DialogContentText,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import AddIcon from '@mui/icons-material/Add';

import { SearchFilters } from '../../../components/SearchFilters';
import { DataTable } from '../../../components/DataTable';
import type { Column } from '../../../components/DataTable';
import {
  useGetParts,
  useUpdatePart,
  useUpdatePartStatus,
  useDeletePart,
  useGetHolidays,
} from '../services/projectService';
import { useGetClients } from '../../clients/services/clientService';
import { useGetEmployees, useGetDepartments } from '../../hr/services/hrService';
import { parseError } from '../../../utils/api';
import { calculateWorkingHours, calculateEndDate } from '../../../utils/projectScheduler';
import type { Project } from '../types';
import { useAuthStore } from '../../../store/useAuthStore';

// ==========================================
// STATIC CONFIG & STYLING
// ==========================================

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  'Yet To Start': { bg: '#e2e8f0', color: '#475569', label: 'Yet To Start' },
  'In Progress':  { bg: '#dcfce7', color: '#166534', label: 'In Progress' },
  'On Hold':      { bg: '#fef3c7', color: '#92400e', label: 'On Hold' },
  'Completed':    { bg: '#dbeafe', color: '#1e40af', label: 'Completed' },
  'Cancelled':    { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const PRIORITY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  LOW:      { bg: '#e2e8f0', color: '#475569', label: 'Low' },
  MEDIUM:   { bg: '#ffedd5', color: '#9a3412', label: 'Medium' },
  HIGH:     { bg: '#fee2e2', color: '#b91c1c', label: 'High' },
  CRITICAL: { bg: '#fecdd3', color: '#7f1d1d', label: 'Critical' },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  'Yet To Start': ['In Progress', 'On Hold', 'Completed', 'Cancelled'],
  'In Progress':  ['Yet To Start', 'On Hold', 'Completed', 'Cancelled'],
  'On Hold':      ['Yet To Start', 'In Progress', 'Completed', 'Cancelled'],
  'Completed':    ['Yet To Start', 'In Progress', 'On Hold', 'Cancelled'],
  'Cancelled':    ['Yet To Start', 'In Progress', 'On Hold', 'Completed'],
};

const StatusChip: React.FC<{ status: string; onClick?: (e: any) => void; interactive?: boolean }> = ({
  status,
  onClick,
  interactive,
}) => {
  const cfg = STATUS_COLORS[status] || { bg: '#e2e8f0', color: '#475569', label: status };
  return (
    <Chip
      label={cfg.label}
      size="small"
      onClick={onClick}
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
// ROW ACTIONS
// ==========================================

interface RowActionsProps {
  part: Project;
  onStatusChange: (part: Project, status: string) => void;
  onView: (id: string) => void;
  onEdit: (part: Project) => void;
  onDelete: (part: Project) => void;
  canEdit?: boolean;
}

const RowActions: React.FC<RowActionsProps> = ({
  part,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
  canEdit = true,
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
            onView(part.id);
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
              onEdit(part);
            }}
            dense
          >
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit Part
          </MenuItem>
        )}
        {canEdit && (
          <MenuItem
            onClick={() => {
              handleClose();
              onDelete(part);
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
// EDIT DIALOG
// ==========================================

const editSchema = z
  .object({
    partNumber: z.string().min(1, 'Part number is required'),
    name: z.string().min(3, 'Package name is required'),
    partName: z.string().min(1, 'Part name is required'),
    description: z.string().optional(),
    clientId: z.string().min(1, 'Client is required'),
    projectManagerId: z.string().optional(),
    departmentId: z.string().optional(),
    status: z.string(),
    statusReason: z.string().optional(),
    priority: z.string(),
    isBillable: z.boolean(),
    plannedStartDate: z.string().optional(),
    plannedEndDate: z.string().optional(),
    estimatedHours: z.coerce.number().min(0),
    contractHours: z.coerce.number().min(0).optional(),
    invoiceStatus: z.string(),
    tokForm: z.string().optional(),
    feedbackStatus: z.string(),
  })
  .refine(
    (data) => {
      if (data.plannedStartDate && data.plannedEndDate) {
        return new Date(data.plannedEndDate) >= new Date(data.plannedStartDate);
      }
      return true;
    },
    { message: 'Planned end date cannot be before start date', path: ['plannedEndDate'] }
  );

type EditPartFormInputs = z.infer<typeof editSchema>;

interface EditPartDialogProps {
  part: Project | null;
  open: boolean;
  onClose: () => void;
}

const EditPartDialog: React.FC<EditPartDialogProps> = ({ part, open, onClose }) => {
  const updatePart = useUpdatePart();
  const { data: clientsData } = useGetClients({ limit: 200 });
  const { data: employeesData } = useGetEmployees({ limit: 200 });
  const { data: departmentsData } = useGetDepartments({ limit: 100 });
  const { data: holidays = [] } = useGetHolidays();

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
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditPartFormInputs>({
    resolver: zodResolver(editSchema),
  });

  React.useEffect(() => {
    if (part) {
      reset({
        partNumber: part.partNumber,
        name: part.name,
        partName: part.partName,
        description: part.description || '',
        clientId: part.clientId,
        projectManagerId: part.projectManagerId || '',
        departmentId: part.departmentId || undefined,
        status: part.status,
        statusReason: part.statusReason || '',
        priority: part.priority,
        isBillable: part.isBillable,
        plannedStartDate: part.plannedStartDate || '',
        plannedEndDate: part.plannedEndDate || '',
        estimatedHours: part.estimatedHours,
        contractHours: part.contractHours || undefined,
        invoiceStatus: part.invoiceStatus,
        tokForm: part.tokForm || '',
        feedbackStatus: part.feedbackStatus,
      });
    }
  }, [part, reset]);

  const plannedStartDate = watch('plannedStartDate');
  const plannedEndDate = watch('plannedEndDate');
  const estimatedHours = watch('estimatedHours');

  // Auto-calculate Planned End Date when Start Date or Estimated Hours change
  React.useEffect(() => {
    if (plannedStartDate && estimatedHours > 0) {
      const computedEndDate = calculateEndDate(plannedStartDate, estimatedHours, holidays);
      setValue('plannedEndDate', computedEndDate, { shouldValidate: true });
    }
  }, [plannedStartDate, estimatedHours, holidays, setValue]);

  const availableCapacity = useMemo(() => {
    if (plannedStartDate && plannedEndDate) {
      return calculateWorkingHours(plannedStartDate, plannedEndDate, holidays);
    }
    return 0;
  }, [plannedStartDate, plannedEndDate, holidays]);

  const isCapacityExceeded = !!(plannedStartDate && plannedEndDate) && estimatedHours > availableCapacity;

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

  const onSubmit = async (data: EditPartFormInputs) => {
    if (!part) return;

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
      await updatePart.mutateAsync({
        id: part.id,
        data: {
          partNumber: data.partNumber.trim().toUpperCase(),
          name: data.name.trim(),
          partName: data.partName.trim(),
          description: data.description?.trim() || undefined,
          clientId: data.clientId,
          projectManagerId: data.projectManagerId || undefined,
          departmentId: data.departmentId || undefined,
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
      // error displayed via updatePart.error
    }
  };


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Part Details</DialogTitle>
      <DialogContent dividers sx={{ py: 3 }}>
        {updatePart.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {parseError(updatePart.error)}
          </Alert>
        )}
        <form id="edit-part-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
            Part & Package Identity
          </Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="partNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Part Number *"
                    fullWidth
                    size="small"
                    error={!!errors.partNumber}
                    helperText={errors.partNumber?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Package Name *"
                    fullWidth
                    size="small"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="partName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Part Name *"
                    fullWidth
                    size="small"
                    error={!!errors.partName}
                    helperText={errors.partName?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
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

            <Grid size={{ xs: 12, sm: 6 }}>
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
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
            Classification & Schedule
          </Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
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
                  />
                )}
              />
            </Grid>

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

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="estimatedHours"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Estimated Hours *"
                    fullWidth
                    size="small"
                    error={!!errors.estimatedHours}
                    helperText={errors.estimatedHours?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
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
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="isBillable"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={<Switch checked={value} onChange={onChange} />}
                    label="Is Billable"
                  />
                )}
              />
            </Grid>

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
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
            Invoicing & Documentation
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
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
                      <MenuItem value="PAID">Paid</MenuItem>
                      <MenuItem value="PARTIAL_PAID">Partially Paid</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="tokForm"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="TOK Form Ref"
                    placeholder="e.g. TOK-2025-01"
                    fullWidth
                    size="small"
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                  Customer Feedback
                </Typography>
                <Controller
                  name="feedbackStatus"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="RECEIVED">Received</MenuItem>
                      <MenuItem value="EXCELLENT">Excellent</MenuItem>
                      <MenuItem value="GOOD">Good</MenuItem>
                      <MenuItem value="SATISFACTORY">Satisfactory</MenuItem>
                      <MenuItem value="NEEDS_IMPROVEMENT">Needs Improvement</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button
          type="submit"
          form="edit-part-form"
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={isSubmitting || updatePart.isPending || isCapacityExceeded}
        >
          {updatePart.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==========================================
// STATUS REASON DIALOG (Cancelled/Restored)
// ==========================================

interface StatusReasonDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  status: string;
}

const StatusReasonDialog: React.FC<StatusReasonDialogProps> = ({ open, onClose, onConfirm, status }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A reason is required.');
      return;
    }
    onConfirm(reason);
    setReason('');
    setError('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Status Change Reason</DialogTitle>
      <DialogContent dividers>
        <DialogContentText variant="body2" sx={{ mb: 2 }}>
          You are changing the status to <strong>{status}</strong>. Please provide a brief explanation or rationale.
        </DialogContentText>
        <form id="status-reason-form" onSubmit={handleSubmit}>
          <TextField
            label="Reason *"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setError('');
            }}
            fullWidth
            size="small"
            multiline
            rows={3}
            error={!!error}
            helperText={error}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="status-reason-form" variant="contained" color="primary">
          Submit
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
  part: Project | null;
  onClose: () => void;
}

const DeletePartDialog: React.FC<DeleteDialogProps> = ({ open, part, onClose }) => {
  const deletePart = useDeletePart();

  const handleConfirmDelete = async () => {
    if (!part) return;
    try {
      await deletePart.mutateAsync(part.id);
      onClose();
    } catch (_err) {
      // handled by deletePart.error
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete Part</DialogTitle>
      <DialogContent dividers>
        {deletePart.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {parseError(deletePart.error)}
          </Alert>
        )}
        <Typography variant="body2">
          Are you sure you want to delete the part <strong>{part?.partName}</strong> ({part?.partNumber})?
          This action will soft-delete the part.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={deletePart.isPending}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirmDelete}
          disabled={deletePart.isPending}
        >
          {deletePart.isPending ? 'Deleting...' : 'Delete'}
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

export const PartListPage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  const [editingPart, setEditingPart] = useState<Project | null>(null);
  const [deletingPart, setDeletingPart] = useState<Project | null>(null);
  const [statusReasonRequest, setStatusReasonRequest] = useState<{ part: Project; status: string } | null>(null);

  const { data: partsData, isLoading: partsLoading } = useGetParts({
    skip: 0,
    limit: 500,
  });

  const { data: clientsData } = useGetClients({ limit: 200 });
  const updateStatus = useUpdatePartStatus();

  const allParts = partsData?.parts || [];
  const clients = clientsData?.clients || [];

  const handleRowClick = useCallback((id: string) => {
    navigate(`/parts/${id}`);
  }, [navigate]);

  const handleStatusChange = useCallback(
    (part: Project, status: string) => {
      if (status === 'Cancelled' || part.status === 'Cancelled') {
        setStatusReasonRequest({ part, status });
      } else {
        updateStatus.mutate({ id: part.id, status });
      }
    },
    [updateStatus]
  );

  const filteredParts = useMemo(() => {
    return allParts.filter((p) => {
      // General search
      if (search) {
        const q = search.toLowerCase();
        const matches =
          p.partNumber.toLowerCase().includes(q) ||
          p.partName.toLowerCase().includes(q) ||
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.clientName && p.clientName.toLowerCase().includes(q)) ||
          (p.projectManagerName && p.projectManagerName.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      // Client filter
      if (clientFilter !== 'all' && p.clientId !== clientFilter) return false;
      return true;
    });
  }, [allParts, search, statusFilter, clientFilter]);

  const columns: Column<Project>[] = useMemo(() => [
    {
      id: 'partNumber',
      label: 'Part Number',
      getValue: (row) => row.partNumber,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'primary.main' }}>
          {row.partNumber}
        </Typography>
      ),
    },
    {
      id: 'partName',
      label: 'Part Name',
      getValue: (row) => row.partName,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.partName}</Typography>,
    },
    {
      id: 'name',
      label: 'Package Name',
      getValue: (row) => row.name,
      render: (row) => <Typography variant="body2" color="textSecondary">{row.name}</Typography>,
    },
    {
      id: 'clientName',
      label: 'Client',
      getValue: (row) => row.clientName || '—',
      render: (row) => <Typography variant="body2">{row.clientName || '—'}</Typography>,
    },
    {
      id: 'projectManagerName',
      label: 'Manager',
      getValue: (row) => row.projectManagerName || '—',
      render: (row) => <Typography variant="body2">{row.projectManagerName || '—'}</Typography>,
    },
    {
      id: 'estimatedHours',
      label: 'Est. Hours',
      align: 'right',
      render: (row) => <Typography variant="body2">{row.estimatedHours}h</Typography>,
    },
    {
      id: 'actualHours',
      label: 'Act. Hours',
      align: 'right',
      render: (row) => <Typography variant="body2">{row.actualHours}h</Typography>,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      render: (row) => <Typography variant="body2">{row.completedTaskCount} / {row.taskCount}</Typography>,
    },
    {
      id: 'progress',
      label: 'Progress',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
          <LinearProgress
            variant="determinate"
            value={row.progress}
            sx={{ width: 40, height: 6, borderRadius: 3 }}
            color={row.progress >= 100 ? 'success' : 'primary'}
          />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {Math.round(row.progress)}%
          </Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      id: 'plannedStartDate',
      label: 'Planned Start',
      type: 'date',
      render: (row) => <Typography variant="body2">{formatDate(row.plannedStartDate)}</Typography>,
    },
    {
      id: 'plannedEndDate',
      label: 'Planned End',
      type: 'date',
      render: (row) => <Typography variant="body2">{formatDate(row.plannedEndDate)}</Typography>,
    },
    {
      id: 'actualStartDate',
      label: 'Actual Start',
      type: 'date',
      render: (row) => <Typography variant="body2">{formatDate(row.actualStartDate)}</Typography>,
    },
    {
      id: 'actualEndDate',
      label: 'Actual End',
      type: 'date',
      render: (row) => <Typography variant="body2">{formatDate(row.actualEndDate)}</Typography>,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (row) => (
        <RowActions
          part={row}
          onStatusChange={handleStatusChange}
          onView={handleRowClick}
          onEdit={setEditingPart}
          onDelete={setDeletingPart}
          canEdit={useAuthStore.getState().hasPermission('Projects', 'edit')}
        />
      ),
    },
  ], [handleStatusChange, handleRowClick]);



  const handleConfirmStatusChange = useCallback(
    (reason: string) => {
      if (!statusReasonRequest) return;
      updateStatus.mutate({
        id: statusReasonRequest.part.id,
        status: statusReasonRequest.status,
        reason: reason,
      });
      setStatusReasonRequest(null);
    },
    [statusReasonRequest, updateStatus]
  );

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
            Parts Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Flat registry of all engineering parts and work scopes
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
          searchPlaceholder="Search parts by name, code or package..."
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
        {partsLoading && <LinearProgress />}
        <DataTable<Project>
          columns={columns}
          data={filteredParts}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => handleRowClick(row.id)}
        />
      </Card>

      {/* Modals */}
      <EditPartDialog
        part={editingPart}
        open={Boolean(editingPart)}
        onClose={() => setEditingPart(null)}
      />
      <DeletePartDialog
        part={deletingPart}
        open={Boolean(deletingPart)}
        onClose={() => setDeletingPart(null)}
      />
      <StatusReasonDialog
        open={Boolean(statusReasonRequest)}
        onClose={() => setStatusReasonRequest(null)}
        status={statusReasonRequest?.status || ''}
        onConfirm={handleConfirmStatusChange}
      />
    </Box>
  );
};

export default PartListPage;
