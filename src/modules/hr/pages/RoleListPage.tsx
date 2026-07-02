import React, { useState } from 'react';
import { Box, Button, Card, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

import { useGetRoles, useCreateRole, useUpdateRole, useSetRolePermissions } from '../services/hrService';
import { DataTable } from '../../../components/DataTable';
import type { Column } from '../../../components/DataTable';
import { SearchFilters } from '../../../components/SearchFilters';
import type { FilterOption } from '../../../components/SearchFilters';
import { StatusBadge } from '../../../components/StatusBadge';
import { FormModal } from '../../../components/FormModal';
import { RoleForm } from '../components/RoleForm';
import type { Role } from '../types';

export const RoleListPage: React.FC = () => {
  const query = useGetRoles();
  const createMut = useCreateRole();
  const updateMut = useUpdateRole();
  const permMut = useSetRolePermissions();

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal / Dialog states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

  // Status Change Dialog States
  const [statusPromptOpen, setStatusPromptOpen] = useState(false);
  const [pendingRoleData, setPendingRoleData] = useState<any>(null);
  const [pendingStatus, setPendingStatus] = useState<'Active' | 'Inactive' | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [statusReasonError, setStatusReasonError] = useState('');

  // Event handlers
  const handleOpenCreateModal = () => {
    setEditingRole(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const executeRoleSave = (data: any) => {
    const { permissions, ...roleData } = data;
    if (editingRole) {
      console.log('[Frontend] Submitting role update for:', editingRole.id, roleData);
      updateMut.mutate({ id: editingRole.id, data: roleData }, {
        onSuccess: (updatedRole) => {
          console.log('[Frontend] Role updated successfully:', updatedRole);
          if (permissions) {
            console.log('[Frontend] Updating permissions for role:', editingRole.id, permissions);
            permMut.mutate({ id: editingRole.id, permissions }, {
              onSuccess: () => {
                console.log('[Frontend] Permissions updated successfully for role:', editingRole.id);
              },
              onError: (err: any) => {
                console.error('[Frontend] Failed to update permissions:', err?.response?.data || err);
              },
            });
          }
          setIsModalOpen(false);
        },
        onError: (err) => {
          console.error('[Frontend] Failed to update role:', err);
        }
      });
    } else {
      console.log('[Frontend] Submitting new role creation:', roleData);
      createMut.mutate(roleData, {
        onSuccess: (newRole) => {
          console.log('[Frontend] Role created successfully:', newRole);
          if (permissions && newRole?.id) {
            console.log('[Frontend] Assigning permissions to new role:', newRole.id, permissions);
            permMut.mutate({ id: newRole.id, permissions }, {
              onSuccess: () => {
                console.log('[Frontend] Permissions assigned successfully to new role:', newRole.id);
              }
            });
          }
          setIsModalOpen(false);
        },
        onError: (err) => {
          console.error('[Frontend] Failed to create role:', err);
        }
      });
    }
  };

  const handleFormSubmit = (data: any) => {
    const { permissions, ...roleData } = data;
    if (editingRole) {
      const statusChanged = editingRole.status !== roleData.status;
      if (statusChanged) {
        setPendingRoleData(data);
        setPendingStatus(roleData.status);
        setStatusReason('');
        setStatusReasonError('');
        setStatusPromptOpen(true);
        return;
      }
    }
    executeRoleSave(data);
  };

  const handleConfirmStatusChange = () => {
    if (!statusReason.trim()) {
      setStatusReasonError('Reason is required.');
      return;
    }
    if (!pendingRoleData) return;

    const currentDesc = pendingRoleData.description || '';
    const todayStr = new Date().toISOString().split('T')[0];
    const newDesc = currentDesc 
      ? `${currentDesc}\n[${pendingStatus === 'Inactive' ? 'Deactivated' : 'Reactivated'} on ${todayStr}. Reason: ${statusReason}]`
      : `[${pendingStatus === 'Inactive' ? 'Deactivated' : 'Reactivated'} on ${todayStr}. Reason: ${statusReason}]`;
    
    const finalData = {
      ...pendingRoleData,
      description: newDesc,
    };
    
    setStatusPromptOpen(false);
    executeRoleSave(finalData);
  };



  // Filtering roles
  const data = query.data || [];
  const filteredRoles = data.filter((role) => {
    const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || role.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginatedRoles = filteredRoles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const columns: Column<Role>[] = [
    {
      id: 'name',
      label: 'Role Name',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.name}</Typography>
          <Typography variant="caption" color="textSecondary" noWrap sx={{ display: 'block', maxWidth: 280 }}>
            {row.description}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'permissions',
      label: 'Permissions',
      render: (row) => {
        const pCount = row.permissions?.filter((p) => p.can_view || p.can_create || p.can_edit || p.can_delete || p.can_approve || p.can_export).length || 0;
        return (
          <Typography variant="body2" sx={{ fontSize: '0.75rem', color: pCount > 0 ? 'text.primary' : 'text.disabled' }}>
            {pCount > 0 ? `${pCount} module(s)` : 'None'}
          </Typography>
        );
      },
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
              handleOpenEditModal(row);
            }}
            sx={{ color: 'text.secondary' }}
          >
            <EditIcon fontSize="small" />
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

  return (
    <Box>
      {/* Title block */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Roles Management
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
          Add Role
        </Button>
      </Box>

      {/* Filter toolbar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setPage(0);
          }}
          searchPlaceholder="Search roles by name or description..."
          filters={filterConfigs}
        />
      </Card>

      {/* Table grid */}
      <Card sx={{ p: 2 }}>
        <DataTable
          columns={columns}
          data={paginatedRoles}
          keyExtractor={(row) => row.id}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={filteredRoles.length}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </Card>

      {/* Add / Edit Form Modal */}
      <FormModal
        open={isModalOpen}
        title={editingRole ? 'Edit Role' : 'Create New Role'}
        onClose={() => setIsModalOpen(false)}
        formId="role-form"
        submitText={editingRole ? 'Update Role' : 'Create Role'}
      >
        <RoleForm
          key={editingRole?.id ?? 'new'}
          formId="role-form"
          initialValues={editingRole}
          onSubmit={handleFormSubmit}
        />
      </FormModal>

      {/* Status Change Prompt Dialog */}
      <Dialog open={statusPromptOpen} onClose={() => setStatusPromptOpen(false)} disableRestoreFocus maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {pendingStatus === 'Inactive' ? 'Deactivate Role' : 'Reactivate Role'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Please provide a reason for {pendingStatus === 'Inactive' ? 'deactivating' : 'reactivating'} this role.
          </Typography>
          <TextField
            autoFocus
            label="Reason *"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={statusReason}
            onChange={(e) => {
              setStatusReason(e.target.value);
              if (e.target.value.trim()) setStatusReasonError('');
            }}
            error={!!statusReasonError}
            helperText={statusReasonError}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="inherit" size="small" onClick={() => setStatusPromptOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={pendingStatus === 'Inactive' ? 'error' : 'primary'}
            size="small"
            onClick={handleConfirmStatusChange}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleListPage;
