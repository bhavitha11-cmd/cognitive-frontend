import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  FormLabel,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  useGetDesignations,
  useGetDepartments,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
} from '../services/hrService';
import { useHRStore } from '../store/useHRStore';
import { DataTable } from '../../../components/DataTable';
import type { Column } from '../../../components/DataTable';
import { SearchFilters } from '../../../components/SearchFilters';
import type { FilterOption } from '../../../components/SearchFilters';
import { StatusBadge } from '../../../components/StatusBadge';
import { FormModal } from '../../../components/FormModal';
import { ConfirmationDialog } from '../../../components/ConfirmationDialog';
import { TableSkeleton } from '../../../components/LoadingSkeleton';
import { EmptyState } from '../../../components/EmptyState';
import { parseError } from '../../../utils/api';
import type { Designation } from '../types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const designationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code must be max 20 characters'),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  level: z.coerce.number().int().positive().optional().or(z.literal(0)).transform((v) => v || undefined),
  status: z.enum(['Active', 'Inactive']),
});

type DesignationFormInputs = z.infer<typeof designationSchema>;

interface DesignationFormProps {
  initialValues?: Designation;
  formId: string;
  onSubmit: (data: DesignationFormInputs) => void;
  departments: Array<{ id: string; name: string }>;
}

const DesignationForm: React.FC<DesignationFormProps> = ({ initialValues, formId, onSubmit, departments }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DesignationFormInputs>({
    resolver: zodResolver(designationSchema) as any,
    defaultValues: {
      name: initialValues?.name || '',
      code: initialValues?.code || '',
      description: initialValues?.description || '',
      departmentId: initialValues?.departmentId || '',
      level: initialValues?.level || ('' as any),
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
                label="Designation Name *"
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
                label="Code *"
                placeholder="e.g. SWE, PM, HR_MGR"
                fullWidth
                size="small"
                error={!!errors.code}
                helperText={errors.code?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600 }}>Department</FormLabel>
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select {...field} displayEmpty>
                  <MenuItem value="">-- No Department --</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="level"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Level (Hierarchy)"
                placeholder="e.g. 1 = entry, 10 = exec"
                fullWidth
                size="small"
                error={!!errors.level}
                helperText={errors.level?.message || 'Optional numeric hierarchy level'}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1 } }}
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
                rows={2}
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
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
          </FormControl>
        </Grid>
      </Grid>
    </form>
  );
};

export const DesignationListPage: React.FC = () => {
  useGetDepartments();

  const { data: designations = [], isLoading, isError } = useGetDesignations();
  const createMut = useCreateDesignation();
  const updateMut = useUpdateDesignation();
  const deleteMut = useDeleteDesignation();

  const departments = useHRStore((state) => state.departments);

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<Designation | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: any, severity: 'success' | 'error' = 'success') => {
    let msgStr = '';
    if (typeof message === 'string') {
      msgStr = message;
    } else {
      msgStr = parseError(message);
    }
    setSnackbar({ open: true, message: msgStr, severity });
  };

  const handleOpenCreate = () => {
    setEditingDesignation(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: Designation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDesignation(row);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: DesignationFormInputs) => {
    const payload: Omit<Designation, 'id' | 'createdDate'> = {
      name: data.name,
      code: data.code,
      description: data.description,
      departmentId: data.departmentId || undefined,
      level: data.level,
      status: data.status,
    };

    if (editingDesignation) {
      console.log('[Frontend] Submitting designation update for:', editingDesignation.id, payload);
      updateMut.mutate(
        { id: editingDesignation.id, data: payload },
        {
          onSuccess: (updatedDesg) => {
            console.log('[Frontend] Designation updated successfully:', updatedDesg);
            setIsModalOpen(false);
            showSnackbar('Designation updated successfully');
          },
          onError: (err: any) => {
            console.error('[Frontend] Failed to update designation:', err);
            showSnackbar(parseError(err), 'error');
          },
        }
      );
    } else {
      console.log('[Frontend] Submitting new designation creation:', payload);
      createMut.mutate(payload, {
        onSuccess: (newDesg) => {
          console.log('[Frontend] Designation created successfully:', newDesg);
          setIsModalOpen(false);
          showSnackbar('Designation created successfully');
        },
        onError: (err: any) => {
          console.error('[Frontend] Failed to create designation:', err);
          showSnackbar(parseError(err), 'error');
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deletingId) return;
    console.log('[Frontend] Initiating designation deletion for ID:', deletingId);
    deleteMut.mutate(deletingId, {
      onSuccess: () => {
        console.log('[Frontend] Designation deleted successfully, ID:', deletingId);
        setDeletingId(null);
        showSnackbar('Designation deleted');
      },
      onError: (err: any) => {
        console.error('[Frontend] Failed to delete designation:', err);
        setDeletingId(null);
        showSnackbar(parseError(err), 'error');
      },
    });
  };

  const getDeptName = (id?: string) =>
    id ? departments.find((d) => d.id === id)?.name || '—' : '—';

  const filtered = designations.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = deptFilter === 'all' || d.departmentId === deptFilter;
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const columns: Column<Designation>[] = [
    {
      id: 'code',
      label: 'Code',
      getValue: (row) => row.code,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
          {row.code}
        </Typography>
      ),
    },
    {
      id: 'name',
      label: 'Designation',
      getValue: (row) => row.name,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.name}</Typography>,
    },
    {
      id: 'departmentId',
      label: 'Department',
      getValue: (row) => getDeptName(row.departmentId),
      render: (row) => <Typography variant="body2">{getDeptName(row.departmentId)}</Typography>,
    },
    {
      id: 'level',
      label: 'Level',
      getValue: (row) => row.level ? `L${row.level}` : '—',
      render: (row) => (
        row.level ? (
          <Chip label={`L${row.level}`} size="small" variant="outlined" />
        ) : (
          <Typography variant="caption" color="textSecondary">—</Typography>
        )
      ),
    },
    {
      id: 'description',
      label: 'Description',
      render: (row) => (
        <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.description || '—'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <IconButton size="small" onClick={(e) => handleOpenEdit(row, e)} sx={{ color: 'text.secondary' }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeletingId(row.id); }} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const filterConfigs: FilterOption[] = [
    {
      value: deptFilter,
      placeholder: 'All Departments',
      onChange: (val) => { setDeptFilter(val); setPage(0); },
      options: departments.map((d) => ({ value: d.id, label: d.name })),
    },
    {
      value: statusFilter,
      placeholder: 'All Statuses',
      onChange: (val) => { setStatusFilter(val); setPage(0); },
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
      ],
    },
  ];

  if (isLoading) return <TableSkeleton />;
  if (isError) return (
    <Box sx={{ p: 3 }}>
      <Typography color="error">Failed to load designations. Check that the backend is running.</Typography>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Designation Management
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} size="small" onClick={handleOpenCreate}>
          Add Designation
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={(q) => { setSearchQuery(q); setPage(0); }}
          searchPlaceholder="Search by name or code..."
          filters={filterConfigs}
        />
      </Card>

      <Card sx={{ p: 2 }}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No designations found"
            description="Create your first designation to start organizing employee roles."
            actionText="Add Designation"
            onAction={handleOpenCreate}
          />
        ) : (
          <DataTable
            columns={columns}
            data={paginated}
            keyExtractor={(row) => row.id}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={filtered.length}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        )}
      </Card>

      <FormModal
        open={isModalOpen}
        title={editingDesignation ? 'Edit Designation' : 'Create Designation'}
        onClose={() => setIsModalOpen(false)}
        formId="designation-form"
        submitText={editingDesignation ? 'Save Changes' : 'Create Designation'}
        maxWidth="sm"
      >
        <DesignationForm
          formId="designation-form"
          initialValues={editingDesignation}
          onSubmit={handleFormSubmit}
          departments={departments}
        />
      </FormModal>

      <ConfirmationDialog
        open={deletingId !== null}
        title="Delete Designation"
        description="Are you sure you want to delete this designation? Employees currently assigned to it will lose their designation."
        confirmText="Delete"
        severity="error"
        onConfirm={handleDelete}
        onClose={() => setDeletingId(null)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DesignationListPage;
