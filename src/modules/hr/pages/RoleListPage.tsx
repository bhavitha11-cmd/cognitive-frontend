import React, { useState } from 'react';
import { Box, Button, Card, Typography, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { useGetRoles, useCreateRole, useUpdateRole, useDeleteRole, useSetRolePermissions } from '../services/hrService';
import { DataTable } from '../../../components/DataTable';
import type { Column } from '../../../components/DataTable';
import { SearchFilters } from '../../../components/SearchFilters';
import type { FilterOption } from '../../../components/SearchFilters';
import { StatusBadge } from '../../../components/StatusBadge';
import { FormModal } from '../../../components/FormModal';
import { ConfirmationDialog } from '../../../components/ConfirmationDialog';
import { RoleForm } from '../components/RoleForm';
import type { Role } from '../types';

export const RoleListPage: React.FC = () => {
  const query = useGetRoles();
  const createMut = useCreateRole();
  const updateMut = useUpdateRole();
  const deleteMut = useDeleteRole();
  const permMut = useSetRolePermissions();

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal / Dialog states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

  // Event handlers
  const handleOpenCreateModal = () => {
    setEditingRole(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: any) => {
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
              }
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

  const handleDeleteConfirm = () => {
    if (deletingRoleId) {
      console.log('[Frontend] Initiating role deletion for ID:', deletingRoleId);
      deleteMut.mutate(deletingRoleId, {
        onSuccess: () => {
          console.log('[Frontend] Role deleted successfully, ID:', deletingRoleId);
          setDeletingRoleId(null);
        },
        onError: (err) => {
          console.error('[Frontend] Failed to delete role:', err);
        }
      });
    }
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
          <IconButton
            size="small"
            onClick={(e) => {
              e.currentTarget.blur();
              setDeletingRoleId(row.id);
            }}
            sx={{ color: 'error.main' }}
            disabled={row.isSystemRole}
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
          formId="role-form"
          initialValues={editingRole}
          onSubmit={handleFormSubmit}
        />
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deletingRoleId !== null}
        title="Delete Role"
        description="Are you sure you want to permanently delete this role? This action cannot be undone and will unassign the role from all associated employees."
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingRoleId(null)}
      />
    </Box>
  );
};

export default RoleListPage;
