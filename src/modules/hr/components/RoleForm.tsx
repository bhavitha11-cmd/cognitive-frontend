import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  TextField, MenuItem, FormControl, FormLabel, Select, Grid,
  FormHelperText, Box, Typography, Divider, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import type { Role, FeaturePermission, PermissionScope } from '../types';
import { useGetRoles, useGetRoleFeaturePermissions } from '../services/hrService';
import { useGetModules } from '../services/moduleService';
import api from '../../../utils/api';

const SCOPES: { value: PermissionScope; label: string } = [
  { value: 'NONE', label: 'None' },
  { value: 'OWNED', label: 'Owned' },
  { value: 'ADDED', label: 'Added' },
  { value: 'ADDED_OWNED', label: 'Added & Owned' },
  { value: 'TEAM', label: 'Team' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'COMPANY', label: 'Company' },
  { value: 'ALL', label: 'All' },
] as any;

const featurePermissionSchema = z.object({
  feature_id: z.string(),
  feature_key: z.string(),
  feature_name: z.string(),
  module_key: z.string(),
  module_name: z.string(),
  view_scope: z.string(),
  create_scope: z.string(),
  update_scope: z.string(),
  delete_scope: z.string(),
});

const roleSchema = z.object({
  name: z.string().min(2, 'Role Name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  reportsTo: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
  featurePermissions: z.array(featurePermissionSchema),
});

type RoleFormInputs = z.infer<typeof roleSchema>;

interface RoleFormProps {
  initialValues?: Role;
  onSubmit: (data: RoleFormInputs) => void;
  formId: string;
}

const EMPTY_ARRAY: any[] = [];

export const RoleForm: React.FC<RoleFormProps> = ({ initialValues, onSubmit, formId }) => {
  const { data: rolesData } = useGetRoles();
  const { data: modulesData } = useGetModules();
  
  const roles = rolesData || EMPTY_ARRAY;
  const modules = modulesData || EMPTY_ARRAY;
  
  // Load permissions for existing role
  const { data: fetchedPermissionsData, isLoading: isPermsLoading } = 
    useGetRoleFeaturePermissions(initialValues?.id || '');

  const fetchedPermissions = fetchedPermissionsData || EMPTY_ARRAY;

  const [cloneSourceId, setCloneSourceId] = useState<string>('');
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const parentRoleOptions = roles.filter(
    (r) => !initialValues || r.id !== initialValues.id
  );

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    getValues,
    formState: { errors },
  } = useForm<RoleFormInputs>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      reportsTo: initialValues?.reportsTo || '',
      status: initialValues?.status || 'Active',
      featurePermissions: [],
    },
  });

  const watchPermissions = watch('featurePermissions') || [];

  // Reset form when initial values or fetched permissions change
  useEffect(() => {
    if (initialValues) {
      if (fetchedPermissions && fetchedPermissions.length > 0 && !isInitialized) {
        reset({
          name: initialValues.name || '',
          description: initialValues.description || '',
          reportsTo: initialValues.reportsTo || '',
          status: initialValues.status || 'Active',
          featurePermissions: fetchedPermissions,
        });
        setIsInitialized(true);
      }
    } else {
      // For new roles, populate default NONE permissions using modules from dynamic module registry
      if (modules && modules.length > 0 && !isInitialized) {
        const defaultPerms: any[] = [];
        modules.forEach((mod) => {
          mod.features.forEach((feat) => {
            defaultPerms.push({
              feature_id: feat.id,
              feature_key: feat.feature_key,
              feature_name: feat.feature_name,
              module_key: mod.module_key,
              module_name: mod.module_name,
              view_scope: 'NONE',
              create_scope: 'NONE',
              update_scope: 'NONE',
              delete_scope: 'NONE',
            });
          });
        });
        reset({
          name: '',
          description: '',
          reportsTo: '',
          status: 'Active',
          featurePermissions: defaultPerms,
        });
        setIsInitialized(true);
      }
    }
  }, [initialValues, fetchedPermissions, modules, reset, isInitialized]);

  // Handle cloning permissions from another role
  const handleCloneSelect = async (sourceId: string) => {
    if (!sourceId) return;
    setCloneSourceId(sourceId);
    setIsCloning(true);
    try {
      const response = await api.get(`/roles/${sourceId}/feature-permissions`);
      const sourcePerms = response.data?.data?.permissions || [];
      
      // Update form permissions with clones
      if (sourcePerms.length > 0) {
        const updatedPerms = sourcePerms.map((sp: any) => ({
          feature_id: sp.feature_id,
          feature_key: sp.feature_key,
          feature_name: sp.feature_name,
          module_key: sp.module_key,
          module_name: sp.module_name,
          view_scope: sp.view_scope,
          create_scope: sp.create_scope,
          update_scope: sp.update_scope,
          delete_scope: sp.delete_scope,
        }));
        reset({
          ...getValues(),
          featurePermissions: updatedPerms,
        });
      }
    } catch (err) {
      console.error('Failed to copy permissions:', err);
    } finally {
      setIsCloning(false);
    }
  };

  // Group features by module for rendering
  const groupedPermissions: Record<string, typeof watchPermissions> = {};
  watchPermissions.forEach((perm, index) => {
    const key = perm.module_name || 'General';
    if (!groupedPermissions[key]) {
      groupedPermissions[key] = [];
    }
    // Store original index to bind correct register/Controller path
    (perm as any).formIndex = index;
    groupedPermissions[key].push(perm);
  });

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
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

        <Grid item xs={12}>
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

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" error={!!errors.reportsTo}>
            <FormLabel sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600 }}>Parent Role (Reports To)</FormLabel>
            <Controller
              name="reportsTo"
              control={control}
              render={({ field }) => (
                <Select {...field} displayEmpty>
                  <MenuItem value=""><em>None (Root Role)</em></MenuItem>
                  {parentRoleOptions.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.reportsTo && <FormHelperText>{errors.reportsTo.message}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
          Module & Feature Permissions
        </Typography>

        <FormControl size="small" sx={{ minWidth: 240 }}>
          <Select
            value={cloneSourceId}
            displayEmpty
            onChange={(e) => handleCloneSelect(e.target.value as string)}
            disabled={isCloning}
          >
            <MenuItem value="">
              <em>{isCloning ? 'Copying...' : 'Copy Permissions from Role'}</em>
            </MenuItem>
            {roles
              .filter((r) => r.id !== initialValues?.id)
              .map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Box>

      {isPermsLoading ? (
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <Typography color="textSecondary">Loading permissions registry...</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Feature / Operation</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, py: 1.5, width: '18%' }}>Create</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, py: 1.5, width: '18%' }}>View</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, py: 1.5, width: '18%' }}>Update</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, py: 1.5, width: '18%' }}>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                <React.Fragment key={moduleName}>
                  {/* Module Header Row */}
                  <TableRow>
                    <TableCell colSpan={5} sx={{ backgroundColor: '#f1f3f4', fontWeight: 700, py: 1, color: '#3c4043' }}>
                      {moduleName}
                    </TableCell>
                  </TableRow>

                  {/* Feature Rows */}
                  {perms.map((perm) => {
                    const formIdx = (perm as any).formIndex;
                    return (
                      <TableRow key={perm.feature_id} hover>
                        <TableCell sx={{ pl: 4, fontWeight: 500, color: '#202124' }}>
                          {perm.feature_name}
                        </TableCell>

                        {/* Create Scope */}
                        <TableCell align="center">
                          <Controller
                            name={`featurePermissions.${formIdx}.create_scope`}
                            control={control}
                            render={({ field }) => (
                              <Select {...field} size="small" fullWidth sx={{ fontSize: '0.75rem', height: 32 }}>
                                {SCOPES.map((sc) => (
                                  <MenuItem key={sc.value} value={sc.value} sx={{ fontSize: '0.75rem' }}>
                                    {sc.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                        </TableCell>

                        {/* View Scope */}
                        <TableCell align="center">
                          <Controller
                            name={`featurePermissions.${formIdx}.view_scope`}
                            control={control}
                            render={({ field }) => (
                              <Select {...field} size="small" fullWidth sx={{ fontSize: '0.75rem', height: 32 }}>
                                {SCOPES.map((sc) => (
                                  <MenuItem key={sc.value} value={sc.value} sx={{ fontSize: '0.75rem' }}>
                                    {sc.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                        </TableCell>

                        {/* Update Scope */}
                        <TableCell align="center">
                          <Controller
                            name={`featurePermissions.${formIdx}.update_scope`}
                            control={control}
                            render={({ field }) => (
                              <Select {...field} size="small" fullWidth sx={{ fontSize: '0.75rem', height: 32 }}>
                                {SCOPES.map((sc) => (
                                  <MenuItem key={sc.value} value={sc.value} sx={{ fontSize: '0.75rem' }}>
                                    {sc.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                        </TableCell>

                        {/* Delete Scope */}
                        <TableCell align="center">
                          <Controller
                            name={`featurePermissions.${formIdx}.delete_scope`}
                            control={control}
                            render={({ field }) => (
                              <Select {...field} size="small" fullWidth sx={{ fontSize: '0.75rem', height: 32 }}>
                                {SCOPES.map((sc) => (
                                  <MenuItem key={sc.value} value={sc.value} sx={{ fontSize: '0.75rem' }}>
                                    {sc.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </form>
  );
};

export default RoleForm;
