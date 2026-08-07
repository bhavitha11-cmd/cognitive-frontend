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
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';

import {
  useGetEmployees,
  useGetDepartmentsLookup,
  useGetRoles,
  useCreateEmployee,
  useUpdateEmployee,
  useDeactivateEmployee,
  useBulkDeactivateEmployees,
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

  // Load reference data (auth-only reference lookup for departments)
  useGetDepartmentsLookup();
  useGetRoles();

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

  // Employee data (server-side pagination)
  const query = useGetEmployees({
    search: searchQuery || undefined,
    skip: page * rowsPerPage,
    limit: rowsPerPage,
    departmentId: deptFilter !== 'all' ? deptFilter : undefined,
    accountStatus: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee();
  const deactivateMut = useDeactivateEmployee();
  const bulkDeactivateMut = useBulkDeactivateEmployees();

  // Modals & Dialogs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [showBulkDeactivate, setShowBulkDeactivate] = useState(false);

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
      updateMut.mutate(
        { id: editingEmployee.id, data },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            showSnackbar('Employee updated successfully');
          },
          onError: (err: any) => {
            showSnackbar(parseError(err), 'error');
          },
        }
      );
    } else {
      const rawPassword = data.password;
      createMut.mutate(data, {
        onSuccess: (newEmpResponse: any) => {
          setIsModalOpen(false);
          showSnackbar('Employee created successfully');
          if (newEmpResponse) {
            setNewEmpDetails({
              name: `${newEmpResponse.firstName} ${newEmpResponse.lastName}`,
              username: newEmpResponse.username,
              email: newEmpResponse.email,
              password: rawPassword,
              employeeCode: newEmpResponse.employeeCode || newEmpResponse.id,
            });
            setIsCredsOpen(true);
          }
        },
        onError: (err: any) => {
          showSnackbar(parseError(err), 'error');
        },
      });
    }
  };

  const handleSingleDeactivate = () => {
    if (deactivatingId) {
      deactivateMut.mutate(deactivatingId, {
        onSuccess: () => {
          setDeactivatingId(null);
          showSnackbar('Employee account deactivated');
        },
        onError: (err: any) => {
          setDeactivatingId(null);
          showSnackbar(parseError(err), 'error');
        },
      });
    }
  };

  const handleBulkDeactivateConfirm = () => {
    bulkDeactivateMut.mutate(selectedIds, {
      onSuccess: () => {
        setSelectedIds([]);
        setShowBulkDeactivate(false);
        showSnackbar(`${selectedIds.length} employee(s) deactivated`);
      },
      onError: (err: any) => {
        showSnackbar(parseError(err), 'error');
      },
    });
  };

  // Helper mappings
  const getDeptName = (id: string) => departments.find((d) => d.id === id)?.name || '—';

  const getRoleNames = (ids: string[]) =>
    ids.map((id) => roles.find((r) => r.id === id)?.name || id);

  const getManagerName = (row: Employee) => {
    if (!row.reportingManagerId) return 'CEO';
    // Prefer a manager name provided directly by the API, if present.
    const apiName = (row as any).reportingManagerName as string | undefined;
    if (apiName) return apiName;
    // Otherwise fall back to resolving from the currently loaded page.
    const mgr = query.data?.employees?.find((e) => e.id === row.reportingManagerId);
    if (mgr) return `${mgr.firstName} ${mgr.lastName}`;
    // Manager isn't on this page and the API didn't include a name.
    return '—';
  };

  // Server-side filtered and paginated data
  const paginatedEmployees = query.data?.employees || [];
  const totalCount = query.data?.total ?? 0;

  const columns: Column<Employee>[] = [
    {
      id: 'id',
      label: 'Employee ID',
      getValue: (row) => row.employeeCode || row.id.slice(0, 8),
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {row.employeeCode || row.id.slice(0, 8)}
        </Typography>
      ),
    },
    {
      id: 'name',
      label: 'Name',
      getValue: (row) => {
        const full = `${row.firstName || ''} ${row.lastName || ''}`.trim();
        if (full) return full;
        if (row.displayName) return row.displayName;
        if (row.username) return row.username;
        if (row.email) return row.email;
        if (row.employeeCode) return row.employeeCode;
        return row.id ? row.id.slice(0, 8) : '';
      },
      render: (row) => {
        const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim();
        const mainText = fullName || row.displayName || row.username || row.email || row.employeeCode || (row.id ? row.id.slice(0, 8) : '');
        const subText = fullName ? row.email : undefined;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar src={row.profilePhoto} sx={{ width: 34, height: 34, fontSize: '0.8125rem' }}>
              {(row.firstName || mainText || 'E').charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {mainText}
              </Typography>
              {subText && (
                <Typography variant="caption" color="textSecondary">
                  {subText}
                </Typography>
              )}
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'departmentId',
      label: 'Department',
      getValue: (row) => getDeptName(row.departmentId),
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
      id: 'designationName',
      label: 'Designation',
      getValue: (row) => row.designationName || '—',
      render: (row) => (
        <Typography variant="body2">
          {row.designationName || '-'}
        </Typography>
      ),
    },
    {
      id: 'teamName',
      label: 'Team',
      getValue: (row) => row.teamName || '—',
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
      getValue: (row) => getRoleNames(row.roleIds).join(', ') || 'No roles',
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
      getValue: (row) => getManagerName(row),
      render: (row) => <Typography variant="body2">{getManagerName(row)}</Typography>,
    },
    {
      id: 'status',
      label: 'Status',
      getValue: (row) => row.status,
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
        onClick={() => setShowBulkDeactivate(true)}
      >
        Deactivate Selected
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
        {query.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {parseError(query.error)}
          </Alert>
        )}
        {query.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataTable
            columns={columns}
            data={paginatedEmployees}
            keyExtractor={(row) => row.id}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            bulkActions={bulkActionButtons}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        )}
      </Card>

      <FormModal
        open={isModalOpen}
        title={editingEmployee ? `Edit Employee` : 'Register New Employee'}
        onClose={() => setIsModalOpen(false)}
        formId="employee-form"
        submitText={editingEmployee ? 'Save Changes' : 'Create Employee'}
        maxWidth="md"
        isSubmitDisabled={createMut.isPending || updateMut.isPending}
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
        loading={deactivateMut.isPending}
        onConfirm={handleSingleDeactivate}
        onClose={() => setDeactivatingId(null)}
      />

      <ConfirmationDialog
        open={showBulkDeactivate}
        title="Bulk Deactivate"
        description={`Are you sure you want to deactivate all ${selectedIds.length} selected employee accounts? They will lose login access.`}
        confirmText="Deactivate All"
        severity="warning"
        loading={bulkDeactivateMut.isPending}
        onConfirm={handleBulkDeactivateConfirm}
        onClose={() => setShowBulkDeactivate(false)}
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
