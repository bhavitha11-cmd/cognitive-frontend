import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  TextField,
  MenuItem,
  FormControl,
  FormLabel,
  Select,
  Grid,
  FormHelperText,
  Switch,
  FormControlLabel,
  Chip,
  Box,
  Typography,
  Divider,
  OutlinedInput,
  ListItemText,
  Checkbox,
} from '@mui/material';
import { useHRStore } from '../store/useHRStore';
import { useGetTeamsLookup, useGetEmployeesLookup } from '../services/hrService';
import type { Employee } from '../types';

const getEmployeeSchema = (isEditing: boolean) => z.object({
  employeeCode: z.string().min(2, 'Employee Code must be at least 2 characters').max(20, 'Employee Code must be at most 20 characters'),
  firstName: z.string().min(2, 'First Name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last Name must be at least 2 characters'),
  displayName: z.string().optional(),
  officialEmail: z.string().email('Invalid official email').optional().or(z.literal('')),
  personalEmail: z.string().email('Invalid personal email').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email address'),
  mobile: z.string().length(10, 'Mobile number must be exactly 10 digits').regex(/^\d{10}$/, 'Mobile number must contain numeric characters only'),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], { message: 'Gender is required' }),
  dateOfBirth: z.string().min(1, 'Date of Birth is required'),
  profilePhoto: z.string().optional(),

  departmentId: z.string().optional().or(z.literal('')),
  designationName: z.string().optional(),
  roleIds: z.array(z.string()).min(1, 'At least one role must be assigned'),
  reportingManagerId: z.string().optional().or(z.literal('')),
  dateOfJoining: z.string().min(1, 'Date of Joining is required'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  status: z.enum(['ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED']),

  username: z.string().min(4, 'Username must be at least 4 characters'),
  password: isEditing ? z.string().optional() : z.string().min(8, 'Password must be at least 8 characters'),
  sendWelcomeEmail: z.boolean(),

  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().length(10, 'Emergency contact phone must be exactly 10 digits').regex(/^\d{10}$/, 'Emergency contact phone must contain numeric characters only'),
  address: z.string().min(1, 'Address is required'),
  isDepartmentHead: z.boolean().optional(),
  teamId: z.string().optional().or(z.literal('')),
  isTeamLead: z.boolean().optional(),
});

type EmployeeFormInputs = z.infer<ReturnType<typeof getEmployeeSchema>>;

interface EmployeeFormProps {
  initialValues?: Employee;
  onSubmit: (data: EmployeeFormInputs) => void;
  formId: string;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ initialValues, onSubmit, formId }) => {
  const departments = useHRStore((state) => state.departments);
  const roles = useHRStore((state) => state.roles);

  const { data: employeesLookup = [] } = useGetEmployeesLookup();

  const isEditing = !!initialValues;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormInputs>({
    resolver: zodResolver(getEmployeeSchema(isEditing)),
    defaultValues: {
      employeeCode: initialValues?.employeeCode || '',
      firstName: initialValues?.firstName || '',
      middleName: initialValues?.middleName || '',
      lastName: initialValues?.lastName || '',
      displayName: initialValues?.displayName || '',
      officialEmail: initialValues?.officialEmail || '',
      personalEmail: initialValues?.personalEmail || '',
      email: initialValues?.email || '',
      mobile: initialValues?.mobile || '',
      phone: initialValues?.phone || '',
      alternatePhone: initialValues?.alternatePhone || '',
      gender: initialValues?.gender || '' as any,
      dateOfBirth: initialValues?.dateOfBirth || '',
      profilePhoto: initialValues?.profilePhoto || '',
      departmentId: initialValues?.departmentId || '',
      designationName: initialValues?.designationName || '',
      roleIds: initialValues?.roleIds || [],
      reportingManagerId: initialValues?.reportingManagerId || '',
      dateOfJoining: initialValues?.dateOfJoining || '',
      employmentType: initialValues?.employmentType || 'FULL_TIME',
      status: (initialValues?.status || 'ACTIVE') as any,
      username: initialValues?.username || '',
      password: '',
      sendWelcomeEmail: initialValues?.sendWelcomeEmail !== undefined ? initialValues.sendWelcomeEmail : true,
      emergencyContactName: initialValues?.emergencyContactName || '',
      emergencyContactPhone: initialValues?.emergencyContactPhone || '',
      address: initialValues?.address || '',
      isDepartmentHead: initialValues?.isDepartmentHead || false,
      teamId: initialValues?.teamId || '',
      isTeamLead: initialValues?.roleInTeam === 'LEAD',
    },
  });

  const selectedRoleIds = watch('roleIds') || [];

  const selectedDepartmentId = watch('departmentId');
  const selectedTeamId = watch('teamId');

  // Helper to trace ancestor role IDs
  const getAncestorRoleIds = (roleId: string): Set<string> => {
    const ancestors = new Set<string>();
    let currentId = roleId;
    const visited = new Set<string>();
    
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const role = roles.find((r) => r.id === currentId);
      if (role && role.reportsTo) {
        ancestors.add(role.reportsTo);
        currentId = role.reportsTo;
      } else {
        break;
      }
    }
    return ancestors;
  };

  // Get union of ancestor role IDs for all selected roles
  const allowedManagerRoleIds = new Set<string>();
  selectedRoleIds.forEach((rid) => {
    getAncestorRoleIds(rid).forEach((aid) => {
      allowedManagerRoleIds.add(aid);
    });
  });

  const managerOptions = employeesLookup.filter((e) => {
    if (initialValues && e.id === initialValues.id) return false;
    
    // 1. Filter by role hierarchy (if selected roles have defined reporting lines)
    if (selectedRoleIds.length > 0 && allowedManagerRoleIds.size > 0) {
      const hasManagerRole = e.roleIds?.some((rid) => allowedManagerRoleIds.has(rid));
      if (!hasManagerRole) return false;
    }
    
    return true;
  });

  const { data: teams = [] } = useGetTeamsLookup();

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit as any)}>
      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
        Personal Information
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="employeeCode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Emp ID *"
                fullWidth
                size="small"
                disabled={isEditing}
                error={!!errors.employeeCode}
                helperText={errors.employeeCode?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="First Name *"
                fullWidth
                size="small"
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="middleName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Middle Name"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Last Name *"
                fullWidth
                size="small"
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="displayName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Display Name"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Login Email *"
                fullWidth
                size="small"
                error={!!errors.email}
                helperText={errors.email?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="officialEmail"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Official Email"
                fullWidth
                size="small"
                error={!!errors.officialEmail}
                helperText={errors.officialEmail?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="personalEmail"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Personal Email"
                fullWidth
                size="small"
                error={!!errors.personalEmail}
                helperText={errors.personalEmail?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="mobile"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Mobile Number *"
                fullWidth
                size="small"
                error={!!errors.mobile}
                helperText={errors.mobile?.message}
                slotProps={{ inputLabel: { shrink: true } }}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  field.onChange(val);
                }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Phone"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="alternatePhone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Alternate Phone"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small" error={!!errors.gender}>
            <FormLabel sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600 }}>Gender *</FormLabel>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select {...field} displayEmpty>
                  <MenuItem value="">-- Select Gender --</MenuItem>
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                  <MenuItem value="PREFER_NOT_TO_SAY">Prefer not to say</MenuItem>
                </Select>
              )}
            />
            {errors.gender && <FormHelperText>{errors.gender.message}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="date"
                label="Date of Birth *"
                fullWidth
                size="small"
                error={!!errors.dateOfBirth}
                helperText={errors.dateOfBirth?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
        Organization Details
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small" error={!!errors.roleIds}>
            <FormLabel sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600 }}>Assigned Roles *</FormLabel>
            <Controller
              name="roleIds"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  multiple
                  displayEmpty
                  input={<OutlinedInput size="small" />}
                  renderValue={(selected) => {
                    const sel = selected as string[];
                    if (!sel || sel.length === 0) return <Typography variant="body2" color="textSecondary">-- Select Roles --</Typography>;
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {sel.map((id) => {
                          const role = roles.find((r) => r.id === id);
                          return <Chip key={id} label={role?.name || id} size="small" />;
                        })}
                      </Box>
                    );
                  }}
                >
                  {roles.filter((r) => r.status === 'Active').map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      <Checkbox checked={((field.value as string[]) || []).includes(role.id)} />
                      <ListItemText primary={role.name} secondary={role.description} />
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.roleIds && <FormHelperText>{errors.roleIds.message}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small" error={!!errors.departmentId}>
            <FormLabel sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600 }}>Department</FormLabel>
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select {...field} displayEmpty>
                  <MenuItem value="">-- Select Department --</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.departmentId && <FormHelperText>{errors.departmentId.message}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="designationName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Designation"
                placeholder="e.g. Software Engineer"
                fullWidth
                size="small"
                error={!!errors.designationName}
                helperText={errors.designationName?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small" error={!!errors.teamId}>
            <FormLabel sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600 }}>Team</FormLabel>
            <Controller
              name="teamId"
              control={control}
              render={({ field }) => (
                <Select {...field} displayEmpty>
                  <MenuItem value="">-- Select Team --</MenuItem>
                  {teams.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.team_name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.teamId && <FormHelperText>{errors.teamId.message}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small" error={!!errors.reportingManagerId}>
            <FormLabel sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600 }}>Reporting Manager</FormLabel>
            <Controller
              name="reportingManagerId"
              control={control}
              render={({ field }) => (
                <Select {...field} displayEmpty>
                  <MenuItem value="">-- Select Reporting Manager --</MenuItem>
                  {managerOptions.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.displayName}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.reportingManagerId && <FormHelperText>{errors.reportingManagerId.message}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="dateOfJoining"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="date"
                label="Date of Joining *"
                fullWidth
                size="small"
                error={!!errors.dateOfJoining}
                helperText={errors.dateOfJoining?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small" error={!!errors.employmentType}>
            <FormLabel sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600 }}>Employment Type</FormLabel>
            <Controller
              name="employmentType"
              control={control}
              render={({ field }) => (
                <Select {...field}>
                  <MenuItem value="FULL_TIME">Full-Time</MenuItem>
                  <MenuItem value="PART_TIME">Part-Time</MenuItem>
                  <MenuItem value="CONTRACT">Contract</MenuItem>
                  <MenuItem value="INTERN">Intern</MenuItem>
                </Select>
              )}
            />
            {errors.employmentType && <FormHelperText>{errors.employmentType.message}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small" error={!!errors.status}>
            <FormLabel sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600 }}>Account Status</FormLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field}>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PROBATION">Probation</MenuItem>
                  <MenuItem value="NOTICE_PERIOD">Notice Period</MenuItem>
                  <MenuItem value="ON_LEAVE">On Leave</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                </Select>
              )}
            />
            {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
        Emergency Contact & Address
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="emergencyContactName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Emergency Contact Name *"
                fullWidth
                size="small"
                error={!!errors.emergencyContactName}
                helperText={errors.emergencyContactName?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="emergencyContactPhone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Emergency Contact Phone *"
                fullWidth
                size="small"
                error={!!errors.emergencyContactPhone}
                helperText={errors.emergencyContactPhone?.message}
                slotProps={{ inputLabel: { shrink: true } }}
                inputProps={{ maxLength: 10 }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Address *"
                multiline
                rows={2}
                fullWidth
                size="small"
                error={!!errors.address}
                helperText={errors.address?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
        Authentication Information
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Username *"
                placeholder="e.g. johndoe12"
                fullWidth
                size="small"
                error={!!errors.username}
                helperText={errors.username?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="password"
                label={initialValues ? 'New Password (Optional)' : 'Password *'}
                placeholder="Min 8 characters"
                fullWidth
                size="small"
                error={!!errors.password}
                helperText={errors.password?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Controller
            name="sendWelcomeEmail"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} color="primary" />}
                label="Send welcome email with credentials details to employee"
              />
            )}
          />
        </Grid>
      </Grid>
    </form>
  );
};

export default EmployeeForm;
