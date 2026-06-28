import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  IconButton,
  Breadcrumbs,
  Link,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import { useHRStore } from '../store/useHRStore';
import {
  useGetDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '../services/hrService';
import { DataTable } from '../../../components/DataTable';
import type { Column } from '../../../components/DataTable';
import { SearchFilters } from '../../../components/SearchFilters';
import type { FilterOption } from '../../../components/SearchFilters';
import { StatusBadge } from '../../../components/StatusBadge';
import { FormModal } from '../../../components/FormModal';
import { ConfirmationDialog } from '../../../components/ConfirmationDialog';
import { TableSkeleton } from '../../../components/LoadingSkeleton';
import { EmptyState } from '../../../components/EmptyState';
import { DepartmentForm } from '../components/DepartmentForm';
import { parseError } from '../../../utils/api';
import type { Department } from '../types';

export const DepartmentListPage: React.FC = () => {
  const query = useGetDepartments();
  const createMut = useCreateDepartment();
  const updateMut = useUpdateDepartment();
  const deleteMut = useDeleteDepartment();

  const allDepartments = useHRStore((state) => state.departments);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals / Dialogs / Feedback States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | undefined>(undefined);
  const [viewingDept, setViewingDept] = useState<Department | null>(null);
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleOpenCreateModal = () => {
    setEditingDept(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    const { ...deptData } = data;
    if (editingDept) {
      console.log('[Frontend] Submitting department update for:', editingDept.id, deptData);
      updateMut.mutate(
        { id: editingDept.id, data: deptData },
        {
          onSuccess: (updatedDept) => {
            console.log('[Frontend] Department updated successfully:', updatedDept);
            setIsModalOpen(false);
            setSnackbar({
              open: true,
              message: 'Department updated successfully.',
              severity: 'success',
            });
          },
          onError: (err: any) => {
            console.error('[Frontend] Failed to update department:', err);
            const msg = parseError(err);
            setSnackbar({
              open: true,
              message: msg,
              severity: 'error',
            });
          },
        }
      );
    } else {
      console.log('[Frontend] Submitting new department creation:', deptData);
      createMut.mutate(deptData, {
        onSuccess: (newDept) => {
          console.log('[Frontend] Department created successfully:', newDept);
          setIsModalOpen(false);
          setSnackbar({
            open: true,
            message: 'Department created successfully.',
            severity: 'success',
          });
        },
        onError: (err: any) => {
          console.error('[Frontend] Failed to create department:', err);
          const msg = parseError(err);
          setSnackbar({
            open: true,
            message: msg,
            severity: 'error',
          });
        },
      });
    }
  };

  const handleToggleStatus = (dept: Department) => {
    const newStatus = dept.status === 'Active' ? 'Inactive' : 'Active';
    console.log(`[Frontend] Toggling status for department ${dept.id} to ${newStatus}`);
    updateMut.mutate(
      { id: dept.id, data: { status: newStatus } },
      {
        onSuccess: (updatedDept) => {
          console.log('[Frontend] Department status toggled successfully:', updatedDept);
          setSnackbar({
            open: true,
            message: `Department "${dept.name}" status updated to ${newStatus}.`,
            severity: 'success',
          });
        },
        onError: (err: any) => {
          console.error('[Frontend] Failed to toggle department status:', err);
          const msg = parseError(err);
          setSnackbar({
            open: true,
            message: msg,
            severity: 'error',
          });
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (deletingDeptId) {
      console.log('[Frontend] Initiating department deletion for ID:', deletingDeptId);
      deleteMut.mutate(deletingDeptId, {
        onSuccess: () => {
          console.log('[Frontend] Department deleted successfully, ID:', deletingDeptId);
          setDeletingDeptId(null);
          setSnackbar({
            open: true,
            message: 'Department deleted successfully.',
            severity: 'success',
          });
        },
        onError: (err: any) => {
          console.error('[Frontend] Failed to delete department:', err);
          const msg = parseError(err);
          setSnackbar({
            open: true,
            message: msg,
            severity: 'error',
          });
        },
      });
    }
  };

  // Filter & Search Logic
  const filteredDepartments = allDepartments.filter((dept) => {
    const matchesSearch =
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dept.description && dept.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || dept.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginatedDepartments = filteredDepartments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const columns: Column<Department>[] = [
    {
      id: 'code',
      label: 'Department Code',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {row.code}
        </Typography>
      ),
    },
    {
      id: 'name',
      label: 'Department Name',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.name}
        </Typography>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      render: (row) => (
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{
            maxWidth: 250,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.description || '-'}
        </Typography>
      ),
    },
    {
      id: 'departmentHeadName',
      label: 'Department Head',
      render: (row) => (
        <Typography variant="body2">{row.departmentHeadName || '-'}</Typography>
      ),
    },
    {
      id: 'employeeCount',
      label: 'Employee Count',
      align: 'center',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.employeeCount}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'createdDate',
      label: 'Created Date',
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.currentTarget.blur();
              setViewingDept(row);
            }}
            title="View Details"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.currentTarget.blur();
              handleOpenEditModal(row);
            }}
            title="Edit Department"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.currentTarget.blur();
              handleToggleStatus(row);
            }}
            title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
            color={row.status === 'Active' ? 'warning' : 'success'}
          >
            {row.status === 'Active' ? (
              <ToggleOnIcon fontSize="small" />
            ) : (
              <ToggleOffIcon fontSize="small" />
            )}
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.currentTarget.blur();
              setDeletingDeptId(row.id);
            }}
            sx={{ color: 'error.main' }}
            title="Delete Department"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const filterConfigs: FilterOption[] = [
    {
      value: statusFilter,
      label: 'Status',
      placeholder: 'All Statuses',
      onChange: (val) => {
        setStatusFilter(val);
        setPage(0);
      },
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
      ],
    },
  ];

  if (query.isLoading) {
    return <TableSkeleton rows={5} />;
  }

  // Handle empty state (zero records total in DB)
  if (allDepartments.length === 0) {
    return (
      <Box>
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          <Link underline="hover" color="inherit" href="/">
            Home
          </Link>
          <Link underline="hover" color="inherit" href="/hr/employees">
            HR
          </Link>
          <Typography color="text.primary">Departments</Typography>
        </Breadcrumbs>

        {/* Title block */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Departments
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={(e) => {
              e.currentTarget.blur();
              handleOpenCreateModal();
            }}
            size="small"
          >
            Create Department
          </Button>
        </Box>

        {/* Empty State Component */}
        <Card sx={{ p: 4 }}>
          <EmptyState
            title="No Departments Found"
            description="Create your first department to start building the organization structure."
            actionText="+ Create Department"
            onAction={handleOpenCreateModal}
          />
        </Card>

        {/* Create Form Modal */}
        <FormModal
          open={isModalOpen}
          title="Create New Department"
          onClose={() => setIsModalOpen(false)}
          formId="department-form"
          submitText="Create Department"
        >
          <DepartmentForm
            formId="department-form"
            onSubmit={handleFormSubmit}
          />
        </FormModal>

        {/* Snackbar notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <Link underline="hover" color="inherit" href="/">
          Home
        </Link>
        <Link underline="hover" color="inherit" href="/hr/employees">
          HR
        </Link>
        <Typography color="text.primary">Departments</Typography>
      </Breadcrumbs>

      {/* Title block */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Departments
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={(e) => {
            e.currentTarget.blur();
            handleOpenCreateModal();
          }}
          size="small"
        >
          Create Department
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ p: 2, mb: 3 }}>
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setPage(0);
          }}
          searchPlaceholder="Search departments by name, code, or description..."
          filters={filterConfigs}
        />
      </Card>

      {/* Table Card */}
      <Card sx={{ p: 2 }}>
        <DataTable
          columns={columns}
          data={paginatedDepartments}
          keyExtractor={(row) => row.id}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={filteredDepartments.length}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </Card>

      {/* Create / Edit Form Modal */}
      <FormModal
        open={isModalOpen}
        title={editingDept ? 'Edit Department' : 'Create New Department'}
        onClose={() => setIsModalOpen(false)}
        formId="department-form"
        submitText={editingDept ? 'Update Department' : 'Create Department'}
      >
        <DepartmentForm
          formId="department-form"
          initialValues={editingDept}
          onSubmit={handleFormSubmit}
        />
      </FormModal>

      {/* View Details Dialog */}
      <Dialog
        open={viewingDept !== null}
        onClose={() => setViewingDept(null)}
        maxWidth="sm"
        fullWidth
        disableRestoreFocus
      >
        {viewingDept && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>Department Details</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    DEPARTMENT CODE
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main', mt: 0.5 }}>
                    {viewingDept.code}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    DEPARTMENT NAME
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {viewingDept.name}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    DESCRIPTION
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {viewingDept.description || 'No description provided.'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    DEPARTMENT HEAD
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {viewingDept.departmentHeadName || 'Not Assigned'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    EMPLOYEE COUNT
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                    {viewingDept.employeeCount}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    STATUS
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <StatusBadge status={viewingDept.status} />
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    CREATED DATE
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {viewingDept.createdDate || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setViewingDept(null)} color="primary" variant="contained" size="small">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deletingDeptId !== null}
        title="Delete Department"
        description="Are you sure you want to permanently delete this department? This action cannot be undone and will delete all related designations and unassign employees."
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingDeptId(null)}
      />

      {/* Snackbar notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DepartmentListPage;
