import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { api, parseError } from '../../../utils/api';
import { useCreateTimeEntry } from '../services/timesheetService';
import type { Task } from '../../tasks/types';

// ==========================================
// SCHEMA
// ==========================================

const schema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  date: z.string().min(1, 'Date is required'),
  hoursSpent: z
    .number({ message: 'Enter a valid number' })
    .min(0.25, 'Minimum 0.25 hours')
    .max(24, 'Maximum 24 hours'),
  description: z.string().optional(),
  entryType: z.enum(['REGULAR', 'OVERTIME', 'CORRECTION']),
  isBillable: z.boolean(),
});

type FormInputs = z.infer<typeof schema>;

// ==========================================
// HELPERS
// ==========================================

const todayISO = (): string => new Date().toISOString().split('T')[0];

const mapBackendTaskToOption = (t: any): Task => ({
  id: t.id,
  taskCode: t.task_code,
  title: t.title,
  description: t.description || undefined,
  projectId: t.project_id,
  projectName: t.project_name || undefined,
  parentTaskId: t.parent_task_id || undefined,
  scopeOfWorkId: t.scope_of_work_id || undefined,
  scopeName: t.scope_name || undefined,
  departmentCategory: t.department_category || undefined,
  status: t.status || 'NOT_STARTED',
  priority: t.priority || 'MEDIUM',
  estimatedHours: t.estimated_hours ?? 0,
  actualHours: t.actual_hours ?? 0,
  progress: t.progress ?? 0,
  plannedStartDate: t.planned_start_date || undefined,
  plannedEndDate: t.planned_end_date || undefined,
  actualStartDate: t.actual_start_date || undefined,
  actualEndDate: t.actual_end_date || undefined,
  receivedDate: t.received_date || undefined,
  plannedDeliveryDate: t.planned_delivery_date || undefined,
  actualDeliveryDate: t.actual_delivery_date || undefined,
  remarks: t.remarks || undefined,
  isActive: t.is_active ?? true,
  assignments: [],
  assigneeCount: t.assignee_count ?? 0,
  createdAt: t.created_at || undefined,
});

// ==========================================
// COMPONENT
// ==========================================

export const LogTimePage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateTimeEntry();

  // Task search state
  const [taskSearch, setTaskSearch] = useState('');
  const [taskOptions, setTaskOptions] = useState<Task[]>([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      taskId: '',
      date: todayISO(),
      hoursSpent: 1,
      description: '',
      entryType: 'REGULAR',
      isBillable: true,
    },
  });

  // Search tasks when user types in autocomplete
  const searchTasks = useCallback(async (search: string) => {
    setTaskLoading(true);
    try {
      const params: Record<string, any> = { limit: 20 };
      if (search.trim()) params.search = search.trim();
      const response = await api.get('/tasks', { params });
      const data = response.data?.data || response.data || {};
      const rawTasks = data.tasks || data.items || [];
      setTaskOptions(rawTasks.map(mapBackendTaskToOption));
    } catch {
      setTaskOptions([]);
    } finally {
      setTaskLoading(false);
    }
  }, []);

  // Load initial task options on mount
  useEffect(() => {
    searchTasks('');
  }, [searchTasks]);

  // Debounced search on input change
  useEffect(() => {
    const timer = setTimeout(() => {
      searchTasks(taskSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [taskSearch, searchTasks]);

  const handleTaskChange = (_event: React.SyntheticEvent, task: Task | null) => {
    setSelectedTask(task);
    setValue('taskId', task?.id ?? '', { shouldValidate: true });
  };

  const onSubmit = async (data: FormInputs) => {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync({
        taskId: data.taskId,
        date: data.date,
        hoursSpent: data.hoursSpent,
        description: data.description || undefined,
        entryType: data.entryType,
        isBillable: data.isBillable,
      });
      navigate('/timesheets');
    } catch (err) {
      setSubmitError(parseError(err));
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Log Time
        </Typography>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<CloseIcon />}
          onClick={() => navigate('/timesheets')}
        >
          Cancel
        </Button>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Task Selector */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small" error={!!errors.taskId}>
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>
                    Task *
                  </FormLabel>
                  <Controller
                    name="taskId"
                    control={control}
                    render={() => (
                      <Autocomplete
                        options={taskOptions}
                        value={selectedTask}
                        onChange={handleTaskChange}
                        inputValue={taskSearch}
                        onInputChange={(_event, value) => setTaskSearch(value)}
                        loading={taskLoading}
                        getOptionLabel={(option) =>
                          `${option.taskCode} — ${option.title}`
                        }
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        filterOptions={(x) => x}
                        size="small"
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Search by code or title..."
                            error={!!errors.taskId}
                            helperText={errors.taskId?.message}
                            slotProps={{
                              ...params.slotProps,
                              input: {
                                ...params.slotProps.input,
                                endAdornment: (
                                  <>
                                    {taskLoading && <CircularProgress color="inherit" size={16} />}
                                    {params.slotProps.input.endAdornment}
                                  </>
                                ),
                              },
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props} key={option.id}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {option.taskCode}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {option.title}
                                {option.projectName ? ` · ${option.projectName}` : ''}
                              </Typography>
                            </Box>
                          </li>
                        )}
                        noOptionsText={taskLoading ? 'Searching…' : 'No tasks found'}
                      />
                    )}
                  />
                </FormControl>
              </Grid>

              {/* Auto-filled Project */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small">
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>
                    Project (auto-filled)
                  </FormLabel>
                  <TextField
                    value={selectedTask?.projectName ?? ''}
                    size="small"
                    placeholder="Select a task to auto-fill"
                    disabled
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: selectedTask ? 'inherit' : undefined,
                      },
                    }}
                  />
                </FormControl>
              </Grid>

              {/* Date */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Date *"
                      fullWidth
                      size="small"
                      error={!!errors.date}
                      helperText={errors.date?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              {/* Hours Spent */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="hoursSpent"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Hours Spent *"
                      fullWidth
                      size="small"
                      error={!!errors.hoursSpent}
                      helperText={errors.hoursSpent?.message}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { step: 0.25, min: 0.25, max: 24 },
                      }}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>

              {/* Entry Type */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="entryType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small" error={!!errors.entryType}>
                      <InputLabel shrink>Entry Type *</InputLabel>
                      <Select {...field} label="Entry Type *" notched>
                        <MenuItem value="REGULAR">Regular</MenuItem>
                        <MenuItem value="OVERTIME">Overtime</MenuItem>
                        <MenuItem value="CORRECTION">Correction</MenuItem>
                      </Select>
                      {errors.entryType && (
                        <FormHelperText>{errors.entryType.message}</FormHelperText>
                      )}
                    </FormControl>
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
                      label="Description (optional)"
                      placeholder="Briefly describe the work done..."
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

              {/* Billable Checkbox */}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="isBillable"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Billable hours"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Task Scope of Work Info Panel */}
        {selectedTask && (selectedTask.scopeName || selectedTask.description) && (
          <Card sx={{ mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <InfoOutlinedIcon fontSize="small" color="info" sx={{ mt: 0.25 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Task Info
                  </Typography>
                  {selectedTask.scopeName && (
                    <Typography variant="caption" sx={{ display: 'block' }} color="textSecondary">
                      Scope: {selectedTask.scopeName}
                    </Typography>
                  )}
                  {selectedTask.description && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }} color="textSecondary">
                      {selectedTask.description}
                    </Typography>
                  )}
                  {selectedTask.estimatedHours > 0 && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }} color="textSecondary">
                      Estimated: {selectedTask.estimatedHours}h · Actual so far: {selectedTask.actualHours}h
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={isSubmitting || createMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            disabled={isSubmitting || createMutation.isPending}
          >
            {isSubmitting || createMutation.isPending ? 'Saving…' : 'Log Time'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/timesheets')}
            disabled={isSubmitting || createMutation.isPending}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default LogTimePage;
