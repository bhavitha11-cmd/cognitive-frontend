import React, { useState } from 'react';
import { Box, Button, Card, Typography, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { useGetTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from '../services/hrService';
import { DataTable } from '../../../components/DataTable';
import type { Column } from '../../../components/DataTable';
import { SearchFilters } from '../../../components/SearchFilters';
import type { FilterOption } from '../../../components/SearchFilters';
import { FormModal } from '../../../components/FormModal';
import { ConfirmationDialog } from '../../../components/ConfirmationDialog';
import { TeamForm } from '../components/TeamForm';
import type { Team } from '../types';

export const TeamListPage: React.FC = () => {
  const query = useGetTeams();
  const createMut = useCreateTeam();
  const updateMut = useUpdateTeam();
  const deleteMut = useDeleteTeam();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | undefined>(undefined);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setEditingTeam(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (team: Team) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: Partial<Team>) => {
    if (editingTeam) {
      console.log('[Frontend] Submitting team update for:', editingTeam.id, data);
      updateMut.mutate({ id: editingTeam.id, data }, {
        onSuccess: (updatedTeam) => {
          console.log('[Frontend] Team updated successfully:', updatedTeam);
          setIsModalOpen(false);
        },
        onError: (err) => {
          console.error('[Frontend] Failed to update team:', err);
        }
      });
    } else {
      console.log('[Frontend] Submitting new team creation:', data);
      createMut.mutate(data, {
        onSuccess: (newTeam) => {
          console.log('[Frontend] Team created successfully:', newTeam);
          setIsModalOpen(false);
        },
        onError: (err) => {
          console.error('[Frontend] Failed to create team:', err);
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingTeamId) {
      console.log('[Frontend] Initiating team deletion for ID:', deletingTeamId);
      deleteMut.mutate(deletingTeamId, {
        onSuccess: () => {
          console.log('[Frontend] Team deleted successfully, ID:', deletingTeamId);
          setDeletingTeamId(null);
        },
        onError: (err) => {
          console.error('[Frontend] Failed to delete team:', err);
          setDeletingTeamId(null);
        }
      });
    }
  };

  const data = query.data || [];
  const filteredTeams = data.filter((team) => {
    const matchesSearch = team.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (team.team_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (team.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const paginatedTeams = filteredTeams.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const columns: Column<Team>[] = [
    {
      id: 'team_name',
      label: 'Team Name',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.team_name}</Typography>
          {row.team_lead_name ? (
            <Typography variant="caption" color="textSecondary" noWrap sx={{ display: 'block', maxWidth: 280, fontWeight: 550 }}>
              Lead: {row.team_lead_name}
            </Typography>
          ) : row.description ? (
            <Typography variant="caption" color="textSecondary" noWrap sx={{ display: 'block', maxWidth: 280 }}>
              {row.description}
            </Typography>
          ) : null}
        </Box>
      ),
    },
    {
      id: 'team_code',
      label: 'Code',
    },
    {
      id: 'department_name',
      label: 'Department',
      render: (row) => <Typography variant="body2">{row.department_name || '-'}</Typography>,
    },
    {
      id: 'member_count',
      label: 'Members',
      render: (row) => <Typography variant="body2">{row.member_count}</Typography>,
    },
    {
      id: 'is_active',
      label: 'Status',
      render: (row) => (
        <Typography variant="body2" sx={{ color: row.is_active ? 'success.main' : 'text.disabled' }}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Typography>
      ),
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
              setDeletingTeamId(row.id);
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const filterConfigs: FilterOption[] = [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Teams Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={(e) => { e.currentTarget.blur(); handleOpenCreateModal(); }}
          size="small"
        >
          Add Team
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={(q) => { setSearchQuery(q); setPage(0); }}
          searchPlaceholder="Search teams by name, code, or description..."
          filters={filterConfigs}
        />
      </Card>

      <Card sx={{ p: 2 }}>
        <DataTable
          columns={columns}
          data={paginatedTeams}
          keyExtractor={(row) => row.id}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={filteredTeams.length}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </Card>

      <FormModal
        open={isModalOpen}
        title={editingTeam ? 'Edit Team' : 'Create New Team'}
        onClose={() => setIsModalOpen(false)}
        formId="team-form"
        submitText={editingTeam ? 'Update Team' : 'Create Team'}
      >
        <TeamForm
          formId="team-form"
          initialValues={editingTeam}
          onSubmit={handleFormSubmit}
        />
      </FormModal>

      <ConfirmationDialog
        open={deletingTeamId !== null}
        title="Delete Team"
        description="Are you sure you want to permanently delete this team? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingTeamId(null)}
      />
    </Box>
  );
};

export default TeamListPage;
