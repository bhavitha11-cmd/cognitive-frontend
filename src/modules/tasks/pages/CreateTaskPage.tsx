import React from 'react';
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
  Checkbox,
  ListItemText,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import { useAppStore } from '../../../store/useAppStore';
import { mockEmployees } from '../../../utils/mockData';
import type { Task  } from '../../../types';

const taskFormSchema = z
  .object({
    title: z.string().min(3, 'Task Title must be at least 3 characters'),
    projectId: z.string().min(1, 'Project is required'),
    assignees: z.array(z.string()).min(1, 'Assign at least one employee'),
    priority: z.enum(['High', 'Medium', 'Low']),
    status: z.enum(['To Do', 'In Progress', 'Review', 'Completed']),
    startDate: z.string().min(1, 'Start Date is required'),
    dueDate: z.string().min(1, 'Due Date is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.startDate), {
    message: 'Due Date cannot be before the start date',
    path: ['dueDate'],
  });

type TaskFormInputs = z.infer<typeof taskFormSchema>;

export const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const projects = useAppStore((state) => state.projects);
  const addTask = useAppStore((state) => state.addTask);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormInputs>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      projectId: '',
      assignees: [],
      priority: 'Medium',
      status: 'To Do',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      description: '',
    },
  });

  const onSubmit = (data: TaskFormInputs) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: data.title,
      projectId: data.projectId,
      assignees: data.assignees,
      priority: data.priority,
      status: data.status,
      startDate: data.startDate,
      dueDate: data.dueDate,
      description: data.description,
      attachments: [],
    };

    addTask(newTask);
    navigate('/tasks');
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Create Task
        </Typography>
        <Button variant="outlined" color="secondary" startIcon={<CloseIcon />} onClick={() => navigate('/tasks')}>
          Cancel
        </Button>
      </Box>

      {/* Task Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Task Title */}
              <Grid size={{ xs: 12, sm: 8 }}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Task Title *"
                      placeholder="e.g. Design User Flow Wireframes"
                      fullWidth
                      size="small"
                      error={!!errors.title}
                      helperText={errors.title?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

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

              {/* Assignees Selection (Multi-select) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" error={!!errors.assignees}>
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>Assignees *</FormLabel>
                  <Controller
                    name="assignees"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        multiple
                        renderValue={(selected) => (selected as string[]).join(', ')}
                      >
                        {mockEmployees.map((emp) => (
                          <MenuItem key={emp.id} value={emp.name}>
                            <Checkbox checked={field.value.indexOf(emp.name) > -1} size="small" />
                            <ListItemText primary={<Typography sx={{ fontSize: '0.875rem' }}>{emp.name}</Typography>} />
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.assignees && <FormHelperText>{errors.assignees.message}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Priority */}
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>Priority *</FormLabel>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <Select {...field}>
                        <MenuItem value="High">High</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="Low">Low</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              {/* Status */}
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>Status *</FormLabel>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select {...field}>
                        <MenuItem value="To Do">To Do</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Review">Review</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              {/* Start Date */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Start Date *"
                      fullWidth
                      size="small"
                      error={!!errors.startDate}
                      helperText={errors.startDate?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              {/* Due Date */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Due Date *"
                      fullWidth
                      size="small"
                      error={!!errors.dueDate}
                      helperText={errors.dueDate?.message}
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
                      label="Description *"
                      placeholder="Describe the goals and requirements of this task..."
                      multiline
                      rows={4}
                      fullWidth
                      size="small"
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              {/* File Attachment mockup */}
              <Grid size={{ xs: 12 }}>
                <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600, display: 'block' }}>Attachments</FormLabel>
                <Button variant="outlined" component="label" size="small">
                  Choose Files
                  <input type="file" hidden multiple />
                </Button>
                <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
                  Max file size: 5MB. Supported files: PDF, PNG, JPG, ZIP.
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />}>
            Create Task
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => navigate('/tasks')}>
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CreateTaskPage;
