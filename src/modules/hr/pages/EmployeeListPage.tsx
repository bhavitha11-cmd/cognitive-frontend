import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Card,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  useGetEmployees,
  useGetDepartments,
  useGetRoles,
  useCreateEmployee,
  useUpdateEmployee,
  useDeactivateEmployee,
  useDeleteEmployee,
  useBulkDeactivateEmployees,
  useBulkDeleteEmployees,
} from '../services/hrService';
import { useHRStore } from '../store/useHRStore';
import { DataTable } from '../../../components/DataTable';
import type { Column } from '../../../components/DataTable';
import { SearchFilters } from '../../../components/SearchFilters';
import type { FilterOption } from '../../../components/SearchFilters';
import { StatusBadge } from '../../../components/StatusBadge';
import { FormModal } from '../../../components/FormModal';
import { ConfirmationDialog } from '../../../components/ConfirmationDialog';
import { EmployeeForm } from '../components/EmployeeForm';
import { parseError } from '../../../utils/api';
import { CredentialsDialog } from '../../../components/CredentialsDialog';
import type { Employee } from '../types';

export const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();

  // Load reference data
  useGetDepartments();
  useGetRoles();

  // Employee data
  const query = useGetEmployees();
  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee();
  const deactivateMut = useDeactivateEmployee();
  const deleteMut = useDeleteEmployee();
  const bulkDeactivateMut = useBulkDeactivateEmployees();
  const bulkDeleteMut = useBulkDeleteEmployees();

  // Reference data from store
  const departments = useHRStore((state) => state.departments);
  const roles = useHRStore((state) => state.roles);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Dialogs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkActionType, setBulkActionType] = useState<'deactivate' | 'delete' | null>(null);

  // Credentials dialog
  const [isCredsOpen, setIsCredsOpen] = useState(false);
  const [newEmpDetails, setNewEmpDetails] = useState<{
    name: string;
    username: string;
    email: string;
    password?: string;
    employeeCode: string;
  } | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenCreateModal = () => {
    setEditingEmployee(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (editingEmployee) {
      console.log('[Frontend] Submitting employee update for:', editingEmployee.id, data);
      updateMut.mutate(
        { id: editingEmployee.id, data },
        {
          onSuccess: (updatedEmp) => {
            console.log('[Frontend] Employee updated successfully:', updatedEmp);
            setIsModalOpen(false);
            showSnackbar('Employee updated successfully');
          },
          onError: (err: any) => {
            console.error('[Frontend] Failed to update employee:', err);
            showSnackbar(parseError(err), 'error');
          },
        }
      );
    } else {
      const rawPassword = data.password;
      console.log('[Frontend] Submitting new employee creation:', data);
      createMut.mutate(data, {
        onSuccess: (newEmpResponse: any) => {
          console.log('[Frontend] Employee created successfully:', newEmpResponse);
          setIsModalOpen(false);
          showSnackbar('Employee created successfully');
          if (newEmpResponse) {
            setNewEmpDetails({
              name: `${newEmpResponse.firstName} ${newEmpResponse.lastName}`,
              username: newEmpResponse.username,
              email: newEmpResponse.email,
              password: rawPassword,
              employeeCode: newEmpResponse.id,
            });
            setIsCredsOpen(true);
          }
        },
        onError: (err: any) => {
          console.error('[Frontend] Failed to create employee:', err);
          showSnackbar(parseError(err), 'error');
        },
      });
    }
  };

  const handleSingleDeactivate = () => {
    if (deactivatingId) {
      console.log('[Frontend] Initiating single employee deactivation for ID:', deactivatingId);
      deactivateMut.mutate(deactivatingId, {
        onSuccess: (deactivatedEmp) => {
          console.log('[Frontend] Employee deactivated successfully:', deactivatedEmp);
          setDeactivatingId(null);
          showSnackbar('Employee account deactivated');
        },
        onError: (err: any) => {
          console.error('[Frontend] Failed to deactivate employee:', err);
          setDeactivatingId(null);
          showSnackbar(parseError(err), 'error');
        },
      });
    }
  };

  const handleSingleDelete = () => {
    if (deletingId) {
      console.log('[Frontend] Initiating single employee deletion for ID:', deletingId);
      deleteMut.mutate(deletingId, {
        onSuccess: () => {
          console.log('[Frontend] Employee record deleted successfully, ID:', deletingId);
          setDeletingId(null);
          setSelectedIds((prev) => prev.filter((id) => id !== deletingId));
          showSnackbar('Employee record deleted');
        },
        onError: (err: any) => {
          console.error('[Frontend] Failed to delete employee:', err);
          setDeletingId(null);
          showSnackbar(parseError(err), 'error');
        },
      });
    }
  };

  const handleBulkActionConfirm = () => {
    if (bulkActionType === 'deactivate') {
      console.log('[Frontend] Initiating bulk employee deactivation for IDs:', selectedIds);
      bulkDeactivateMut.mutate(selectedIds, {
        onSuccess: () => {
          console.log('[Frontend] Bulk employee deactivation succeeded for IDs:', selectedIds);
          setSelectedIds([]);
          setBulkActionType(null);
          showSnackbar(`${selectedIds.length} employee(s) deactivated`);
        },
        onError: (err: any) => {
          console.error('[Frontend] Failed to bulk deactivate employees:', err);
          showSnackbar(parseError(err), 'error');
        },
      });
    } else if (bulkActionType === 'delete') {
      console.log('[Frontend] Initiating bulk employee deletion for IDs:', selectedIds);
      bulkDeleteMut.mutate(selectedIds, {
        onSuccess: () => {
          console.log('[Frontend] Bulk employee deletion succeeded for IDs:', selectedIds);
          setSelectedIds([]);
          setBulkActionType(null);
          showSnackbar(`${selectedIds.length} employee(s) deleted`);
        },
        onError: (err: any) => {
          console.error('[Frontend] Failed to bulk delete employees:', err);
          showSnackbar(parseError(err), 'error');
        },
      });
    }
  };

  // Helper mappings
  const getDeptName = (id: string) => departments.find((d) => d.id === id)?.name || '—';

  const getRoleNames = (ids: string[]) =>
    ids.map((id) => roles.find((r) => r.id === id)?.name || id);

  const getManagerName = (id?: string) => {
    if (!id) return 'CEO';
    const mgr = query.data?.find((e) => e.id === id);
    return mgr ? `${mgr.firstName} ${mgr.lastName}` : 'CEO';
  };

  // Filtering
  const data = query.data || [];
  const filteredEmployees = data.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === 'all' || emp.departmentId === deptFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const paginatedEmployees = filteredEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const columns: Column<Employee>[] = [
    {
      id: 'id',
      label: 'Employee ID',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {row.id.slice(0, 8)}…
        </Typography>
      ),
    },
    {
      id: 'name',
      label: 'Name',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={row.profilePhoto} sx={{ width: 34, height: 34, fontSize: '0.8125rem' }}>
            {row.firstName.charAt(0)}{row.lastName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {row.firstName} {row.lastName}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'departmentId',
      label: 'Department',
      render: (row) => (
        <Typography variant="body2">
          {getDeptName(row.departmentId)}
          {row.isDepartmentHead && (
            <Typography variant="caption" color="primary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.6875rem' }}>
              (Head)
            </Typography>
          )}
        </Typography>
      ),
    },
    {
      id: 'teamName',
      label: 'Team',
      render: (row) => (
        <Typography variant="body2">
          {row.teamName || '-'}
          {row.teamName && row.roleInTeam === 'LEAD' && (
            <Typography variant="caption" color="secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.6875rem' }}>
              (Lead)
            </Typography>
          )}
        </Typography>
      ),
    },
    {
      id: 'roles',
      label: 'Assigned Roles',
      render: (row) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 220 }}>
          {getRoleNames(row.roleIds).map((name, index) => (
            <Chip key={index} label={name} size="small" sx={{ fontSize: '0.6875rem' }} />
          ))}
          {row.roleIds.length === 0 && (
            <Typography variant="caption" color="textSecondary">No roles</Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'manager',
      label: 'Manager',
      render: (row) => <Typography variant="body2">{getManagerName(row.reportingManagerId)}</Typography>,
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
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              navigate(`/hr/employees/${row.id}`);
            }}
            sx={{ color: 'primary.main' }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.currentTarget.blur();
              handleOpenEditModal(row, e);
            }}
            sx={{ color: 'text.secondary' }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              setDeactivatingId(row.id);
            }}
            disabled={row.status === 'TERMINATED' || row.status === 'RESIGNED'}
            sx={{ color: 'warning.main' }}
          >
            <BlockIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              setDeletingId(row.id);
            }}
            sx={{ color: 'error.main' }}
          >
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
        { value: 'ACTIVE', label: 'Active' },
        { value: 'PROBATION', label: 'Probation' },
        { value: 'NOTICE_PERIOD', label: 'Notice Period' },
        { value: 'ON_LEAVE', label: 'On Leave' },
        { value: 'SUSPENDED', label: 'Suspended' },
        { value: 'RESIGNED', label: 'Resigned' },
        { value: 'TERMINATED', label: 'Terminated' },
      ],
    },
  ];

  const bulkActionButtons = (
    <Stack direction="row" spacing={1}>
      <Button
        variant="contained"
        color="warning"
        size="small"
        startIcon={<BlockIcon />}
        onClick={() => setBulkActionType('deactivate')}
      >
        Deactivate Selected
      </Button>
      <Button
        variant="contained"
        color="error"
        size="small"
        startIcon={<DeleteIcon />}
        onClick={() => setBulkActionType('delete')}
      >
        Delete Selected
      </Button>
    </Stack>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Employee Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={(e) => { e.currentTarget.blur(); handleOpenCreateModal(); }}
          size="small"
        >
          Add Employee
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={(q) => { setSearchQuery(q); setPage(0); }}
          searchPlaceholder="Search employees by ID, name, or email..."
          filters={filterConfigs}
        />
      </Card>

      <Card sx={{ p: 2 }}>
        <DataTable
          columns={columns}
          data={paginatedEmployees}
          keyExtractor={(row) => row.id}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          bulkActions={bulkActionButtons}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={filteredEmployees.length}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </Card>

      <FormModal
        open={isModalOpen}
        title={editingEmployee ? `Edit Employee` : 'Register New Employee'}
        onClose={() => setIsModalOpen(false)}
        formId="employee-form"
        submitText={editingEmployee ? 'Save Changes' : 'Create Employee'}
        maxWidth="md"
      >
        <EmployeeForm
          formId="employee-form"
          initialValues={editingEmployee}
          onSubmit={handleFormSubmit}
        />
      </FormModal>

      <ConfirmationDialog
        open={deactivatingId !== null}
        title="Deactivate Account"
        description="Are you sure you want to deactivate this employee's account? They will lose access to login to the system."
        confirmText="Deactivate"
        severity="warning"
        onConfirm={handleSingleDeactivate}
        onClose={() => setDeactivatingId(null)}
      />

      <ConfirmationDialog
        open={deletingId !== null}
        title="Delete Employee Record"
        description="Are you sure you want to permanently delete this employee record? All logs and entries associated will remain unassigned."
        confirmText="Delete"
        severity="error"
        onConfirm={handleSingleDelete}
        onClose={() => setDeletingId(null)}
      />

      <ConfirmationDialog
        open={bulkActionType !== null}
        title={bulkActionType === 'deactivate' ? 'Bulk Deactivate' : 'Bulk Delete'}
        description={`Are you sure you want to ${bulkActionType} all ${selectedIds.length} selected employee records?`}
        confirmText={bulkActionType === 'deactivate' ? 'Deactivate All' : 'Delete All'}
        severity={bulkActionType === 'deactivate' ? 'warning' : 'error'}
        onConfirm={handleBulkActionConfirm}
        onClose={() => setBulkActionType(null)}
      />

      {newEmpDetails && (
        <CredentialsDialog
          open={isCredsOpen}
          onClose={() => {
            setIsCredsOpen(false);
            setNewEmpDetails(null);
          }}
          employeeName={newEmpDetails.name}
          username={newEmpDetails.username}
          email={newEmpDetails.email}
          password={newEmpDetails.password}
          employeeCode={newEmpDetails.employeeCode}
        />
      )}

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

export default EmployeeListPage;
