import React, { useState } from 'react';
import { Box, Button, Card, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

import { useGetTeams, useCreateTeam, useUpdateTeam } from '../services/hrService';
import { DataTable } from '../../../components/DataTable';
import type { Column } from '../../../components/DataTable';
import { SearchFilters } from '../../../components/SearchFilters';
import type { FilterOption } from '../../../components/SearchFilters';
import { FormModal } from '../../../components/FormModal';
import { TeamForm } from '../components/TeamForm';
import type { Team } from '../types';

export const TeamListPage: React.FC = () => {
  const query = useGetTeams();
  const createMut = useCreateTeam();
  const updateMut = useUpdateTeam();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | undefined>(undefined);

  // Status Change Dialog States
  const [statusPromptOpen, setStatusPromptOpen] = useState(false);
  const [pendingTeamData, setPendingTeamData] = useState<any>(null);
  const [pendingActiveState, setPendingActiveState] = useState<boolean | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [statusReasonError, setStatusReasonError] = useState('');

  const handleOpenCreateModal = () => {
    setEditingTeam(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (team: Team) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const executeTeamSave = (data: Partial<Team>) => {
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

  const handleFormSubmit = (data: Partial<Team>) => {
    if (editingTeam) {
      const statusChanged = editingTeam.is_active !== data.is_active;
      if (statusChanged) {
        setPendingTeamData(data);
        setPendingActiveState(data.is_active ?? false);
        setStatusReason('');
        setStatusReasonError('');
        setStatusPromptOpen(true);
        return;
      }
    }
    executeTeamSave(data);
  };

  const handleConfirmStatusChange = () => {
    if (!statusReason.trim()) {
      setStatusReasonError('Reason is required.');
      return;
    }
    if (!pendingTeamData) return;

    const currentDesc = pendingTeamData.description || '';
    const todayStr = new Date().toISOString().split('T')[0];
    const newDesc = currentDesc 
      ? `${currentDesc}\n[${pendingActiveState ? 'Reactivated' : 'Deactivated'} on ${todayStr}. Reason: ${statusReason}]`
      : `[${pendingActiveState ? 'Reactivated' : 'Deactivated'} on ${todayStr}. Reason: ${statusReason}]`;
    
    const finalData = {
      ...pendingTeamData,
      description: newDesc,
    };
    
    setStatusPromptOpen(false);
    executeTeamSave(finalData);
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
          key={editingTeam?.id ?? 'new'}
          formId="team-form"
          initialValues={editingTeam}
          onSubmit={handleFormSubmit}
        />
      </FormModal>

      {/* Status Change Prompt Dialog */}
      <Dialog open={statusPromptOpen} onClose={() => setStatusPromptOpen(false)} disableRestoreFocus maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {pendingActiveState ? 'Reactivate Team' : 'Deactivate Team'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Please provide a reason for {pendingActiveState ? 'reactivating' : 'deactivating'} this team.
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
            color={pendingActiveState ? 'primary' : 'error'}
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

export default TeamListPage;
