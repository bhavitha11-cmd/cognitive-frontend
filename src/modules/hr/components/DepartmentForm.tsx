import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TextField, MenuItem, FormControl, FormLabel, Select, Grid, FormHelperText } from '@mui/material';
import type { Department } from '../types';

const departmentSchema = z.object({
  name: z.string().min(2, 'Department Name must be at least 2 characters'),
  code: z.string().min(2, 'Department Code must be at least 2 characters').max(20, 'Code must be at most 20 characters'),
  description: z.string().optional(),
  headEmployeeId: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
});

type DepartmentFormInputs = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  initialValues?: Department;
  onSubmit: (data: DepartmentFormInputs) => void;
  formId: string;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({ initialValues, onSubmit, formId }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFormInputs>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: initialValues?.name || '',
      code: initialValues?.code || '',
      description: initialValues?.description || '',
      headEmployeeId: initialValues?.headEmployeeId || '',
      status: initialValues?.status || 'Active',
    },
  });

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Department Name *"
                fullWidth
                size="small"
                error={!!errors.name}
                helperText={errors.name?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Department Code *"
                fullWidth
                size="small"
                disabled={!!initialValues}
                error={!!errors.code}
                helperText={errors.code?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
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

        <Grid size={{ xs: 12 }}>
          <FormControl fullWidth size="small" error={!!errors.status}>
            <FormLabel sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600 }}>Status</FormLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field}>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              )}
            />
            {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>
    </form>
  );
};

export default DepartmentForm;
