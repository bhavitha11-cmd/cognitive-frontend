import React, { useEffect, useState } from 'react';
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
  FormLabel,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import { useAppStore } from '../../../store/useAppStore';
import { mockEmployees } from '../../../utils/mockData';
import type { TimesheetEntry } from '../../../types';

const timesheetFormSchema = z
  .object({
    projectId: z.string().min(1, 'Project is required'),
    taskId: z.string().min(1, 'Task is required'),
    employeeId: z.string().min(1, 'Employee is required'),
    startTime: z.string().min(1, 'Start Time is required'),
    endTime: z.string().min(1, 'End Time is required'),
    memo: z.string().min(5, 'Memo must be at least 5 characters'),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: 'End Time must be after Start Time',
    path: ['endTime'],
  });

type TimesheetFormInputs = z.infer<typeof timesheetFormSchema>;

export const LogTimePage: React.FC = () => {
  const navigate = useNavigate();
  const projects = useAppStore((state) => state.projects);
  const tasks = useAppStore((state) => state.tasks);
  const logTime = useAppStore((state) => state.logTime);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TimesheetFormInputs>({
    resolver: zodResolver(timesheetFormSchema),
    defaultValues: {
      projectId: '',
      taskId: '',
      employeeId: '',
      startTime: '',
      endTime: '',
      memo: '',
    },
  });

  const selectedProjectId = watch('projectId');
  const startTimeVal = watch('startTime');
  const endTimeVal = watch('endTime');

  const [availableTasks, setAvailableTasks] = useState(tasks);
  const [totalHours, setTotalHours] = useState(0);

  // Filter tasks based on selected project
  useEffect(() => {
    if (selectedProjectId) {
      const filtered = tasks.filter((t) => t.projectId === selectedProjectId);
      setAvailableTasks(filtered);
      setValue('taskId', ''); // Reset task selection
    } else {
      setAvailableTasks([]);
    }
  }, [selectedProjectId, tasks, setValue]);

  // Calculate hours dynamically
  useEffect(() => {
    if (startTimeVal && endTimeVal) {
      const start = new Date(startTimeVal).getTime();
      const end = new Date(endTimeVal).getTime();
      const diff = end - start;
      if (diff > 0) {
        const hours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
        setTotalHours(hours);
      } else {
        setTotalHours(0);
      }
    } else {
      setTotalHours(0);
    }
  }, [startTimeVal, endTimeVal]);

  const onSubmit = (data: TimesheetFormInputs) => {
    const employee = mockEmployees.find((e) => e.id === data.employeeId);
    const newEntry: TimesheetEntry = {
      id: `time-${Date.now()}`,
      projectId: data.projectId,
      taskId: data.taskId,
      employeeId: data.employeeId,
      employeeName: employee?.name || 'Unknown Employee',
      startTime: data.startTime,
      endTime: data.endTime,
      memo: data.memo,
      totalHours: totalHours,
    };

    logTime(newEntry);
    navigate('/timesheets');
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Log Time
        </Typography>
        <Button variant="outlined" color="secondary" startIcon={<CloseIcon />} onClick={() => navigate('/timesheets')}>
          Cancel
        </Button>
      </Box>

      {/* Log Time Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Project Selection */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small" error={!!errors.projectId}>
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>Project *</FormLabel>
                  <Controller
                    name="projectId"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} displayEmpty>
                        <MenuItem value="" disabled>
                          -- Choose Project --
                        </MenuItem>
                        {projects.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.shortCode} - {p.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.projectId && <FormHelperText>{errors.projectId.message}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Task Selection */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small" error={!!errors.taskId}>
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>Task *</FormLabel>
                  <Controller
                    name="taskId"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} displayEmpty disabled={!selectedProjectId}>
                        <MenuItem value="" disabled>
                          {selectedProjectId ? '-- Choose Task --' : 'Select Project First'}
                        </MenuItem>
                        {availableTasks.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.title}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.taskId && <FormHelperText>{errors.taskId.message}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Employee Selection */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small" error={!!errors.employeeId}>
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>Employee *</FormLabel>
                  <Controller
                    name="employeeId"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} displayEmpty>
                        <MenuItem value="" disabled>
                          -- Choose Employee --
                        </MenuItem>
                        {mockEmployees.map((e) => (
                          <MenuItem key={e.id} value={e.id}>
                            {e.name} ({e.role})
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.employeeId && <FormHelperText>{errors.employeeId.message}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Start Time */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="datetime-local"
                      label="Start Date & Time *"
                      fullWidth
                      size="small"
                      error={!!errors.startTime}
                      helperText={errors.startTime?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              {/* End Time */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="endTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="datetime-local"
                      label="End Date & Time *"
                      fullWidth
                      size="small"
                      error={!!errors.endTime}
                      helperText={errors.endTime?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              {/* Total Hours (Automatically Calculated) */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Total Logged Hours"
                  value={totalHours > 0 ? `${totalHours} hrs` : '0 hrs'}
                  disabled
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: '#206bc4',
                      fontWeight: 700,
                    },
                  }}
                />
              </Grid>

              {/* Memo */}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="memo"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Work Memo / Description *"
                      placeholder="Write brief details about what was accomplished..."
                      multiline
                      rows={3}
                      fullWidth
                      size="small"
                      error={!!errors.memo}
                      helperText={errors.memo?.message}
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
          <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />}>
            Log Time
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => navigate('/timesheets')}>
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default LogTimePage;
