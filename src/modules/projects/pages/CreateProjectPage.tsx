import React from 'react';
import { useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

import { useCreateProject, useGetHolidays } from '../services/projectService';
import { useGetClients } from '../../clients/services/clientService';
import { useGetEmployees } from '../../hr/services/hrService';
import { parseError } from '../../../utils/api';
import { calculateWorkingHours, calculateEndDate } from '../../../utils/projectScheduler';

// ==========================================
// FORM SCHEMA
// ==========================================

const schema = z
  .object({
    partNumber: z.string().min(1, 'Part Number is required.'),
    name: z.string().min(3, 'Package Name must be at least 3 characters'),
    partName: z.string().min(1, 'Part Name is required.'),
    description: z.string().optional(),
    clientId: z.string().min(1, 'Client is required'),
    projectManagerId: z.string().optional(),
    status: z.string().min(1),
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
  );

type FormInputs = z.infer<typeof schema>;

// ==========================================
// PAGE
// ==========================================

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();

  const createProject = useCreateProject();
  const { data: clientsData } = useGetClients({ limit: 200 });
  const { data: employees } = useGetEmployees({ limit: 200, accountStatus: 'ACTIVE' });
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
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      partNumber: '',
      name: '',
      partName: '',
      description: '',
      clientId: '',
      projectManagerId: '',
      status: 'Yet To Start',
      priority: 'MEDIUM',
      isBillable: true,
      plannedStartDate: '',
      plannedEndDate: '',
      estimatedHours: 0,
      contractHours: undefined,
      invoiceStatus: 'PENDING',
      tokForm: '',
      feedbackStatus: 'PENDING',
    },
  });

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

  const onSubmit = async (data: FormInputs) => {
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
      await createProject.mutateAsync({
        partNumber: data.partNumber.trim().toUpperCase(),
        name: data.name.trim(),
        partName: data.partName.trim(),
        description: data.description?.trim() || undefined,
        clientId: data.clientId,
        projectManagerId: data.projectManagerId || undefined,
        status: data.status,
        priority: data.priority,
        isBillable: data.isBillable,
        plannedStartDate: data.plannedStartDate || undefined,
        plannedEndDate: data.plannedEndDate || undefined,
        estimatedHours: data.estimatedHours,
        contractHours: data.contractHours || undefined,
        invoiceStatus: data.invoiceStatus,
        tokForm: data.tokForm?.trim() || undefined,
        feedbackStatus: data.feedbackStatus,
      });
      navigate('/projects');
    } catch (_err) {
      // error displayed via createProject.error
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FolderOpenIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Create Project
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Register a new engineering package
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
        >
          Back
        </Button>
      </Box>

      {/* Error Banner */}
      {createProject.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {parseError(createProject.error)}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Section 1: Project Identity */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Project Identity"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            sx={{ pb: 0 }}
          />
          <Divider sx={{ mt: 1.5 }} />
          <CardContent>
            <Grid container spacing={3}>
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

              {/* Client */}
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
                      rows={3}
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
          </CardContent>
        </Card>

        {/* Section 2: Classification & Dates */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Classification & Schedule"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            sx={{ pb: 0 }}
          />
          <Divider sx={{ mt: 1.5 }} />
          <CardContent>
            <Grid container spacing={3}>
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
            </Grid>
          </CardContent>
        </Card>

        {/* Section 3: Hours & Finance */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Hours & Finance"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            sx={{ pb: 0 }}
          />
          <Divider sx={{ mt: 1.5 }} />
          <CardContent>
            <Grid container spacing={3} sx={{ alignItems: 'center' }}>
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
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/projects')}
            disabled={isSubmitting || createProject.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={isSubmitting || createProject.isPending || isCapacityExceeded}
          >
            {createProject.isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CreateProjectPage;
