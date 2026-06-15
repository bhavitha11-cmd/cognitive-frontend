import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
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
  Stack,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';

import { useCreateTask, useGetScopeOfWork } from '../services/taskService';
import { useGetProjects } from '../../projects/services/projectService';
import type { TaskCreate } from '../types';
import { parseError } from '../../../utils/api';

// ==========================================
// SCHEMA
// ==========================================

const taskFormSchema = z.object({
  taskCode: z.string().min(1, 'Part Number / Task Code is required'),
  projectId: z.string().min(1, 'Project is required'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  scopeOfWorkId: z.string().optional(),
  departmentCategory: z
    .enum(['CAD', 'CAM', 'GEN', 'SALES', 'ADMIN', 'MKRT', 'SUPRT', ''])
    .optional(),
  status: z
    .enum(['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])
    .default('NOT_STARTED'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  estimatedHours: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  receivedDate: z.string().optional(),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  plannedDeliveryDate: z.string().optional(),
  remarks: z.string().optional(),
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
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
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
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Project options — fetch all active projects for the dropdown
  const { data: projectData, isLoading: projectsLoading } = useGetProjects({ limit: 500 });
  const projects = projectData?.projects ?? [];

  // Scope-of-work options (unfiltered — we'll filter in display)
  const { data: scopeData, isLoading: scopeLoading } = useGetScopeOfWork();
  const scopes = scopeData ?? [];

  const createMutation = useCreateTask();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormInputs>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      taskCode: '',
      projectId: '',
      title: '',
      description: '',
      scopeOfWorkId: '',
      departmentCategory: '',
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      estimatedHours: undefined,
      receivedDate: '',
      plannedStartDate: '',
      plannedEndDate: '',
      plannedDeliveryDate: '',
      remarks: '',
    },
  });

  const watchedScopeId = watch('scopeOfWorkId');

  // Auto-fill department when scope changes
  useEffect(() => {
    if (watchedScopeId) {
      const selectedScope = scopes.find((s) => s.id === watchedScopeId);
      if (selectedScope?.departmentCategory) {
        setValue('departmentCategory', selectedScope.departmentCategory as any, {
          shouldValidate: true,
        });
      }
    }
  }, [watchedScopeId, scopes, setValue]);

  const onSubmit = async (data: TaskFormInputs) => {
    setSubmitError(null);
    try {
      const payload: TaskCreate = {
        taskCode: data.taskCode,
        projectId: data.projectId,
        title: data.title,
        description: data.description || undefined,
        scopeOfWorkId: data.scopeOfWorkId || undefined,
        departmentCategory: data.departmentCategory || undefined,
        status: data.status,
        priority: data.priority,
        estimatedHours: data.estimatedHours,
        receivedDate: data.receivedDate || undefined,
        plannedStartDate: data.plannedStartDate || undefined,
        plannedEndDate: data.plannedEndDate || undefined,
        plannedDeliveryDate: data.plannedDeliveryDate || undefined,
        remarks: data.remarks || undefined,
      };
      await createMutation.mutateAsync(payload);
      navigate('/tasks');
    } catch (err: any) {
      setSubmitError(parseError(err));
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <AssignmentIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Create Engineering Task
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Add a new part or work item to the system
            </Typography>
          </Box>
        </Stack>
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

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            {/* IDENTIFICATION */}
            <SectionLabel label="Part Identification" />
            <Grid container spacing={3}>
              {/* Part Number / Task Code */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="taskCode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Part Number / Task Code *"
                      placeholder="e.g. 715-075598-002"
                      fullWidth
                      size="small"
                      error={!!errors.taskCode}
                      helperText={errors.taskCode?.message || 'Engineering part number or unique task code'}
                      slotProps={{ inputLabel: { shrink: true }, htmlInput: { style: { fontFamily: 'monospace', fontWeight: 600 } } }}
                    />
                  )}
                />
              </Grid>

              {/* Project */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="projectId"
                  control={control}
                  render={({ field }) => {
                    const selectedProject = projects.find((p) => p.id === field.value) ?? null;
                    return (
                      <Autocomplete
                        options={projects}
                        loading={projectsLoading}
                        value={selectedProject}
                        getOptionLabel={(option) =>
                          `${option.projectCode} — ${option.name}`
                        }
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        onChange={(_, newVal) => {
                          field.onChange(newVal?.id ?? '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Project *"
                            size="small"
                            placeholder="Select project..."
                            error={!!errors.projectId}
                            helperText={errors.projectId?.message || 'Select the parent project'}
                            slotProps={{
                              ...params.slotProps,
                              inputLabel: { shrink: true },
                              input: {
                                ...params.slotProps.input,
                                endAdornment: (
                                  <>
                                    {projectsLoading ? (
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
                    );
                  }}
                />
              </Grid>

              {/* Title */}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Task Title *"
                      placeholder="e.g. 3D Model — Bracket Assembly Rev B"
                      fullWidth
                      size="small"
                      error={!!errors.title}
                      helperText={errors.title?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
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
              {/* Scope of Work */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="scopeOfWorkId"
                  control={control}
                  render={({ field }) => {
                    const selectedScope = scopes.find((s) => s.id === field.value) ?? null;
                    return (
                      <Autocomplete
                        options={scopes}
                        loading={scopeLoading}
                        value={selectedScope}
                        getOptionLabel={(option) =>
                          `${option.code} — ${option.name} (${option.departmentCategory})`
                        }
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        onChange={(_, newVal) => {
                          field.onChange(newVal?.id ?? '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Scope of Work"
                            size="small"
                            placeholder="Select scope..."
                            helperText="Auto-fills Department Category"
                            slotProps={{
                              ...params.slotProps,
                              inputLabel: { shrink: true },
                              input: {
                                ...params.slotProps.input,
                                endAdornment: (
                                  <>
                                    {scopeLoading ? (
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
                    );
                  }}
                />
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
                  <FormHelperText>Auto-filled from Scope of Work</FormHelperText>
                </FormControl>
              </Grid>

              {/* Status */}
              <Grid size={{ xs: 12, sm: 3 }}>
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
              <Grid size={{ xs: 12, sm: 3 }}>
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
              <Grid size={{ xs: 12, sm: 3 }}>
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
            </Grid>

            {/* DATES */}
            <Box sx={{ mt: 3 }}>
              <SectionLabel label="Dates" />
            </Box>
            <Grid container spacing={3}>
              {/* Received Date */}
              <Grid size={{ xs: 12, sm: 3 }}>
                <Controller
                  name="receivedDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Received Date"
                      fullWidth
                      size="small"
                      error={!!errors.receivedDate}
                      helperText={errors.receivedDate?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              {/* Planned Start Date */}
              <Grid size={{ xs: 12, sm: 3 }}>
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
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              {/* Planned End Date */}
              <Grid size={{ xs: 12, sm: 3 }}>
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
                      helperText={errors.plannedEndDate?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              {/* Planned Delivery Date */}
              <Grid size={{ xs: 12, sm: 3 }}>
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
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
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
