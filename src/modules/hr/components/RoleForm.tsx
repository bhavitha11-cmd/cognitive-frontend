import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  TextField, MenuItem, FormControl, FormLabel, Select, Grid,
  FormHelperText, Box, Typography, Checkbox, Divider,
} from '@mui/material';
import type { Role } from '../types';

const MODULES = ['HR', 'Clients', 'Finance', 'Projects', 'Inventory', 'Settings', 'Reports'];
const PERMISSION_ACTIONS = [
  { key: 'can_view', label: 'View' },
  { key: 'can_create', label: 'Create' },
  { key: 'can_edit', label: 'Edit' },
  { key: 'can_delete', label: 'Delete' },
  { key: 'can_approve', label: 'Approve' },
  { key: 'can_export', label: 'Export' },
];

const permissionSchema = z.record(
  z.string(),
  z.object({
    can_view: z.boolean(),
    can_create: z.boolean(),
    can_edit: z.boolean(),
    can_delete: z.boolean(),
    can_approve: z.boolean(),
    can_export: z.boolean(),
  })
);

const roleSchema = z.object({
  name: z.string().min(2, 'Role Name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  reportsTo: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
  permissions: permissionSchema,
});

type RoleFormInputs = z.infer<typeof roleSchema>;

interface RoleFormProps {
  initialValues?: Role;
  onSubmit: (data: RoleFormInputs) => void;
  formId: string;
}

const buildDefaultPermissions = (existing?: Role): Record<string, any> => {
  const perms: Record<string, any> = {};
  for (const mod of MODULES) {
    const existingPerm = existing?.permissions?.find((p) => p.module_name === mod);
    perms[mod] = {
      can_view: existingPerm?.can_view || false,
      can_create: existingPerm?.can_create || false,
      can_edit: existingPerm?.can_edit || false,
      can_delete: existingPerm?.can_delete || false,
      can_approve: existingPerm?.can_approve || false,
      can_export: existingPerm?.can_export || false,
    };
  }
  return perms;
};

export const RoleForm: React.FC<RoleFormProps> = ({ initialValues, onSubmit, formId }) => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoleFormInputs>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      reportsTo: initialValues?.reportsTo || '',
      status: initialValues?.status || 'Active',
      permissions: buildDefaultPermissions(initialValues),
    },
  });

  const watchedPerms = watch('permissions');

  const handleToggleModule = (module: string, checked: boolean) => {
    setValue(`permissions.${module}`, {
      can_view: checked,
      can_create: checked,
      can_edit: checked,
      can_delete: checked,
      can_approve: checked,
      can_export: checked,
    } as any);
  };

  const handleToggleAction = (module: string, action: string, checked: boolean) => {
    setValue(`permissions.${module}.${action}` as any, checked as any);
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Role Name *"
                fullWidth
                size="small"
                error={!!errors.name}
                helperText={errors.name?.message}
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
                label="Description *"
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

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
        Module Permissions
      </Typography>

      <Box sx={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #e0e0e0' }}>Module</th>
              <th style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '2px solid #e0e0e0' }}>All</th>
              {PERMISSION_ACTIONS.map((act) => (
                <th key={act.key} style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '2px solid #e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>
                  {act.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((mod) => {
              const perm = watchedPerms?.[mod] || {
                can_view: false, can_create: false, can_edit: false,
                can_delete: false, can_approve: false, can_export: false,
              };
              const allChecked = Object.values(perm).every(Boolean);
              return (
                <tr key={mod}>
                  <td style={{ padding: '6px 12px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>{mod}</td>
                  <td style={{ textAlign: 'center', padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                    <Checkbox
                      size="small"
                      checked={allChecked}
                      onChange={(e) => handleToggleModule(mod, e.target.checked)}
                    />
                  </td>
                  {PERMISSION_ACTIONS.map((act) => (
                    <td key={act.key} style={{ textAlign: 'center', padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                      <Checkbox
                        size="small"
                        checked={(perm as any)[act.key]}
                        onChange={(e) => handleToggleAction(mod, act.key, e.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
    </form>
  );
};

export default RoleForm;
