import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Button,
  Card,
  Typography,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Autocomplete,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';

import { DataTable } from '../../../components/DataTable';
import type { Column } from '../../../components/DataTable';
import { SearchFilters } from '../../../components/SearchFilters';
import { FormModal } from '../../../components/FormModal';
import {
  useGetClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from '../services/clientService';
import type { Client, ClientCreate, ClientUpdate } from '../types';
import { COUNTRIES, getCountryByName, validatePhoneNumber } from '../../../utils/countries';

// ==========================================
// HELPERS
// ==========================================

const UNIQUE_DIAL_CODES = Array.from(new Set(COUNTRIES.map((c) => c.dialCode))).sort((a, b) => {
  const numA = parseInt(a.replace(/[^\d-]/g, '')) || 0;
  const numB = parseInt(b.replace(/[^\d-]/g, '')) || 0;
  return numA - numB;
});

const parsePhoneField = (fullPhone?: string, defaultDialCode = '+91') => {
  if (!fullPhone) return { dialCode: defaultDialCode, number: '' };
  const parts = fullPhone.trim().split(' ');
  if (parts.length > 1) {
    return { dialCode: parts[0], number: parts.slice(1).join(' ') };
  }
  if (fullPhone.startsWith('+')) {
    const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sortedCountries) {
      if (fullPhone.startsWith(c.dialCode)) {
        return { dialCode: c.dialCode, number: fullPhone.substring(c.dialCode.length).trim() };
      }
    }
  }
  return { dialCode: defaultDialCode, number: fullPhone };
};

// ==========================================
// FORM SCHEMA & INTERFACES
// ==========================================

const clientSchema = z.object({
  name: z.string().min(1, 'Client Name is required'),
  clientCode: z.string().min(1, 'Client Code is required.'),
  industry: z.string().optional(),
  country: z.string().min(1, 'Please select a country.'),
  contactPerson: z.string().min(1, 'Contact Person is required.'),
  contactEmail: z
    .string()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.'),
  contactPhone: z.string().min(1, 'Primary contact number is required.'),
  countryCode: z.string().min(1, 'Country code is required.'),
  alternatePhone: z.string().optional(),
  alternateCountryCode: z.string().optional(),
  address: z.string().min(1, 'Address is required.'),
  notes: z.string().optional(),
  status: z.string().default('Active'),
  deactivationReason: z.string().optional(),
  additionalContacts: z.array(
    z.object({
      name: z.string().min(1, 'Name is required.'),
      email: z.string().min(1, 'Email is required.').email('Please enter a valid email address.'),
      phone: z.string().min(1, 'Phone is required.'),
      countryCode: z.string().default('+91'),
    })
  ).optional().default([]),
}).superRefine((data, ctx) => {
  // Validate primary phone: dynamic validation based on country/countryCode
  if (!data.contactPhone || data.contactPhone.trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Primary contact number is required.',
      path: ['contactPhone'],
    });
  } else {
    const res = validatePhoneNumber(data.contactPhone, data.country, data.countryCode);
    if (!res.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.message || 'Invalid primary contact number.',
        path: ['contactPhone'],
      });
    }
  }

  // Validate alternate phone if provided
  if (data.alternatePhone && data.alternatePhone.trim() !== '') {
    const res = validatePhoneNumber(data.alternatePhone, undefined, data.alternateCountryCode);
    if (!res.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.message || 'Invalid alternate phone number.',
        path: ['alternatePhone'],
      });
    }
  }

  // Validate deactivation reason if inactive
  if (data.status === 'Inactive') {
    if (!data.deactivationReason || data.deactivationReason.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Deactivation reason is required.',
        path: ['deactivationReason'],
      });
    }
  }

  // Validate additional contacts
  if (data.additionalContacts && data.additionalContacts.length > 0) {
    data.additionalContacts.forEach((ac, idx) => {
      if (!ac.name || ac.name.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Contact person name is required.',
          path: ['additionalContacts', idx, 'name'],
        });
      }
      if (!ac.email || ac.email.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Email is required.',
          path: ['additionalContacts', idx, 'email'],
        });
      }
      if (!ac.phone || ac.phone.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Phone number is required.',
          path: ['additionalContacts', idx, 'phone'],
        });
      } else {
        const res = validatePhoneNumber(ac.phone, undefined, ac.countryCode);
        if (!res.valid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: res.message || 'Invalid phone number.',
            path: ['additionalContacts', idx, 'phone'],
          });
        }
      }
    });
  }
});

interface AdditionalContactFormValue {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
}

interface ClientFormValues {
  name: string;
  clientCode: string;
  industry: string;
  country: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  countryCode: string;
  alternatePhone: string;
  alternateCountryCode: string;
  address: string;
  notes: string;
  status: string;
  deactivationReason: string;
  additionalContacts: AdditionalContactFormValue[];
}

const FORM_ID = 'client-form';

// ==========================================
// CLIENT FORM CONTENT
// ==========================================

interface ClientFormProps {
  isEdit?: boolean;
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (data: ClientFormValues) => void;
}

const ClientFormContent: React.FC<ClientFormProps> = ({ isEdit, defaultValues, onSubmit }) => {
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as any,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      clientCode: '',
      industry: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      countryCode: '+91',
      alternatePhone: '',
      alternateCountryCode: '+91',
      country: '',
      address: '',
      notes: '',
      status: 'Active',
      deactivationReason: '',
      additionalContacts: [],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'additionalContacts',
  });

  const watchedCountry = watch('country');
  const watchedCountryCode = watch('countryCode');
  const watchedAltCountryCode = watch('alternateCountryCode');
  const watchedAdditionalContacts = watch('additionalContacts') || [];

  const primaryCountryObj = getCountryByName(watchedCountry) || COUNTRIES.find((c) => c.dialCode === watchedCountryCode);
  const primaryMaxLength = primaryCountryObj?.maxLength || 15;

  const altCountryObj = COUNTRIES.find((c) => c.dialCode === watchedAltCountryCode);
  const altMaxLength = altCountryObj?.maxLength || 15;

  // Automatically update primary and alternate country codes when country changes
  useEffect(() => {
    if (watchedCountry) {
      const countryObj = getCountryByName(watchedCountry);
      if (countryObj) {
        setValue('countryCode', countryObj.dialCode, { shouldValidate: true });
        const currentAlt = getValues('alternateCountryCode');
        if (!currentAlt || currentAlt === '+91') {
          setValue('alternateCountryCode', countryObj.dialCode, { shouldValidate: true });
        }
      }
    }
  }, [watchedCountry, setValue, getValues]);

  // Dialog states for status changes
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [tempReason, setTempReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  // Get current status to show/hide/revert switch
  const statusValue = watch('status');

  return (
    <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate>
      {isEdit && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={statusValue === 'Active'}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (!checked) {
                      setTempReason('');
                      setReasonError('');
                      setDeactivateOpen(true);
                    } else {
                      setReactivateOpen(true);
                    }
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Status: {statusValue}
                </Typography>
              }
            />
            {statusValue === 'Inactive' && getValues('deactivationReason') ? (
              <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'error.main', fontWeight: 500 }}>
                Deactivation Reason: {getValues('deactivationReason')}
              </Typography>
            ) : null}
          </Stack>
        </Box>
      )}

      <Grid container spacing={2}>
        {/* Row 1: Client Code* and Client Name* */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="clientCode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Client Code *"
                fullWidth
                size="small"
                error={!!errors.clientCode}
                helperText={errors.clientCode?.message}
                slotProps={{ inputLabel: { shrink: true } }}
                disabled={isEdit}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Client / Company Name *"
                fullWidth
                size="small"
                error={!!errors.name}
                helperText={errors.name?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        {/* Row 2: Industry and Country* (Dropdown) */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="industry"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Industry"
                fullWidth
                size="small"
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
              <Autocomplete
                options={COUNTRIES.map((c) => c.name)}
                value={field.value || null}
                onChange={(_, newValue) => {
                  const val = newValue || '';
                  field.onChange(val);
                  if (val) {
                    const countryObj = getCountryByName(val);
                    if (countryObj) {
                      setValue('countryCode', countryObj.dialCode, { shouldValidate: true });
                    }
                  }
                }}
                openOnFocus
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Country *"
                    size="small"
                    error={!!errors.country}
                    helperText={errors.country?.message}
                  />
                )}
              />
            )}
          />
        </Grid>

        {/* Row 3: Contact Person* and Contact Email* */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="contactPerson"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Contact Person *"
                fullWidth
                size="small"
                error={!!errors.contactPerson}
                helperText={errors.contactPerson?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="contactEmail"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Contact Email *"
                type="email"
                fullWidth
                size="small"
                error={!!errors.contactEmail}
                helperText={errors.contactEmail?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        {/* Row 4: Country Code* and Primary Phone* */}
        <Grid size={{ xs: 4, sm: 3 }}>
          <Controller
            name="countryCode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Code *"
                fullWidth
                size="small"
                error={!!errors.countryCode}
                helperText={errors.countryCode?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              >
                {UNIQUE_DIAL_CODES.map((code) => (
                  <MenuItem key={code} value={code}>
                    {code}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid size={{ xs: 8, sm: 9 }}>
          <Controller
            name="contactPhone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Primary Phone *"
                fullWidth
                size="small"
                error={!!errors.contactPhone}
                helperText={errors.contactPhone?.message}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { maxLength: primaryMaxLength },
                }}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, primaryMaxLength);
                  field.onChange(val);
                }}
              />
            )}
          />
        </Grid>

        {/* Row 5: Alternate Country Code and Alternate Phone (Optional) */}
        <Grid size={{ xs: 4, sm: 3 }}>
          <Controller
            name="alternateCountryCode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Alt Code"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              >
                {UNIQUE_DIAL_CODES.map((code) => (
                  <MenuItem key={code} value={code}>
                    {code}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid size={{ xs: 8, sm: 9 }}>
          <Controller
            name="alternatePhone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Alternate Phone (Optional)"
                fullWidth
                size="small"
                error={!!errors.alternatePhone}
                helperText={errors.alternatePhone?.message}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { maxLength: altMaxLength },
                }}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, altMaxLength);
                  field.onChange(val);
                }}
              />
            )}
          />
        </Grid>

        {/* Row 6: Address* */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Address *"
                fullWidth
                size="small"
                multiline
                rows={2}
                error={!!errors.address}
                helperText={errors.address?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        {/* Row 7: Notes */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Notes"
                fullWidth
                size="small"
                multiline
                rows={2}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        {/* Deactivation Reason (Conditional) */}
        {statusValue === 'Inactive' && (
          <Grid size={{ xs: 12 }}>
            <Controller
              name="deactivationReason"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Deactivation Reason *"
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  error={!!errors.deactivationReason}
                  helperText={errors.deactivationReason?.message}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>
        )}

        {/* Section: Additional Contacts */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ mt: 3, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Additional Contact Persons
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => append({ name: '', email: '', phone: '', countryCode: '+91' })}
            >
              Add Contact
            </Button>
          </Box>
          <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'background.neutral' }}>
            {fields.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                No additional contact persons added.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {fields.map((item, index) => (
                  <Grid container spacing={1} key={item.id} sx={{ alignItems: 'flex-start' }}>
                    <Grid size={{ xs: 12, sm: 3.5 }}>
                      <Controller
                        name={`additionalContacts.${index}.name`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Name *"
                            fullWidth
                            size="small"
                            error={!!errors.additionalContacts?.[index]?.name}
                            helperText={errors.additionalContacts?.[index]?.name?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3.5 }}>
                      <Controller
                        name={`additionalContacts.${index}.email`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Email *"
                            type="email"
                            fullWidth
                            size="small"
                            error={!!errors.additionalContacts?.[index]?.email}
                            helperText={errors.additionalContacts?.[index]?.email?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 4, sm: 1.5 }}>
                      <Controller
                        name={`additionalContacts.${index}.countryCode`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            label="Code *"
                            fullWidth
                            size="small"
                          >
                            {UNIQUE_DIAL_CODES.map((code) => (
                              <MenuItem key={code} value={code}>
                                {code}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2.5 }}>
                      <Controller
                        name={`additionalContacts.${index}.phone`}
                        control={control}
                        render={({ field }) => {
                          const acDialCode = watchedAdditionalContacts[index]?.countryCode || '+91';
                          const acCountryObj = COUNTRIES.find((c) => c.dialCode === acDialCode);
                          const acMaxLength = acCountryObj?.maxLength || 15;
                          return (
                            <TextField
                              {...field}
                              label="Phone *"
                              fullWidth
                              size="small"
                              error={!!errors.additionalContacts?.[index]?.phone}
                              helperText={errors.additionalContacts?.[index]?.phone?.message}
                              slotProps={{
                                htmlInput: { maxLength: acMaxLength },
                              }}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, acMaxLength);
                                field.onChange(val);
                              }}
                            />
                          );
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 2, sm: 1 }} sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                      <IconButton color="error" size="small" onClick={() => remove(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Deactivate Reason Dialog */}
      <Dialog open={deactivateOpen} onClose={() => setDeactivateOpen(false)} disableRestoreFocus maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Deactivate Client</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Please provide a reason for deactivating this client.
          </Typography>
          <TextField
            autoFocus
            label="Reason *"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={tempReason}
            onChange={(e) => {
              setTempReason(e.target.value);
              if (e.target.value.trim()) setReasonError('');
            }}
            error={!!reasonError}
            helperText={reasonError}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="inherit" size="small" onClick={() => setDeactivateOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => {
              if (!tempReason.trim()) {
                setReasonError('Deactivation reason is required.');
                return;
              }
              setValue('status', 'Inactive');
              setValue('deactivationReason', tempReason);
              setDeactivateOpen(false);
            }}
          >
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reactivate Confirmation Dialog */}
      <Dialog open={reactivateOpen} onClose={() => setReactivateOpen(false)} disableRestoreFocus maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reactivate Client</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Please provide a reason for reactivating this client.
          </Typography>
          <TextField
            autoFocus
            label="Reactivation Reason *"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={tempReason}
            onChange={(e) => {
              setTempReason(e.target.value);
              if (e.target.value.trim()) setReasonError('');
            }}
            error={!!reasonError}
            helperText={reasonError}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="inherit" size="small" onClick={() => setReactivateOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              if (!tempReason.trim()) {
                setReasonError('Reactivation reason is required.');
                return;
              }
              const currentNotes = getValues('notes') || '';
              const todayStr = new Date().toISOString().split('T')[0];
              const appendedNotes = currentNotes 
                ? `${currentNotes}\n[Reactivated on ${todayStr}. Reason: ${tempReason}]`
                : `[Reactivated on ${todayStr}. Reason: ${tempReason}]`;
              setValue('status', 'Active');
              setValue('deactivationReason', '');
              setValue('notes', appendedNotes);
              setReactivateOpen(false);
            }}
          >
            Reactivate
          </Button>
        </DialogActions>
      </Dialog>
    </form>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================

export const ClientListPage: React.FC = () => {
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, activeFilter]);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Build query params
  const isActiveParam =
    activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined;

  // Fetch all clients (up to 500) to support full client-side Excel-like column sorting and filtering
  const { data, isLoading } = useGetClients({
    skip: 0,
    limit: 500,
  });

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const allClients = data?.clients ?? [];

  const filteredClients = useMemo(() => {
    return allClients.filter((c) => {
      // General search filter
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const matches =
          c.name.toLowerCase().includes(q) ||
          c.clientCode.toLowerCase().includes(q) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
          (c.contactEmail && c.contactEmail.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // Status filter
      if (activeFilter === 'active' && c.status !== 'Active') return false;
      if (activeFilter === 'inactive' && c.status !== 'Inactive') return false;
      return true;
    });
  }, [allClients, debouncedSearch, activeFilter]);

  // ---- Handlers ----

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingClient(null);
  };

  const handleFormSubmit = (values: ClientFormValues) => {
    const primaryRes = validatePhoneNumber(values.contactPhone, values.country, values.countryCode);
    const contactPhoneFormatted = primaryRes.normalized || `${values.countryCode} ${values.contactPhone}`;

    let alternatePhoneFormatted: string | undefined = undefined;
    if (values.alternatePhone && values.alternatePhone.trim() !== '') {
      const altRes = validatePhoneNumber(values.alternatePhone, undefined, values.alternateCountryCode || values.countryCode);
      alternatePhoneFormatted = altRes.normalized || `${values.alternateCountryCode || values.countryCode} ${values.alternatePhone}`;
    }

    const additionalContactsFormatted = (values.additionalContacts || []).map((ac) => {
      const acRes = validatePhoneNumber(ac.phone, undefined, ac.countryCode);
      return {
        name: ac.name,
        email: ac.email,
        phone: acRes.normalized || `${ac.countryCode} ${ac.phone}`,
      };
    });

    const payload: ClientCreate = {
      name: values.name,
      clientCode: values.clientCode,
      industry: values.industry || undefined,
      contactPerson: values.contactPerson,
      contactEmail: values.contactEmail,
      contactPhone: contactPhoneFormatted,
      alternatePhone: alternatePhoneFormatted,
      additionalContacts: additionalContactsFormatted,
      country: values.country,
      address: values.address,
      notes: values.notes || undefined,
    };

    if (editingClient) {
      const updatePayload: ClientUpdate = {
        ...payload,
        status: values.status,
        deactivationReason: values.status === 'Inactive' ? values.deactivationReason : undefined,
        isActive: values.status === 'Active',
      };
      updateClient.mutate(
        { id: editingClient.id, data: updatePayload },
        {
          onSuccess: () => {
            showSnack('Client updated successfully.');
            handleCloseForm();
          },
          onError: (err) => showSnack(parseError(err), 'error'),
        }
      );
    } else {
      createClient.mutate(payload, {
        onSuccess: () => {
          showSnack('Client created successfully.');
          handleCloseForm();
        },
        onError: (err) => showSnack(parseError(err), 'error'),
      });
    }
  };



  // ---- Columns ----

  const columns: Column<Client>[] = [
    {
      id: 'clientCode',
      label: 'Client Code',
      getValue: (row) => row.clientCode || '—',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', color: 'text.secondary' }}>
          {row.clientCode || '—'}
        </Typography>
      ),
    },
    {
      id: 'name',
      label: 'Name',
      getValue: (row) => row.name,
      render: (row) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BusinessIcon sx={{ fontSize: 16, color: 'white' }} />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.name}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'industry',
      label: 'Industry',
      getValue: (row) => row.industry || '—',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.industry || '—'}
        </Typography>
      ),
    },
    {
      id: 'contactPerson',
      label: 'Contact Person',
      render: (row) => {
        const primary = row.contactPerson;
        const additionalCount = row.additionalContacts?.length || 0;
        if (!primary) return <Typography variant="body2">—</Typography>;
        return (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography variant="body2">{primary}</Typography>
            {additionalCount > 0 && (
              <Chip
                label={`+${additionalCount}`}
                size="small"
                variant="outlined"
                color="primary"
                title={row.additionalContacts?.map((c) => `${c.name} (${c.phone})`).join('\n')}
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
              />
            )}
          </Stack>
        );
      },
    },
    {
      id: 'contactEmail',
      label: 'Contact Email',
      render: (row) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          {row.contactEmail || '—'}
        </Typography>
      ),
    },
    {
      id: 'contactPhone',
      label: 'Phone',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.contactPhone || '—'}
        </Typography>
      ),
    },
    {
      id: 'country',
      label: 'Country',
      render: (row) => (
        <Typography variant="body2">{row.country || '—'}</Typography>
      ),
    },
    {
      id: 'projectCount',
      label: 'Projects',
      align: 'center',
      render: (row) => (
        <Chip
          label={row.projectCount}
          size="small"
          variant={row.projectCount > 0 ? 'filled' : 'outlined'}
          color={row.projectCount > 0 ? 'primary' : 'default'}
          sx={{ fontWeight: 600, minWidth: 36 }}
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => {
        const isClientActive = row.status === 'Active';
        if (isClientActive) {
          return <Chip label="Active" size="small" color="success" sx={{ fontWeight: 600 }} />;
        }

        const tooltipTitle = row.deactivationReason
          ? `Deactivated by: ${row.deactivatedBy || 'N/A'}\nDate: ${row.deactivatedAt ? new Date(row.deactivatedAt).toLocaleString() : 'N/A'}\nReason: ${row.deactivationReason}`
          : 'Inactive';

        return (
          <Chip
            label="Inactive"
            size="small"
            title={tooltipTitle}
            sx={{
              fontWeight: 600,
              bgcolor: 'error.lighter',
              color: 'error.main',
              border: '1px solid',
              borderColor: 'error.light',
              cursor: 'help',
            }}
          />
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
          <IconButton
            size="small"
            sx={{ color: 'text.secondary' }}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const isSubmitting = createClient.isPending || updateClient.isPending;

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Clients
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage client accounts and contact details
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add Client
        </Button>
      </Box>

      {/* Search + Filters */}
      <Card sx={{ p: 2, mb: 3 }}>
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
          }}
          searchPlaceholder="Search by name..."
          filters={[
            {
              value: activeFilter,
              placeholder: 'All Statuses',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
              onChange: (val) => setActiveFilter(val),
            },
          ]}
        />
      </Card>

      {/* Data Table */}
      <Card>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading clients...
            </Typography>
          </Box>
        ) : (
          <DataTable<Client>
            columns={columns}
            data={filteredClients}
            keyExtractor={(row) => row.id}
          />
        )}
      </Card>

      {/* Add / Edit Modal */}
      <FormModal
        open={formOpen}
        title={editingClient ? 'Edit Client' : 'Add Client'}
        onClose={handleCloseForm}
        formId={FORM_ID}
        maxWidth="md"
        submitText={editingClient ? 'Save Changes' : 'Create Client'}
        isSubmitDisabled={isSubmitting}
      >
        <ClientFormContent
          key={editingClient?.id ?? 'new'}
          isEdit={!!editingClient}
          defaultValues={
            editingClient
              ? (() => {
                  const primaryPhoneData = parsePhoneField(editingClient.contactPhone, '+91');
                  const alternatePhoneData = parsePhoneField(editingClient.alternatePhone, '+91');
                  const additionalContactsParsed = (editingClient.additionalContacts || []).map((ac) => {
                    const parsed = parsePhoneField(ac.phone, '+91');
                    return {
                      name: ac.name,
                      email: ac.email,
                      phone: parsed.number,
                      countryCode: parsed.dialCode,
                    };
                  });
                  return {
                    name: editingClient.name,
                    clientCode: editingClient.clientCode,
                    industry: editingClient.industry ?? '',
                    contactPerson: editingClient.contactPerson ?? '',
                    contactEmail: editingClient.contactEmail ?? '',
                    contactPhone: primaryPhoneData.number,
                    countryCode: primaryPhoneData.dialCode,
                    alternatePhone: alternatePhoneData.number,
                    alternateCountryCode: alternatePhoneData.dialCode,
                    country: editingClient.country ?? '',
                    address: editingClient.address ?? '',
                    notes: editingClient.notes ?? '',
                    status: editingClient.status || (editingClient.isActive ? 'Active' : 'Inactive'),
                    deactivationReason: editingClient.deactivationReason ?? '',
                    additionalContacts: additionalContactsParsed,
                  };
                })()
              : {
                  name: '',
                  clientCode: '',
                  industry: '',
                  contactPerson: '',
                  contactEmail: '',
                  contactPhone: '',
                  countryCode: '+91',
                  alternatePhone: '',
                  alternateCountryCode: '+91',
                  country: '',
                  address: '',
                  notes: '',
                  status: 'Active',
                  deactivationReason: '',
                  additionalContacts: [],
                }
          }
          onSubmit={handleFormSubmit}
        />
      </FormModal>


      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientListPage;
