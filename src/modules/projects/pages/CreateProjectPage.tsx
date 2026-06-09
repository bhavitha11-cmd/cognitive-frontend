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
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import { useAppStore } from '../../../store/useAppStore';
import type { Project  } from '../../../types';

const projectFormSchema = z
  .object({
    name: z.string().min(3, 'Project Name must be at least 3 characters'),
    shortCode: z.string().min(2, 'Short Code must be at least 2 characters'),
    startDate: z.string().min(1, 'Start Date is required'),
    deadline: z.string().min(1, 'Deadline Date is required'),
    clientId: z.string().min(1, 'Client is required'),
    department: z.string().min(1, 'Department is required'),
    category: z.string().min(1, 'Category is required'),
    summary: z.string().min(10, 'Summary must be at least 10 characters'),
    notes: z.string().optional(),
  })
  .refine((data) => new Date(data.deadline) >= new Date(data.startDate), {
    message: 'Deadline cannot be before the start date',
    path: ['deadline'],
  });

type ProjectFormInputs = z.infer<typeof projectFormSchema>;

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const clients = useAppStore((state) => state.clients);
  const addProject = useAppStore((state) => state.addProject);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormInputs>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      shortCode: '',
      startDate: new Date().toISOString().split('T')[0],
      deadline: '',
      clientId: '',
      department: 'Engineering',
      category: 'Development',
      summary: '',
      notes: '',
    },
  });

  const onSubmit = (data: ProjectFormInputs) => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: data.name,
      shortCode: data.shortCode.toUpperCase(),
      startDate: data.startDate,
      deadline: data.deadline,
      clientId: data.clientId,
      department: data.department,
      category: data.category,
      summary: data.summary,
      notes: data.notes,
      progress: 0,
      status: 'In Progress',
    };

    addProject(newProject);
    navigate('/projects');
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Create Project
        </Typography>
        <Button variant="outlined" color="secondary" startIcon={<CloseIcon />} onClick={() => navigate('/projects')}>
          Cancel
        </Button>
      </Box>

      {/* Project Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Project Name */}
              <Grid size={{ xs: 12, sm: 8 }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Project Name *"
                      placeholder="e.g. E-Commerce Redesign"
                      fullWidth
                      size="small"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              {/* Short Code */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="shortCode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Short Code *"
                      placeholder="e.g. PRJ-EC"
                      fullWidth
                      size="small"
                      error={!!errors.shortCode}
                      helperText={errors.shortCode?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
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

              {/* Deadline */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="deadline"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Deadline *"
                      fullWidth
                      size="small"
                      error={!!errors.deadline}
                      helperText={errors.deadline?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              {/* Client Selection */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small" error={!!errors.clientId}>
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>Client *</FormLabel>
                  <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} displayEmpty>
                        <MenuItem value="" disabled>
                          -- Choose Client --
                        </MenuItem>
                        {clients.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.companyName} ({c.name})
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.clientId && <FormHelperText>{errors.clientId.message}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Department */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>Department *</FormLabel>
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <Select {...field}>
                        <MenuItem value="Engineering">Engineering</MenuItem>
                        <MenuItem value="Sales">Sales</MenuItem>
                        <MenuItem value="Marketing">Marketing</MenuItem>
                        <MenuItem value="Design">Design</MenuItem>
                        <MenuItem value="Customer Success">Customer Success</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              {/* Category */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>Category *</FormLabel>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select {...field}>
                        <MenuItem value="Development">Development</MenuItem>
                        <MenuItem value="Design">Design</MenuItem>
                        <MenuItem value="Marketing">Marketing</MenuItem>
                        <MenuItem value="Consulting">Consulting</MenuItem>
                        <MenuItem value="Support">Support</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              {/* Summary */}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="summary"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Project Summary *"
                      placeholder="Describe project deliverables..."
                      multiline
                      rows={3}
                      fullWidth
                      size="small"
                      error={!!errors.summary}
                      helperText={errors.summary?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              {/* Notes */}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Notes"
                      placeholder="Additional notes..."
                      multiline
                      rows={2}
                      fullWidth
                      size="small"
                      error={!!errors.notes}
                      helperText={errors.notes?.message}
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
            Create Project
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => navigate('/projects')}>
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CreateProjectPage;
