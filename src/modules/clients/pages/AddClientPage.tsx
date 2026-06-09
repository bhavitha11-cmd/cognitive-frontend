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
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import { useAppStore } from '../../../store/useAppStore';
import type { Client  } from '../../../types';

const clientFormSchema = z.object({
  salutation: z.string(),
  name: z.string().min(2, 'Client Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  country: z.string().min(1, 'Country is required'),
  mobile: z.string().min(5, 'Mobile number must be valid'),
  gender: z.string(),
  language: z.string(),
  category: z.string(),
  subCategory: z.string(),
  loginAllowed: z.enum(['yes', 'no']),
  receiveNotifications: z.enum(['yes', 'no']),
  
  // Company Details
  companyName: z.string().min(2, 'Company Name must be at least 2 characters'),
  website: z.string().url('Please enter a valid URL (include https://)').or(z.literal('')),
  taxName: z.string(),
  taxNumber: z.string(),
  officePhone: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  address: z.string(),
});

type ClientFormInputs = z.infer<typeof clientFormSchema>;

export const AddClientPage: React.FC = () => {
  const navigate = useNavigate();
  const addClient = useAppStore((state) => state.addClient);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormInputs>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      salutation: 'Mr.',
      name: '',
      email: '',
      password: '',
      country: 'United States',
      mobile: '',
      gender: 'Male',
      language: 'English',
      category: 'SaaS Enterprise',
      subCategory: 'Tech Tier 1',
      loginAllowed: 'yes',
      receiveNotifications: 'yes',
      companyName: '',
      website: '',
      taxName: 'VAT',
      taxNumber: '',
      officePhone: '',
      city: '',
      state: '',
      postalCode: '',
      address: '',
    },
  });

  const onSubmit = (data: ClientFormInputs) => {
    const newClient: Client = {
      id: `client-${Date.now()}`,
      salutation: data.salutation,
      name: data.name,
      email: data.email,
      password: data.password,
      country: data.country,
      mobile: data.mobile,
      gender: data.gender,
      language: data.language,
      category: data.category,
      subCategory: data.subCategory,
      loginAllowed: data.loginAllowed === 'yes',
      receiveNotifications: data.receiveNotifications === 'yes',
      companyName: data.companyName,
      website: data.website || undefined,
      taxName: data.taxName,
      taxNumber: data.taxNumber,
      officePhone: data.officePhone,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      address: data.address,
    };

    addClient(newClient);
    navigate('/clients');
  };

  return (
    <Box>
      {/* Page Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Add Client
        </Typography>
        <Button variant="outlined" color="secondary" startIcon={<CloseIcon />} onClick={() => navigate('/clients')}>
          Cancel
        </Button>
      </Box>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Account Details
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 2 }}>
                <FormControl fullWidth size="small">
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>Salutation</FormLabel>
                  <Controller
                    name="salutation"
                    control={control}
                    render={({ field }) => (
                      <Select {...field}>
                        <MenuItem value="Mr.">Mr.</MenuItem>
                        <MenuItem value="Ms.">Ms.</MenuItem>
                        <MenuItem value="Mrs.">Mrs.</MenuItem>
                        <MenuItem value="Dr.">Dr.</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 5 }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Client Name *"
                      placeholder="e.g. John Doe"
                      fullWidth
                      size="small"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 5 }}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email *"
                      placeholder="e.g. johndoe@example.com"
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
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="password"
                      label="Password *"
                      placeholder="At least 8 characters"
                      fullWidth
                      size="small"
                      error={!!errors.password}
                      helperText={errors.password?.message || 'Must have at least 8 characters'}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Country *"
                      fullWidth
                      size="small"
                      error={!!errors.country}
                      helperText={errors.country?.message}
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
                      placeholder="e.g. 1234567890"
                      fullWidth
                      size="small"
                      error={!!errors.mobile}
                      helperText={errors.mobile?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>Gender</FormLabel>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select {...field}>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Others">Others</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl component="fieldset" error={!!errors.loginAllowed}>
                  <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>Login Allowed?</FormLabel>
                  <Controller
                    name="loginAllowed"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup row {...field}>
                        <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                        <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                      </RadioGroup>
                    )}
                  />
                  {errors.loginAllowed && <FormHelperText>{errors.loginAllowed.message}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl component="fieldset" error={!!errors.receiveNotifications}>
                  <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>Receive Email Notifications?</FormLabel>
                  <Controller
                    name="receiveNotifications"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup row {...field}>
                        <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                        <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                      </RadioGroup>
                    )}
                  />
                  {errors.receiveNotifications && (
                    <FormHelperText>{errors.receiveNotifications.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Company Details
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="companyName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Company Name *"
                      placeholder="e.g. Acme Corporation"
                      fullWidth
                      size="small"
                      error={!!errors.companyName}
                      helperText={errors.companyName?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="website"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Official Website"
                      placeholder="e.g. https://www.example.com"
                      fullWidth
                      size="small"
                      error={!!errors.website}
                      helperText={errors.website?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="taxName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Tax Name"
                      placeholder="e.g. VAT / GST"
                      fullWidth
                      size="small"
                      error={!!errors.taxName}
                      helperText={errors.taxName?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="taxNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="GST/VAT Number"
                      placeholder="e.g. 18AABCU960XXXXX"
                      fullWidth
                      size="small"
                      error={!!errors.taxNumber}
                      helperText={errors.taxNumber?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="officePhone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Office Phone Number"
                      fullWidth
                      size="small"
                      error={!!errors.officePhone}
                      helperText={errors.officePhone?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="City"
                      fullWidth
                      size="small"
                      error={!!errors.city}
                      helperText={errors.city?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="State"
                      fullWidth
                      size="small"
                      error={!!errors.state}
                      helperText={errors.state?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="postalCode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Postal Code"
                      fullWidth
                      size="small"
                      error={!!errors.postalCode}
                      helperText={errors.postalCode?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
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
                      label="Company Address"
                      multiline
                      rows={3}
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
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 5 }}>
          <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />}>
            Save Client
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => navigate('/clients')}>
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default AddClientPage;
