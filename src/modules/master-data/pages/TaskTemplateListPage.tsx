import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  IconButton,
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

import {
  useGetTaskTemplates,
  useCreateTaskTemplate,
  useUpdateTaskTemplate,
  useDeleteTaskTemplate,
  useBulkStatusTaskTemplates,
} from '../services/taskTemplateService';
import { DataTable } from '../../../components/DataTable';
import type { Column } from '../../../components/DataTable';
import { SearchFilters } from '../../../components/SearchFilters';
import { StatusBadge } from '../../../components/StatusBadge';
import { FormModal } from '../../../components/FormModal';
import { ConfirmationDialog } from '../../../components/ConfirmationDialog';
import { TableSkeleton } from '../../../components/LoadingSkeleton';
import { EmptyState } from '../../../components/EmptyState';
import { TaskTemplateForm, FORM_ID } from '../components/TaskTemplateForm';
import type { TaskTemplate } from '../types';

export const TaskTemplateListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const params = {
    skip: page * rowsPerPage,
    limit: rowsPerPage,
    search: searchQuery || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortBy: 'created_at',
    sortOrder: 'desc' as const,
  };

  const { data, isLoading } = useGetTaskTemplates(params);
  const createMut = useCreateTaskTemplate();
  const updateMut = useUpdateTaskTemplate();
  const deleteMut = useDeleteTaskTemplate();
  const bulkStatusMut = useBulkStatusTaskTemplates();

  const templates = data?.templates ?? [];
  const totalCount = data?.total ?? 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | undefined>(undefined);
  const [viewingTemplate, setViewingTemplate] = useState<TaskTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenCreate = () => {
    setEditingTemplate(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tpl: TaskTemplate) => {
    setEditingTemplate(tpl);
    setIsModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = (data: any) => {
    if (editingTemplate) {
      updateMut.mutate(
        { id: editingTemplate.id, data },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            showSnack('Task template updated successfully.');
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onError: (err: any) => {
            showSnack(err.response?.data?.detail || err.message || 'Update failed.', 'error');
          },
        }
      );
    } else {
      createMut.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
          showSnack('Task template created successfully.');
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) => {
          showSnack(err.response?.data?.detail || err.message || 'Creation failed.', 'error');
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMut.mutate(deletingId, {
        onSuccess: () => {
          setDeletingId(null);
          showSnack('Task template deleted successfully.');
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) => {
          showSnack(err.response?.data?.detail || err.message || 'Delete failed.', 'error');
        },
      });
    }
  };

  const handleToggleStatus = (tpl: TaskTemplate) => {
    updateMut.mutate(
      { id: tpl.id, data: { isActive: !tpl.isActive } },
      {
        onSuccess: () => {
          showSnack(`Template "${tpl.title}" ${tpl.isActive ? 'deactivated' : 'activated'}.`);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) => {
          showSnack(err.response?.data?.detail || err.message || 'Status update failed.', 'error');
        },
      }
    );
  };

  const handleBulkStatus = (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    bulkStatusMut.mutate(
      { ids: selectedIds, isActive },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSuccess: (res: any) => {
          setSelectedIds([]);
          showSnack(res?.message || `${selectedIds.length} template(s) updated.`);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) => {
          showSnack(err.response?.data?.detail || err.message || 'Bulk update failed.', 'error');
        },
      }
    );
  };

  const columns: Column<TaskTemplate>[] = [
    {
      id: 'templateCode',
      label: 'Code',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', color: 'primary.main' }}>
          {row.templateCode}
        </Typography>
      ),
    },
    {
      id: 'title',
      label: 'Task Title',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.title}
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
          sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {row.description || '-'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.isActive ? 'Active' : 'Inactive'} />,
    },
    {
      id: 'createdAt',
      label: 'Created Date',
      render: (row) => (
        <Typography variant="body2">{row.createdAt?.split('T')[0] || '-'}</Typography>
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
            onClick={(e) => { e.currentTarget.blur(); setViewingTemplate(row); }}
            title="View Details"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => { e.currentTarget.blur(); handleOpenEdit(row); }}
            title="Edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => { e.currentTarget.blur(); handleToggleStatus(row); }}
            title={row.isActive ? 'Deactivate' : 'Activate'}
            color={row.isActive ? 'warning' : 'success'}
          >
            {row.isActive ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => { e.currentTarget.blur(); setDeletingId(row.id); }}
            sx={{ color: 'error.main' }}
            title="Delete"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (isLoading) {
    return <TableSkeleton rows={5} />;
  }

  const renderEmpty = (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Task Title Library</Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">
          Add Task Title
        </Button>
      </Box>
      <Card sx={{ p: 4 }}>
        <EmptyState
          title="No Task Titles Found"
          description="Create your first task title to start building the library."
          actionText="+ Add Task Title"
          onAction={handleOpenCreate}
        />
      </Card>
      <FormModal
        open={isModalOpen}
        title="Add Task Title"
        onClose={() => setIsModalOpen(false)}
        formId={FORM_ID}
        submitText="Create"
      >
        <TaskTemplateForm formId={FORM_ID} onSubmit={handleFormSubmit} />
      </FormModal>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );

  if (totalCount === 0 && !searchQuery) {
    return renderEmpty;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Task Title Library</Typography>
          <Typography variant="body2" color="textSecondary">
            Manage standard engineering task titles used across projects
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">
          Add Task Title
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={(q) => { setSearchQuery(q); setPage(0); }}
          searchPlaceholder="Search by title..."
          filters={[
            {
              value: statusFilter,
              label: 'Status',
              placeholder: 'All Statuses',
              onChange: (val) => { setStatusFilter(val); setPage(0); },
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
        />
      </Card>

      <Card sx={{ p: 2 }}>
        <DataTable<TaskTemplate>
          columns={columns}
          data={templates}
          keyExtractor={(row) => row.id}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          bulkActions={
            selectedIds.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" color="success" onClick={() => handleBulkStatus(true)}>
                  Activate ({selectedIds.length})
                </Button>
                <Button size="small" variant="contained" color="warning" onClick={() => handleBulkStatus(false)}>
                  Deactivate ({selectedIds.length})
                </Button>
              </Box>
            ) : undefined
          }
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={setPage}
          onRowsPerPageChange={(rpp) => { setRowsPerPage(rpp); setPage(0); }}
        />
      </Card>

      <FormModal
        open={isModalOpen}
        title={editingTemplate ? 'Edit Task Title' : 'Add Task Title'}
        onClose={() => setIsModalOpen(false)}
        formId={FORM_ID}
        maxWidth="sm"
        submitText={editingTemplate ? 'Save Changes' : 'Create'}
      >
        <TaskTemplateForm
          formId={FORM_ID}
          key={editingTemplate?.id ?? 'new'}
          initialValues={editingTemplate ? { title: editingTemplate.title, description: editingTemplate.description || '' } : undefined}
          onSubmit={handleFormSubmit}
        />
      </FormModal>

      <Dialog
        open={viewingTemplate !== null}
        onClose={() => setViewingTemplate(null)}
        maxWidth="sm"
        fullWidth
        disableRestoreFocus
      >
        {viewingTemplate && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>Task Template Details</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    TEMPLATE CODE
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main', mt: 0.5, fontFamily: 'monospace' }}>
                    {viewingTemplate.templateCode}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    STATUS
                  </Typography>
                  <Box sx={{ mt: 0.5 }}><StatusBadge status={viewingTemplate.isActive ? 'Active' : 'Inactive'} /></Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    TASK TITLE
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {viewingTemplate.title}
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
                    {viewingTemplate.description || 'No description provided.'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    CREATED
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {viewingTemplate.createdAt ? new Date(viewingTemplate.createdAt).toLocaleString() : '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    LAST MODIFIED
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {viewingTemplate.updatedAt ? new Date(viewingTemplate.updatedAt).toLocaleString() : '-'}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setViewingTemplate(null)} color="primary" variant="contained" size="small">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <ConfirmationDialog
        open={deletingId !== null}
        title="Delete Task Template"
        description="Are you sure you want to deactivate this task template? This is a soft delete — it can be reactivated later."
        confirmText="Deactivate"
        cancelText="Cancel"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingId(null)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default TaskTemplateListPage;
