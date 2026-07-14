import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';

import {
  useGetCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useGetTicketTypes,
  useCreateTicketType,
  useUpdateTicketType,
  useDeleteTicketType,
  useGetPriorities,
  useCreatePriority,
  useUpdatePriority,
  useDeletePriority,
  useGetStatuses,
  useCreateStatus,
  useUpdateStatus,
  useDeleteStatus,
  useGetCategoryHandlers,
  useCreateCategoryHandler,
  useDeleteCategoryHandler,
  useUpdateCategoryHandlerStatus,
} from '../../tickets/services/ticketService';
import { useGetEmployeesLookup } from '../../hr/services/hrService';

export const TicketSettings: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'types' | 'priorities' | 'statuses' | 'handlers'>('categories');
  const [errorMsg, setErrorMsg] = useState<string | None>(null);
  const [successMsg, setSuccessMsg] = useState<string | None>(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form Fields
  const [nameField, setNameField] = useState('');
  const [isActiveField, setIsActiveField] = useState(true);
  const [categorySelectField, setCategorySelectField] = useState('');
  const [employeeSelectField, setEmployeeSelectField] = useState<string | string[]>([]);

  // Service Queries
  const { data: categories = [], isLoading: loadingCats } = useGetCategories();
  const { data: priorities = [], isLoading: loadingPrios } = useGetPriorities();
  const { data: statuses = [], isLoading: loadingStats } = useGetStatuses();
  const { data: employees = [], isLoading: loadingEmps } = useGetEmployeesLookup();

  // For Ticket Types tab
  const [selectedSettingsCategory, setSelectedSettingsCategory] = useState<string>('');
  const { data: ticketTypes = [], isLoading: loadingTypes } = useGetTicketTypes(
    activeSubTab === 'types' && selectedSettingsCategory ? selectedSettingsCategory : undefined
  );

  // For Handlers tab
  const [selectedHandlerCategory, setSelectedHandlerCategory] = useState<string>('');
  const { data: handlers = [], isLoading: loadingHandlers } = useGetCategoryHandlers(
    activeSubTab === 'handlers' && selectedHandlerCategory ? selectedHandlerCategory : undefined
  );

  // Mutations
  const createCatMutation = useCreateCategory();
  const updateCatMutation = useUpdateCategory();
  const deleteCatMutation = useDeleteCategory();

  const createTypeMutation = useCreateTicketType();
  const updateTypeMutation = useUpdateTicketType();
  const deleteTypeMutation = useDeleteTicketType();

  const createPrioMutation = useCreatePriority();
  const updatePrioMutation = useUpdatePriority();
  const deletePrioMutation = useDeletePriority();

  const createStatusMutation = useCreateStatus();
  const updateStatusMutation = useUpdateStatus();
  const deleteStatusMutation = useDeleteStatus();

  const createHandlerMutation = useCreateCategoryHandler();
  const deleteHandlerMutation = useDeleteCategoryHandler();
  const updateHandlerStatusMutation = useUpdateCategoryHandlerStatus();

  const handleShowAlert = (msg: string, isError: boolean = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg(null);
    } else {
      setSuccessMsg(msg);
      setErrorMsg(null);
    }
    setTimeout(() => {
      setErrorMsg(null);
      setSuccessMsg(null);
    }, 4000);
  };

  const handleOpenDialog = (mode: 'create' | 'edit', item?: any) => {
    setDialogMode(mode);
    setSelectedItem(item || null);
    if (mode === 'edit' && item) {
      setNameField(item.name || '');
      setIsActiveField(item.isActive !== undefined ? item.isActive : true);
      setCategorySelectField(item.categoryId || '');
      setEmployeeSelectField(activeSubTab === 'handlers' ? [item.employeeId || ''] : item.employeeId || '');
    } else {
      setNameField('');
      setIsActiveField(true);
      setCategorySelectField(categories[0]?.id || '');
      setEmployeeSelectField(activeSubTab === 'handlers' ? [] : '');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setNameField('');
    setIsActiveField(true);
    setEmployeeSelectField([]);
  };

  const handleSave = async () => {
    try {
      if (activeSubTab === 'categories') {
        if (dialogMode === 'create') {
          await createCatMutation.mutateAsync({ name: nameField, isActive: isActiveField });
          handleShowAlert(`Category "${nameField}" created successfully`);
        } else {
          await updateCatMutation.mutateAsync({ id: selectedItem.id, name: nameField, isActive: isActiveField });
          handleShowAlert(`Category "${nameField}" updated successfully`);
        }
      } else if (activeSubTab === 'types') {
        if (dialogMode === 'create') {
          await createTypeMutation.mutateAsync({ categoryId: categorySelectField, name: nameField, isActive: isActiveField });
          handleShowAlert(`Ticket Type "${nameField}" created successfully`);
        } else {
          await updateTypeMutation.mutateAsync({ id: selectedItem.id, categoryId: categorySelectField, name: nameField, isActive: isActiveField });
          handleShowAlert(`Ticket Type "${nameField}" updated successfully`);
        }
      } else if (activeSubTab === 'priorities') {
        if (dialogMode === 'create') {
          await createPrioMutation.mutateAsync(nameField);
          handleShowAlert(`Priority "${nameField}" created successfully`);
        } else {
          await updatePrioMutation.mutateAsync({ id: selectedItem.id, name: nameField, isActive: isActiveField });
          handleShowAlert(`Priority "${nameField}" updated successfully`);
        }
      } else if (activeSubTab === 'statuses') {
        if (dialogMode === 'create') {
          await createStatusMutation.mutateAsync(nameField);
          handleShowAlert(`Status "${nameField}" created successfully`);
        } else {
          await updateStatusMutation.mutateAsync({ id: selectedItem.id, name: nameField, isActive: isActiveField });
          handleShowAlert(`Status "${nameField}" updated successfully`);
        }
      } else if (activeSubTab === 'handlers') {
        const empIds = Array.isArray(employeeSelectField) ? employeeSelectField : [employeeSelectField];
        if (empIds.length === 0) {
          handleShowAlert('Please select at least one employee handler', true);
          return;
        }
        
        const results = await Promise.allSettled(
          empIds.map((empId) =>
            createHandlerMutation.mutateAsync({
              categoryId: categorySelectField,
              employeeId: empId,
            })
          )
        );

        const failed = results.filter((r) => r.status === 'rejected');
        const succeeded = results.filter((r) => r.status === 'fulfilled');

        if (failed.length > 0) {
          const firstErr = (failed[0] as PromiseRejectedResult).reason;
          const errDetail = firstErr?.response?.data?.detail || firstErr?.message || '';
          
          if (errDetail.includes('already exists')) {
            if (succeeded.length > 0) {
              handleShowAlert(`Successfully assigned ${succeeded.length} new handler(s). Skipped duplicates.`);
            } else {
              handleShowAlert('Selected employee(s) are already assigned as handlers for this category.', true);
            }
          } else {
            handleShowAlert(errDetail || 'Error occurred during assignment', true);
          }
        } else {
          handleShowAlert(`Handler(s) assigned successfully`);
        }
      }
      handleCloseDialog();
    } catch (err: any) {
      handleShowAlert(err?.response?.data?.detail || err?.message || 'Error occurred', true);
    }
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm(`Are you sure you want to delete this configuration?`)) return;
    try {
      if (activeSubTab === 'categories') {
        await deleteCatMutation.mutateAsync(item.id);
        handleShowAlert('Category deleted successfully');
      } else if (activeSubTab === 'types') {
        await deleteTypeMutation.mutateAsync(item.id);
        handleShowAlert('Ticket Type deleted successfully');
      } else if (activeSubTab === 'priorities') {
        await deletePrioMutation.mutateAsync(item.id);
        handleShowAlert('Priority deleted successfully');
      } else if (activeSubTab === 'statuses') {
        await deleteStatusMutation.mutateAsync(item.id);
        handleShowAlert('Status deleted successfully');
      } else if (activeSubTab === 'handlers') {
        await deleteHandlerMutation.mutateAsync(item.id);
        handleShowAlert('Handler configuration deleted successfully');
      }
    } catch (err: any) {
      handleShowAlert(err?.response?.data?.detail || err?.message || 'Delete failed', true);
    }
  };

  const handleToggleStatus = async (item: any) => {
    try {
      if (activeSubTab === 'categories') {
        await updateCatMutation.mutateAsync({ id: item.id, name: item.name, isActive: !item.isActive });
        handleShowAlert(`Category status updated`);
      } else if (activeSubTab === 'types') {
        await updateTypeMutation.mutateAsync({ id: item.id, categoryId: item.categoryId, name: item.name, isActive: !item.isActive });
        handleShowAlert(`Ticket Type status updated`);
      } else if (activeSubTab === 'priorities') {
        await updatePrioMutation.mutateAsync({ id: item.id, name: item.name, isActive: !item.isActive });
        handleShowAlert(`Priority status updated`);
      } else if (activeSubTab === 'statuses') {
        await updateStatusMutation.mutateAsync({ id: item.id, name: item.name, isActive: !item.isActive });
        handleShowAlert(`Status status updated`);
      } else if (activeSubTab === 'handlers') {
        await updateHandlerStatusMutation.mutateAsync({ id: item.id, isActive: !item.isActive });
        handleShowAlert(`Handler status updated`);
      }
    } catch (err: any) {
      handleShowAlert(err?.response?.data?.detail || err?.message || 'Status toggle failed', true);
    }
  };

  const menuButtons = [
    { id: 'categories' as const, label: 'Ticket Categories' },
    { id: 'types' as const, label: 'Ticket Types' },
    { id: 'priorities' as const, label: 'Priorities' },
    { id: 'statuses' as const, label: 'Statuses' },
    { id: 'handlers' as const, label: 'Category Handlers' },
  ];

  const showLoading = loadingCats || loadingPrios || loadingStats || loadingTypes || loadingHandlers || loadingEmps;

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Grid container spacing={1}>
          {menuButtons.map((btn) => (
            <Grid key={btn.id}>
              <Button
                variant={activeSubTab === btn.id ? 'contained' : 'text'}
                onClick={() => {
                  setActiveSubTab(btn.id);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  borderRadius: 1.5,
                  px: 2,
                  py: 1,
                  mb: 1,
                  mr: 1,
                }}
              >
                {btn.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMsg}
        </Alert>
      )}

      {/* Categories Tab Content */}
      {activeSubTab === 'categories' && (
        <Card sx={{ p: 2, borderRadius: 2 }} variant="outlined">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Dynamic Ticket Categories
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
            >
              Add Category
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Category Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{cat.name}</TableCell>
                    <TableCell>
                      <Switch
                        size="small"
                        checked={cat.isActive}
                        onChange={() => handleToggleStatus(cat)}
                      />
                      <Chip
                        label={cat.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={cat.isActive ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog('edit', cat)} sx={{ mr: 1 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && !showLoading && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No ticket categories found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Ticket Types Tab Content */}
      {activeSubTab === 'types' && (
        <Card sx={{ p: 2, borderRadius: 2 }} variant="outlined">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="select-category-label">Category Filter</InputLabel>
                <Select
                  labelId="select-category-label"
                  label="Category Filter"
                  value={selectedSettingsCategory}
                  onChange={(e) => setSelectedSettingsCategory(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select Category</em>
                  </MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="textSecondary">
                Select a category to view/manage ticket types.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
              disabled={!selectedSettingsCategory}
            >
              Add Ticket Type
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Ticket Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ticketTypes.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{t.name}</TableCell>
                    <TableCell>
                      <Switch
                        size="small"
                        checked={t.isActive}
                        onChange={() => handleToggleStatus(t)}
                      />
                      <Chip
                        label={t.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={t.isActive ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog('edit', t)} sx={{ mr: 1 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!selectedSettingsCategory && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Please select a ticket category from the dropdown above to view types.
                    </TableCell>
                  </TableRow>
                )}
                {selectedSettingsCategory && ticketTypes.length === 0 && !showLoading && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No ticket types configured for this category yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Priorities Tab Content */}
      {activeSubTab === 'priorities' && (
        <Card sx={{ p: 2, borderRadius: 2 }} variant="outlined">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Configure Ticket Priorities
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
            >
              Add Priority
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Priority Level</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priorities.map((prio) => (
                  <TableRow key={prio.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{prio.name}</TableCell>
                    <TableCell>
                      <Switch
                        size="small"
                        checked={prio.isActive}
                        onChange={() => handleToggleStatus(prio)}
                      />
                      <Chip
                        label={prio.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={prio.isActive ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog('edit', prio)} sx={{ mr: 1 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Statuses Tab Content */}
      {activeSubTab === 'statuses' && (
        <Card sx={{ p: 2, borderRadius: 2 }} variant="outlined">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Configure Ticket Statuses
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
            >
              Add Status
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Status Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statuses.map((stat) => (
                  <TableRow key={stat.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{stat.name}</TableCell>
                    <TableCell>
                      <Switch
                        size="small"
                        checked={stat.isActive}
                        onChange={() => handleToggleStatus(stat)}
                      />
                      <Chip
                        label={stat.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={stat.isActive ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog('edit', stat)} sx={{ mr: 1 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Handlers Tab Content */}
      {activeSubTab === 'handlers' && (
        <Card sx={{ p: 2, borderRadius: 2 }} variant="outlined">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="select-handler-cat-label">Filter Category</InputLabel>
                <Select
                  labelId="select-handler-cat-label"
                  label="Filter Category"
                  value={selectedHandlerCategory}
                  onChange={(e) => setSelectedHandlerCategory(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select Category</em>
                  </MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="textSecondary">
                Filter handlers by ticket category.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
            >
              Add Category Handler
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Employee Handler</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {handlers.map((h) => {
                  const catObj = categories.find((c) => c.id === h.categoryId);
                  return (
                    <TableRow key={h.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{catObj ? catObj.name : 'Unknown'}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{h.employeeName}</TableCell>
                      <TableCell align="center">
                        <Switch
                          size="small"
                          checked={h.isActive}
                          onChange={() => handleToggleStatus(h)}
                        />
                        <Chip
                          label={h.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={h.isActive ? 'success' : 'default'}
                          variant="outlined"
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {handlers.length === 0 && !showLoading && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No employee handlers configured.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Dialog for Edit / Create */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialogMode === 'create' ? 'Create New Configuration' : 'Edit Configuration'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {activeSubTab === 'handlers' ? (
              <>
                <FormControl fullWidth>
                  <InputLabel id="dialog-cat-select-label">Category</InputLabel>
                  <Select
                    labelId="dialog-cat-select-label"
                    label="Category"
                    value={categorySelectField}
                    onChange={(e) => setCategorySelectField(e.target.value)}
                  >
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="dialog-emp-select-label">Employee Handler</InputLabel>
                  <Select
                    labelId="dialog-emp-select-label"
                    label="Employee Handler"
                    multiple
                    value={Array.isArray(employeeSelectField) ? employeeSelectField : []}
                    onChange={(e) => setEmployeeSelectField(e.target.value as string[])}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => {
                          const emp = employees.find((e) => e.id === value);
                          return (
                            <Chip
                              key={value}
                              label={emp ? emp.displayName : value}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.displayName} ({emp.employeeCode})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            ) : (
              <>
                {activeSubTab === 'types' && (
                  <FormControl fullWidth>
                    <InputLabel id="dialog-cat-type-label">Category</InputLabel>
                    <Select
                      labelId="dialog-cat-type-label"
                      label="Category"
                      value={categorySelectField}
                      onChange={(e) => setCategorySelectField(e.target.value)}
                      disabled={dialogMode === 'edit'}
                    >
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <TextField
                  fullWidth
                  label="Name / Value"
                  value={nameField}
                  onChange={(e) => setNameField(e.target.value)}
                  variant="outlined"
                />

                {dialogMode === 'edit' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">Is Active:</Typography>
                    <Switch
                      checked={isActiveField}
                      onChange={(e) => setIsActiveField(e.target.checked)}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              activeSubTab === 'handlers'
                ? !categorySelectField || (Array.isArray(employeeSelectField) ? employeeSelectField.length === 0 : !employeeSelectField)
                : !nameField
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TicketSettings;
