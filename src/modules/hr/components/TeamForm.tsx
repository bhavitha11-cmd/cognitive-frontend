import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TextField, Grid, FormControl, FormLabel, Select, MenuItem, Switch, FormControlLabel, FormHelperText } from '@mui/material';
import { useHRStore } from '../store/useHRStore';
import type { Team } from '../types';

const teamSchema = z.object({
  team_name: z.string().min(2, 'Team name must be at least 2 characters'),
  team_code: z.string().min(2, 'Team code must be at least 2 characters'),
  description: z.string().optional(),
  department_id: z.string().min(1, 'Department is required'),
  is_active: z.boolean(),
});

type TeamFormInputs = z.infer<typeof teamSchema>;

interface TeamFormProps {
  initialValues?: Team;
  onSubmit: (data: TeamFormInputs) => void;
  formId: string;
}

export const TeamForm: React.FC<TeamFormProps> = ({ initialValues, onSubmit, formId }) => {
  const departments = useHRStore((state) => state.departments);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamFormInputs>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      team_name: initialValues?.team_name || '',
      team_code: initialValues?.team_code || '',
      description: initialValues?.description || '',
      department_id: initialValues?.department_id || '',
      is_active: initialValues?.is_active !== undefined ? initialValues.is_active : true,
    },
  });

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="team_name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Team Name *"
                fullWidth
                size="small"
                error={!!errors.team_name}
                helperText={errors.team_name?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="team_code"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Team Code *"
                fullWidth
                size="small"
                error={!!errors.team_code}
                helperText={errors.team_code?.message}
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
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small" error={!!errors.department_id}>
            <FormLabel sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600 }}>Department *</FormLabel>
            <Controller
              name="department_id"
              control={control}
              render={({ field }) => (
                <Select {...field} displayEmpty error={!!errors.department_id}>
                  <MenuItem value="">-- None --</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.department_id && (
              <FormHelperText>{errors.department_id.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} color="primary" />}
                label="Active"
                sx={{ mt: 2 }}
              />
            )}
          />
        </Grid>
      </Grid>
    </form>
  );
};

export default TeamForm;
