import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete,
  InputLabel,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';

import {
  useCreateTask,
  useGetScopeOfWork,
  useGetProjectDetailsByPart,
  useGetTasksByProject,
  useGetNextTaskCode,
  useGetTask,
  useUpdateTask,
} from '../services/taskService';
import { useGetProjects, useGetHolidays, useGetProject } from '../../projects/services/projectService';
import { useGetEmployees, useGetTeams } from '../../hr/services/hrService';
import type { TaskCreate } from '../types';
import { parseError } from '../../../utils/api';
import { calculateWorkingHours, calculateEndDate } from '../../../utils/projectScheduler';
import { TaskTitleDropdown } from '../../master-data/components/TaskTitleDropdown';

// ==========================================
// SCHEMA
// ==========================================

const taskFormSchema = z.object({
  taskCode: z.string().min(1, 'Task Code is required'),
  projectId: z.string().min(1, 'No project is associated with the selected Part Number.'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  scopeOfWorkId: z.string().optional(),
  teamId: z.string().min(1, 'Team selection is required.'),
  departmentCategory: z
    .enum(['CAD', 'CAM', 'GEN', 'SALES', 'ADMIN', 'MKRT', 'SUPRT', ''])
    .optional(),
  status: z
    .enum(['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'REOPENED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  estimatedHours: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  plannedDeliveryDate: z.string().optional(),
  remarks: z.string().optional(),
  assignedEmployeeId: z.string().optional(),
});

type TaskFormInputs = z.infer<typeof taskFormSchema>;

const DEPT_OPTIONS = [
  { value: 'CAD', label: 'CAD — Computer-Aided Design' },
  { value: 'CAM', label: 'CAM — Computer-Aided Manufacturing' },
  { value: 'GEN', label: 'GEN — General' },
  { value: 'SALES', label: 'SALES — Sales' },
  { value: 'ADMIN', label: 'ADMIN — Administration' },
  { value: 'MKRT', label: 'MKRT — Marketing' },
  { value: 'SUPRT', label: 'SUPRT — Support' },
];

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Yet To Start' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REOPENED', label: 'Rework Reopened' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

// ==========================================
// SECTION LABEL HELPER
// ==========================================

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <Box sx={{ mb: 2, mt: 1 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: 1 }}>
      {label}
    </Typography>
    <Divider sx={{ mt: 0.5 }} />
  </Box>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

export const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Part Number lookup states
  const [selectedPartNumber, setSelectedPartNumber] = useState<string>('');
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Fetch task if in edit mode
  const { data: taskToEdit, isLoading: taskLoading } = useGetTask(id || '');

  // Project options — fetch all active projects for the dropdown
  const { data: projectData, isLoading: projectsLoading } = useGetProjects({ limit: 500 });
  const projects = projectData?.projects ?? [];

  // Active employees for task assignment
  const { data: employees } = useGetEmployees({ limit: 200, accountStatus: 'ACTIVE' });
  const activeEmployees = employees || [];

  // Fetch project details reactively
  const { data: fetchedDetails, error: fetchError, isLoading: detailsLoading } = useGetProjectDetailsByPart(selectedPartNumber);

  // Scope-of-work options (unfiltered — we'll filter in display)
  const { data: scopeData } = useGetScopeOfWork();

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormInputs>({
    resolver: zodResolver(taskFormSchema) as any,
    defaultValues: {
      taskCode: '',
      projectId: '',
      title: '',
      description: '',
      scopeOfWorkId: '',
      teamId: '',
      departmentCategory: '',
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      estimatedHours: undefined,
      plannedStartDate: '',
      plannedEndDate: '',
      plannedDeliveryDate: '',
      remarks: '',
      assignedEmployeeId: '',
    },
  });

  const { data: holidays = [] } = useGetHolidays();

  // Today in YYYY-MM-DD — used as min for date pickers in create mode
  const today = React.useMemo(() => new Date().toISOString().split('T')[0], []);

  const watchedProjectId = watch('projectId');
  const watchedTeamId = watch('teamId');

  // Fetch project details reactively to get departmentId
  const { data: activeProject } = useGetProject(watchedProjectId);

  // Fetch filtered teams list reactively
  const { data: teams = [], isLoading: teamsLoading } = useGetTeams(activeProject?.departmentId);

  // Reset/clear teamId if project/department changes and selected team is not in new department's teams
  useEffect(() => {
    if (watchedTeamId && teams.length > 0) {
      const teamExists = teams.some((t) => t.id === watchedTeamId);
      if (!teamExists) {
        setValue('teamId', '', { shouldValidate: true });
      }
    } else if (watchedTeamId && !teamsLoading && teams.length === 0) {
      setValue('teamId', '', { shouldValidate: true });
    }
  }, [teams, teamsLoading, watchedTeamId, setValue]);

  const plannedStartDate = watch('plannedStartDate');
  const plannedEndDate = watch('plannedEndDate');
  const estimatedHours = watch('estimatedHours');


  // Fetch next available task code from server (bypasses RBAC, scans ALL tasks)
  const { data: nextCodeData } = useGetNextTaskCode(watchedProjectId);

  // Auto-calculate Planned End Date when Start Date or Estimated Hours change
  useEffect(() => {
    if (plannedStartDate && estimatedHours && estimatedHours > 0) {
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

  // Only flag capacity exceeded when BOTH dates are provided — otherwise capacity is unknown
  const isCapacityExceeded = !!(plannedStartDate && plannedEndDate && estimatedHours && estimatedHours > availableCapacity);

  // Real-time capacity error handling
  useEffect(() => {
    if (plannedStartDate && plannedEndDate && estimatedHours && estimatedHours > 0) {
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

  // Real-time project end date constraint + past date validation
  const projectPlannedEndDate = projectDetails?.plannedEndDate ?? null;
  useEffect(() => {
    if (!isEditMode && plannedStartDate && plannedStartDate < today) {
      setError('plannedStartDate', { type: 'manual', message: 'Start date cannot be in the past.' });
    } else {
      clearErrors('plannedStartDate');
    }
  }, [plannedStartDate, today, isEditMode, setError, clearErrors]);

  useEffect(() => {
    if (!isEditMode && plannedEndDate && plannedEndDate < today) {
      setError('plannedEndDate', { type: 'manual', message: 'End date cannot be in the past.' });
    } else if (plannedEndDate && projectPlannedEndDate && plannedEndDate > projectPlannedEndDate) {
      setError('plannedEndDate', {
        type: 'manual',
        message: `Cannot exceed project end date (${projectPlannedEndDate}).`,
      });
    } else {
      clearErrors('plannedEndDate');
    }
  }, [plannedEndDate, today, isEditMode, projectPlannedEndDate, setError, clearErrors]);

  // Handle Lookup changes and populate states
  useEffect(() => {
    if (selectedPartNumber === '') {
      setProjectDetails(null);
      setLookupError(null);
      setValue('projectId', '');
      setValue('taskCode', '');
      return;
    }

    if (fetchedDetails) {
      setProjectDetails(fetchedDetails);
      setLookupError(null);
      setValue('projectId', fetchedDetails.projectId, { shouldValidate: true });
    } else if (fetchError) {
      setProjectDetails(null);
      const errMsg = parseError(fetchError) || 'No project is associated with the selected Part Number.';
      setLookupError(errMsg);
      setValue('projectId', '');
      setValue('taskCode', '');
    }
  }, [fetchedDetails, fetchError, selectedPartNumber, setValue]);

  // Pre-populate form in edit mode
  useEffect(() => {
    if (isEditMode && taskToEdit) {
      reset({
        taskCode: taskToEdit.taskCode,
        projectId: taskToEdit.projectId,
        title: taskToEdit.title,
        description: taskToEdit.description || '',
        scopeOfWorkId: taskToEdit.scopeOfWorkId || '',
        teamId: taskToEdit.teamId || '',
        departmentCategory: taskToEdit.departmentCategory || '',
        status: taskToEdit.status,
        priority: taskToEdit.priority,
        estimatedHours: taskToEdit.estimatedHours,
        plannedStartDate: taskToEdit.plannedStartDate || '',
        plannedEndDate: taskToEdit.plannedEndDate || '',
        plannedDeliveryDate: taskToEdit.plannedDeliveryDate || '',
        remarks: taskToEdit.remarks || '',
        assignedEmployeeId: taskToEdit.assignments?.[0]?.employeeId || '',
      });

      // Set selectedPartNumber based on taskCode (e.g. PN-1001-002 -> PN-1001)
      const parts = taskToEdit.taskCode.split('-');
      if (parts.length > 1) {
        const partNumber = parts.slice(0, -1).join('-');
        setSelectedPartNumber(partNumber);
      }
    }
  }, [isEditMode, taskToEdit, reset]);

  // Handle auto-generation of task code suffix using server-provided next code
  useEffect(() => {
    if (!isEditMode && selectedPartNumber && watchedProjectId && nextCodeData?.next_code) {
      setValue('taskCode', nextCodeData.next_code, { shouldValidate: true });
    }
  }, [isEditMode, nextCodeData, selectedPartNumber, watchedProjectId, setValue]);

  const onSubmit = async (data: TaskFormInputs) => {
    if (data.plannedStartDate && data.plannedEndDate && data.estimatedHours) {
      const capacity = calculateWorkingHours(data.plannedStartDate, data.plannedEndDate, holidays);
      if (data.estimatedHours > capacity) {
        setError('estimatedHours', {
          type: 'manual',
          message: 'Estimated hours exceed available working hours between selected dates.',
        });
        return;
      }
    }

    // Guard: no past dates in create mode
    if (!isEditMode) {
      if (data.plannedStartDate && data.plannedStartDate < today) {
        setError('plannedStartDate', { type: 'manual', message: 'Start date cannot be in the past.' });
        return;
      }
      if (data.plannedEndDate && data.plannedEndDate < today) {
        setError('plannedEndDate', { type: 'manual', message: 'End date cannot be in the past.' });
        return;
      }
    }

    // Guard: task end date must not exceed project end date
    if (data.plannedEndDate && projectPlannedEndDate && data.plannedEndDate > projectPlannedEndDate) {
      setError('plannedEndDate', {
        type: 'manual',
        message: `Cannot exceed project end date (${projectPlannedEndDate}).`,
      });
      return;
    }

    setSubmitError(null);
    try {
      const payload: TaskCreate = {
        taskCode: data.taskCode,
        projectId: data.projectId,
        title: data.title,
        description: data.description || undefined,
        scopeOfWorkId: data.scopeOfWorkId || undefined,
        teamId: data.teamId,
        departmentCategory: data.departmentCategory || undefined,
        status: data.status,
        priority: data.priority,
        estimatedHours: data.estimatedHours,
        plannedStartDate: data.plannedStartDate || undefined,
        plannedEndDate: data.plannedEndDate || undefined,
        plannedDeliveryDate: data.plannedDeliveryDate || undefined,
        remarks: data.remarks || undefined,
        assignedEmployeeId: data.assignedEmployeeId || undefined,
      };

      if (isEditMode && id) {
        await updateMutation.mutateAsync({ id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate('/tasks');
    } catch (err: any) {
      setSubmitError(parseError(err));
    }
  };

  if (isEditMode && taskLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1.5 }}>
          <AssignmentIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {isEditMode ? 'Edit Engineering Task' : 'Create Engineering Task'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {isEditMode ? 'Update task details and assignments' : 'Add a new part or work item to the system'}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<CloseIcon />}
          onClick={() => navigate('/tasks')}
        >
          Cancel
        </Button>
      </Box>

      {/* Error Banner */}
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      {lookupError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLookupError(null)}>
          {lookupError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            {/* IDENTIFICATION */}
            <SectionLabel label="Part Identification" />
            <Grid container spacing={3}>
              {/* Part Number Dropdown */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={projects}
                  loading={projectsLoading}
                  value={projects.find((p) => p.partNumber === selectedPartNumber) || null}
                  getOptionLabel={(option) => option.partNumber}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_, newVal) => {
                    const nextPart = newVal?.partNumber ?? '';
                    setSelectedPartNumber(nextPart);
                    // Clear previous values before loading new ones
                    setProjectDetails(null);
                    setLookupError(null);
                    setValue('projectId', '');
                    setValue('taskCode', '');
                    setValue('departmentCategory', '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Part Number *"
                      size="small"
                      placeholder="Select part number..."
                      error={!!errors.projectId || !!lookupError}
                      helperText={
                        lookupError ||
                        errors.projectId?.message ||
                        'Select the parent project by Part Number'
                      }
                      slotProps={{
                        ...params.slotProps,
                        inputLabel: { shrink: true },
                        input: {
                          ...params.slotProps.input,
                          endAdornment: (
                            <>
                              {projectsLoading || detailsLoading ? (
                                <CircularProgress color="inherit" size={14} />
                              ) : null}
                              {params.slotProps.input.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Project Name (Read Only) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Project Name (Read Only)"
                  value={projectDetails?.projectName ?? ''}
                  fullWidth
                  size="small"
                  disabled
                  slotProps={{ inputLabel: { shrink: true } }}
                  placeholder="Associated project name"
                />
              </Grid>

              {/* Read Only Details */}
              {projectDetails && (
                <>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Package Name (Read Only)"
                      value={projectDetails?.packageName ?? ''}
                      fullWidth
                      size="small"
                      disabled
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Part Name (Read Only)"
                      value={projectDetails?.partName ?? ''}
                      fullWidth
                      size="small"
                      disabled
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Client (Read Only)"
                      value={projectDetails?.clientName ?? ''}
                      fullWidth
                      size="small"
                      disabled
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      label="Assigned To (Read Only)"
                      value={projectDetails?.projectManager ?? 'Unassigned'}
                      fullWidth
                      size="small"
                      disabled
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      label="Part Priority (Read Only)"
                      value={projectDetails?.priority ?? ''}
                      fullWidth
                      size="small"
                      disabled
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      label="Project Status (Read Only)"
                      value={projectDetails?.status ?? ''}
                      fullWidth
                      size="small"
                      disabled
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      label="Task Code (Auto-generated)"
                      value={watch('taskCode') ?? ''}
                      fullWidth
                      size="small"
                      disabled
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { style: { fontFamily: 'monospace', fontWeight: 600 } }
                      }}
                      helperText="Generated from Part Number & sequence suffix"
                    />
                  </Grid>
                </>
              )}

              {/* Title — Searchable Task Title Library Dropdown */}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TaskTitleDropdown
                      value={field.value}
                      onChange={(title, description) => {
                        field.onChange(title);
                        if (description) {
                          setValue('description', description, { shouldValidate: true });
                        }
                      }}
                      error={!!errors.title}
                      helperText={errors.title?.message}
                    />
                  )}
                />
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
                      placeholder="Describe the deliverables, revision notes, or special requirements..."
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

            {/* SCOPE & CLASSIFICATION */}
            <Box sx={{ mt: 3 }}>
              <SectionLabel label="Scope & Classification" />
            </Box>
            <Grid container spacing={3}>
              {/* Alert if project is selected but no teams are found for its department */}
              {watchedProjectId && teams.length === 0 && !teamsLoading && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity="warning">
                    No teams are defined for the project's department ({activeProject?.departmentName || 'Unknown'}). Please configure teams in HR first.
                  </Alert>
                </Grid>
              )}

              {/* Team selection */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" error={!!errors.teamId}>
                  <InputLabel shrink>Team *</InputLabel>
                  <Controller
                    name="teamId"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Team *" displayEmpty notched disabled={!watchedProjectId}>
                        <MenuItem value="" disabled>
                          {watchedProjectId ? '-- Select Team --' : '-- Select Part Number First --'}
                        </MenuItem>
                        {teams.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.team_name} {t.team_code ? `(${t.team_code})` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.teamId?.message || (watchedProjectId && teams.length === 0 && !teamsLoading ? "No teams found in project's department." : "")}
                  </FormHelperText>
                </FormControl>
              </Grid>

              {/* Department Category */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" error={!!errors.departmentCategory}>
                  <InputLabel shrink>Department Category</InputLabel>
                  <Controller
                    name="departmentCategory"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Department Category" displayEmpty notched>
                        <MenuItem value="">— Select Department —</MenuItem>
                        {DEPT_OPTIONS.map((d) => (
                          <MenuItem key={d.value} value={d.value}>
                            {d.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.departmentCategory && (
                    <FormHelperText>{errors.departmentCategory.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Status */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink>Status</InputLabel>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Status" notched>
                        {STATUS_OPTIONS.map((s) => (
                          <MenuItem key={s.value} value={s.value}>
                            {s.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              {/* Priority */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink>Priority</InputLabel>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Priority" notched>
                        {PRIORITY_OPTIONS.map((p) => (
                          <MenuItem key={p.value} value={p.value}>
                            {p.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              {/* Estimated Hours */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="estimatedHours"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      label="Estimated Hours"
                      placeholder="e.g. 8"
                      type="number"
                      fullWidth
                      size="small"
                      error={!!errors.estimatedHours}
                      helperText={errors.estimatedHours?.message}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { min: 0, step: 0.5 },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Assigned To */}
              <Grid size={{ xs: 12, sm: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink>Assigned To</InputLabel>
                  <Controller
                    name="assignedEmployeeId"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Assigned To" displayEmpty notched>
                        <MenuItem value="">— Unassigned —</MenuItem>
                        {activeEmployees.map((e) => (
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
            </Grid>

            {/* DATES */}
            <Box sx={{ mt: 3 }}>
              <SectionLabel label="Dates" />
            </Box>
            <Grid container spacing={3}>
              {/* Planned Start Date */}
              <Grid size={{ xs: 12, sm: 4 }}>
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
                      error={!!errors.plannedStartDate}
                      helperText={errors.plannedStartDate?.message}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: {
                          min: isEditMode ? undefined : today,
                          max: projectPlannedEndDate ?? undefined,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Planned End Date */}
              <Grid size={{ xs: 12, sm: 4 }}>
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
                      error={!!errors.plannedEndDate}
                      helperText={errors.plannedEndDate?.message ?? (projectPlannedEndDate ? `Max: ${projectPlannedEndDate}` : undefined)}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: {
                          min: isEditMode ? undefined : (plannedStartDate || today),
                          max: projectPlannedEndDate ?? undefined,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Planned Delivery Date */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="plannedDeliveryDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Planned Delivery Date"
                      fullWidth
                      size="small"
                      error={!!errors.plannedDeliveryDate}
                      helperText={errors.plannedDeliveryDate?.message}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: {
                          min: isEditMode ? undefined : today,
                          max: projectPlannedEndDate ?? undefined,
                        },
                      }}
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
                    Available Capacity: {availableCapacity} Hours | Estimated Effort: {estimatedHours || 0} Hours
                  </Typography>
                </Grid>
              )}
            </Grid>

            {/* REMARKS */}
            <Box sx={{ mt: 3 }}>
              <SectionLabel label="Remarks" />
            </Box>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="remarks"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Remarks"
                      placeholder="Any additional notes, client instructions, or reference information..."
                      multiline
                      rows={3}
                      fullWidth
                      size="small"
                      error={!!errors.remarks}
                      helperText={errors.remarks?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={isSubmitting || isCapacityExceeded}
          >
            {isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Task')}
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => navigate('/tasks')} disabled={isSubmitting}>
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CreateTaskPage;
