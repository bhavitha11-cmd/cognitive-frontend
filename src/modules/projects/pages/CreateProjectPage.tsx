import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField,
  Typography,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Switch,
  InputAdornment,
  Alert,
  RadioGroup,
  Radio,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

import {
  useCreateProject,
  useCreatePart,
  useGetProjects,
  useGetHolidays,
} from '../services/projectService';
import { useGetClientsLookup } from '../../clients/services/clientService';
import { useGetEmployeesLookup, useGetDepartmentsLookup } from '../../hr/services/hrService';
import { parseError } from '../../../utils/api';
import { calculateWorkingHours, calculateEndDate } from '../../../utils/projectScheduler';
import { useAuthStore } from '../../../store/useAuthStore';

// ==========================================
// FORM SCHEMAS
// ==========================================

const formSchema = z
  .object({
    associationMode: z.enum(['existing', 'new']),
    parentProjectId: z.string().optional(),
    newProjectName: z.string().optional(),
    newProjectDescription: z.string().optional(),

    // Part details (originally project fields)
    partNumber: z.string().min(1, 'Part number is required'),
    partName: z.string().min(1, 'Part name is required'),
    description: z.string().optional(),
    clientId: z.string().min(1, 'Client is required'),
    projectManagerId: z.string().optional(),
    departmentId: z.string().min(1, 'Department is required'),
    status: z.string(),
    priority: z.string(),
    isBillable: z.boolean(),
    plannedStartDate: z.string().optional(),
    plannedEndDate: z.string().optional(),
    estimatedHours: z.coerce.number().min(0, 'Estimated hours must be >= 0'),
    contractHours: z.coerce.number().min(0).optional(),
    invoiceStatus: z.string(),
    tokForm: z.string().optional(),
    feedbackStatus: z.string(),
  })
  .refine(
    (data) => {
      if (data.associationMode === 'existing') {
        return !!data.parentProjectId;
      } else {
        return !!data.newProjectName && data.newProjectName.trim().length >= 3;
      }
    },
    {
      message: 'Project selection or a valid new project name is required',
      path: ['parentProjectId'],
    }
  )
  .refine(
    (data) => {
      if (data.plannedStartDate && data.plannedEndDate) {
        return new Date(data.plannedEndDate) >= new Date(data.plannedStartDate);
      }
      return true;
    },
    {
      message: 'Planned end date cannot be before the start date',
      path: ['plannedEndDate'],
    }
  );

type FormInputs = z.infer<typeof formSchema>;

// ==========================================
// COMPONENT
// ==========================================

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createProject = useCreateProject(); // For creating a new parent project + part
  const createPart = useCreatePart();       // For creating a part under an existing project
  
  const { data: projectsData } = useGetProjects({ limit: 500 });
  const { data: clients = [] } = useGetClientsLookup();
  const { data: managers = [] } = useGetEmployeesLookup();
  const { data: departments = [] } = useGetDepartmentsLookup();
  const { data: holidays = [] } = useGetHolidays();

  const projects = projectsData?.projects || [];

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
  } = useForm<FormInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      associationMode: 'existing',
      parentProjectId: '',
      newProjectName: '',
      newProjectDescription: '',
      partNumber: '',
      partName: '',
      description: '',
      clientId: '',
      projectManagerId: '',
      departmentId: '',
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

  const associationMode = watch('associationMode');
  const plannedStartDate = watch('plannedStartDate');
  const plannedEndDate = watch('plannedEndDate');
  const estimatedHours = watch('estimatedHours');

  // Auto-calculate Planned End Date when Start Date or Estimated Hours change
  useEffect(() => {
    if (plannedStartDate && estimatedHours > 0) {
      const computedEndDate = calculateEndDate(plannedStartDate, estimatedHours, holidays);
      setValue('plannedEndDate', computedEndDate, { shouldValidate: true });
    }
  }, [plannedStartDate, estimatedHours, holidays, setValue]);

  // Capacity calculation
  const availableCapacity = useMemo(() => {
    if (plannedStartDate && plannedEndDate) {
      return calculateWorkingHours(plannedStartDate, plannedEndDate, holidays);
    }
    return 0;
  }, [plannedStartDate, plannedEndDate, holidays]);

  const isCapacityExceeded = estimatedHours > availableCapacity;

  useEffect(() => {
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
    setSubmitError(null);

    // Double-check capacity
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
      if (data.associationMode === 'existing') {
        // Link to existing parent project -> Create Part
        const parentProj = projects.find((p) => p.id === data.parentProjectId);
        await createPart.mutateAsync({
          parentProjectId: data.parentProjectId,
          partNumber: data.partNumber.trim().toUpperCase(),
          name: parentProj ? parentProj.name : '',
          partName: data.partName.trim(),
          description: data.description?.trim() || undefined,
          clientId: data.clientId,
          projectManagerId: data.projectManagerId || undefined,
          departmentId: data.departmentId,
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
        navigate('/parts');
      } else {
        // Create new parent project + Part inside it
        await createProject.mutateAsync({
          name: (data.newProjectName || '').trim(),
          description: data.newProjectDescription?.trim() || undefined,
          clientId: data.clientId,
          projectManagerId: data.projectManagerId || undefined,
          departmentId: data.departmentId,
          status: 'Yet To Start',
          parts: [
            {
              partNumber: data.partNumber.trim().toUpperCase(),
              name: (data.newProjectName || '').trim(),
              partName: data.partName.trim(),
              description: data.description?.trim() || undefined,
              clientId: data.clientId,
              projectManagerId: data.projectManagerId || undefined,
              departmentId: data.departmentId,
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
            },
          ],
        });
        navigate('/parts');
      }
    } catch (err: any) {
      setSubmitError(parseError(err));
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 2 }}>
      {/* Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Create Part
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Define a new part and associate it with a project or package
        </Typography>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* SECTION 1: Project Association */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title={<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Project / Package Association</Typography>}
            sx={{ pb: 0 }}
          />
          <Divider sx={{ mt: 1.5 }} />
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="associationMode"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup {...field} row sx={{ gap: 4 }}>
                      <FormControlLabel
                        value="existing"
                        control={<Radio />}
                        label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Link to Existing Project</Typography>}
                      />
                      <FormControlLabel
                        value="new"
                        control={<Radio />}
                        label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Create New Project / Package</Typography>}
                      />
                    </RadioGroup>
                  )}
                />
              </Grid>

              {associationMode === 'existing' ? (
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth size="small" error={!!errors.parentProjectId}>
                    <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                      Select Project / Package *
                    </Typography>
                    <Controller
                      name="parentProjectId"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} displayEmpty>
                          <MenuItem value="" disabled>-- Select Existing Project --</MenuItem>
                          {projects.map((p) => (
                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.parentProjectId && <FormHelperText>{errors.parentProjectId.message}</FormHelperText>}
                  </FormControl>
                </Grid>
              ) : (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="newProjectName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="New Project Name *"
                          placeholder="e.g. Manufacturing Project"
                          fullWidth
                          size="small"
                          error={!!errors.parentProjectId}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="newProjectDescription"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="New Project Description"
                          placeholder="Brief description of the package..."
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* SECTION 2: General Part Details */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title={<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>General Details</Typography>}
            sx={{ pb: 0 }}
          />
          <Divider sx={{ mt: 1.5 }} />
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="partNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Part Number *"
                      placeholder="e.g. PART-A"
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
                  name="partName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Part Name *"
                      placeholder="e.g. Design Drafting"
                      fullWidth
                      size="small"
                      error={!!errors.partName}
                      helperText={errors.partName?.message}
                    />
                  )}
                />
              </Grid>

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

              <Grid size={{ xs: 12, sm: 4 }}>
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
                        {filteredManagers.map((m) => (
                          <MenuItem key={m.id} value={m.id}>{m.displayName}</MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
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

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Part Description"
                      placeholder="Describe the deliverables..."
                      multiline
                      rows={2}
                      fullWidth
                      size="small"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* SECTION 3: Timeline & Hours */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title={<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Timeline & Hours</Typography>}
            sx={{ pb: 0 }}
          />
          <Divider sx={{ mt: 1.5 }} />
          <CardContent>
            <Grid container spacing={3}>
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

              <Grid size={{ xs: 12, sm: 4 }}>
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
                      slotProps={{
                        input: { endAdornment: <InputAdornment position="end">hrs</InputAdornment> },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="contractHours"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Contract Hours"
                      placeholder="Leave blank if same"
                      fullWidth
                      size="small"
                      slotProps={{
                        input: { endAdornment: <InputAdornment position="end">hrs</InputAdornment> },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="isBillable"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <FormControlLabel
                      control={<Switch checked={value} onChange={onChange} color="primary" />}
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
          </CardContent>
        </Card>

        {/* SECTION 4: Invoicing & Documentation */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title={<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Invoicing & Feedback</Typography>}
            sx={{ pb: 0 }}
          />
          <Divider sx={{ mt: 1.5 }} />
          <CardContent>
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
                        <MenuItem value="PARTIALLY_INVOICED">Partially Invoiced</MenuItem>
                        <MenuItem value="NOT_APPLICABLE">Not Applicable</MenuItem>
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
                      label="TOK Form Reference"
                      placeholder="e.g. TOK-2026-001"
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
                        <MenuItem value="POSITIVE">Positive</MenuItem>
                        <MenuItem value="NEGATIVE">Negative</MenuItem>
                        <MenuItem value="NA">NA</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
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
            onClick={() => navigate('/parts')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={isSubmitting || isCapacityExceeded}
          >
            {isSubmitting ? 'Saving...' : 'Create Part'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CreateProjectPage;
