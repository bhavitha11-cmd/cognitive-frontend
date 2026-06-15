import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import type { Client, ClientCreate } from '../types';
import { parseError } from '../../../utils/api';

// ==========================================
// FORM SCHEMA
// ==========================================

const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  clientCode: z.string().optional(),
  industry: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  contactPhone: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

const FORM_ID = 'client-form';

// ==========================================
// CLIENT FORM CONTENT
// ==========================================

interface ClientFormProps {
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (data: ClientFormValues) => void;
}

const ClientFormContent: React.FC<ClientFormProps> = ({ defaultValues, onSubmit }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      clientCode: '',
      industry: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      country: '',
      address: '',
      notes: '',
      ...defaultValues,
    },
  });

  return (
    <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid container spacing={2}>
        {/* Name */}
        <Grid size={{ xs: 12, sm: 8 }}>
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

        {/* Client Code */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="clientCode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Client Code"
                fullWidth
                size="small"
                placeholder="Auto-generated if blank"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        {/* Industry */}
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

        {/* Country */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Country"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        {/* Contact Person */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="contactPerson"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Contact Person"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        {/* Contact Email */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="contactEmail"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Contact Email"
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

        {/* Contact Phone */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="contactPhone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Contact Phone"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        {/* Address */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Address"
                fullWidth
                size="small"
                multiline
                rows={2}
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
                fullWidth
                size="small"
                multiline
                rows={2}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
      </Grid>
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

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

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

  const { data, isLoading } = useGetClients({
    skip: page * rowsPerPage,
    limit: rowsPerPage,
    search: debouncedSearch || undefined,
    isActive: isActiveParam,
  });

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const clients = data?.clients ?? [];
  const totalCount = data?.total ?? 0;

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
    const payload: ClientCreate = {
      name: values.name,
      clientCode: values.clientCode || undefined,
      industry: values.industry || undefined,
      contactPerson: values.contactPerson || undefined,
      contactEmail: values.contactEmail || undefined,
      contactPhone: values.contactPhone || undefined,
      country: values.country || undefined,
      address: values.address || undefined,
      notes: values.notes || undefined,
    };

    if (editingClient) {
      updateClient.mutate(
        { id: editingClient.id, data: payload },
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

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteClient.mutate(deleteTarget.id, {
      onSuccess: () => {
        showSnack('Client deleted.');
        setDeleteTarget(null);
      },
      onError: (err) => {
        showSnack(parseError(err), 'error');
        setDeleteTarget(null);
      },
    });
  };

  // ---- Columns ----

  const columns: Column<Client>[] = [
    {
      id: 'clientCode',
      label: 'Client Code',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', color: 'text.secondary' }}>
          {row.clientCode || '—'}
        </Typography>
      ),
    },
    {
      id: 'name',
      label: 'Name',
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1}>
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
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.industry || '—'}
        </Typography>
      ),
    },
    {
      id: 'contactPerson',
      label: 'Contact Person',
      render: (row) => (
        <Typography variant="body2">{row.contactPerson || '—'}</Typography>
      ),
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
      id: 'isActive',
      label: 'Status',
      render: (row) =>
        row.isActive ? (
          <Chip label="Active" size="small" color="success" sx={{ fontWeight: 600 }} />
        ) : (
          <Chip label="Inactive" size="small" sx={{ fontWeight: 600, bgcolor: 'grey.200', color: 'grey.700' }} />
        ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
          <IconButton
            size="small"
            color="error"
            disabled={row.projectCount > 0}
            title={row.projectCount > 0 ? 'Cannot delete: client has active projects' : 'Delete client'}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
          >
            <DeleteIcon fontSize="small" />
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
            data={clients}
            keyExtractor={(row) => row.id}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={(newPage) => setPage(newPage)}
            onRowsPerPageChange={(newRpp) => {
              setRowsPerPage(newRpp);
              setPage(0);
            }}
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
          defaultValues={
            editingClient
              ? {
                  name: editingClient.name,
                  clientCode: editingClient.clientCode,
                  industry: editingClient.industry ?? '',
                  contactPerson: editingClient.contactPerson ?? '',
                  contactEmail: editingClient.contactEmail ?? '',
                  contactPhone: editingClient.contactPhone ?? '',
                  country: editingClient.country ?? '',
                  address: editingClient.address ?? '',
                  notes: editingClient.notes ?? '',
                }
              : undefined
          }
          onSubmit={handleFormSubmit}
        />
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Client</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete{' '}
            <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" color="inherit" size="small" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={handleDeleteConfirm}
            disabled={deleteClient.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
