import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Divider,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaletteIcon from '@mui/icons-material/Palette';
import SettingsIcon from '@mui/icons-material/Settings';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SaveIcon from '@mui/icons-material/Save';

// Services
import {
  useGetHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useToggleHoliday,
  useDeleteHoliday,
  useGetCompanyEvents,
  useCreateCompanyEvent,
  useUpdateCompanyEvent,
  useDeleteCompanyEvent,
  useGetCalendarSettings,
  useUpdateCalendarSettings,
} from '../services/calendarConfigService';

import { parseError } from '../../../utils/api';
import type { Holiday, HolidayCreate, CompanyEvent, CompanyEventCreate, CalendarSettings } from '../types';

export const CalendarConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Snackbar Alert state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const showSnack = (message: any, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    let msgStr = '';
    if (typeof message === 'string') {
      msgStr = message;
    } else {
      msgStr = parseError(message);
    }
    setSnackbar({ open: true, message: msgStr, severity });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 1: HOLIDAYS MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────
  const [holidaySearch, setHolidaySearch] = useState('');
  const [holidayYear, setHolidayYear] = useState<number | undefined>(new Date().getFullYear());
  const { data: holidaysData, isLoading: holidaysLoading } = useGetHolidays({
    search: holidaySearch || undefined,
    year: holidayYear || undefined,
  });

  const createHolidayMut = useCreateHoliday();
  const updateHolidayMut = useUpdateHoliday();
  const toggleHolidayMut = useToggleHoliday();
  const deleteHolidayMut = useDeleteHoliday();

  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayForm, setHolidayForm] = useState<Partial<Holiday>>({
    name: '',
    date: '',
    holidayType: 'PUBLIC',
    description: '',
    affectsWorkingDays: true,
  });

  const [holidayDeleteConfirmOpen, setHolidayDeleteConfirmOpen] = useState(false);
  const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(null);

  const openHolidayCreate = () => {
    setEditingHoliday(null);
    setHolidayForm({
      name: '',
      date: '',
      holidayType: 'PUBLIC',
      description: '',
      affectsWorkingDays: true,
    });
    setHolidayModalOpen(true);
  };

  const openHolidayEdit = (h: Holiday) => {
    setEditingHoliday(h);
    setHolidayForm({
      name: h.name,
      date: h.date,
      holidayType: h.holidayType,
      description: h.description || '',
      affectsWorkingDays: h.affectsWorkingDays,
    });
    setHolidayModalOpen(true);
  };

  const handleHolidayFormSubmit = () => {
    if (!holidayForm.name || !holidayForm.date) {
      showSnack('Name and Date are required', 'error');
      return;
    }

    if (editingHoliday) {
      updateHolidayMut.mutate(
        {
          id: editingHoliday.id,
          data: {
            name: holidayForm.name,
            date: holidayForm.date,
            holidayType: holidayForm.holidayType,
            description: holidayForm.description,
            affectsWorkingDays: holidayForm.affectsWorkingDays,
          },
        },
        {
          onSuccess: () => {
            setHolidayModalOpen(false);
            showSnack('Holiday updated successfully. Overlapping project/task deadlines recalculated.');
          },
          onError: (err: any) => {
            showSnack(parseError(err), 'error');
          },
        }
      );
    } else {
      createHolidayMut.mutate(
        holidayForm as HolidayCreate,
        {
          onSuccess: () => {
            setHolidayModalOpen(false);
            showSnack('Holiday created successfully. Overlapping project/task deadlines recalculated.');
          },
          onError: (err: any) => {
            showSnack(parseError(err), 'error');
          },
        }
      );
    }
  };

  const handleHolidayToggle = (h: Holiday) => {
    toggleHolidayMut.mutate(h.id, {
      onSuccess: (updated) => {
        showSnack(`Holiday "${updated.name}" ${updated.isActive ? 'activated' : 'deactivated'}. Schedules recalculated.`);
      },
      onError: (err: any) => {
        showSnack(parseError(err), 'error');
      },
    });
  };

  const triggerHolidayDelete = (id: string) => {
    setDeletingHolidayId(id);
    setHolidayDeleteConfirmOpen(true);
  };

  const handleHolidayDeleteSubmit = () => {
    if (deletingHolidayId) {
      deleteHolidayMut.mutate(deletingHolidayId, {
        onSuccess: () => {
          setHolidayDeleteConfirmOpen(false);
          setDeletingHolidayId(null);
          showSnack('Holiday deactivated successfully.');
        },
        onError: (err: any) => {
          showSnack(parseError(err), 'error');
        },
      });
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 2: COMPANY EVENTS MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────
  const { data: eventsData, isLoading: eventsLoading } = useGetCompanyEvents();
  const createEventMut = useCreateCompanyEvent();
  const updateEventMut = useUpdateCompanyEvent();
  const deleteEventMut = useDeleteCompanyEvent();

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CompanyEvent | null>(null);
  const [eventForm, setEventForm] = useState<Partial<CompanyEvent>>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '10:00',
    isAllDay: true,
    color: '#8B5CF6',
    textColor: '#ffffff',
    affectsWorkingDays: false,
  });

  const [eventDeleteConfirmOpen, setEventDeleteConfirmOpen] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const openEventCreate = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '09:00',
      endTime: '10:00',
      isAllDay: true,
      color: '#8B5CF6',
      textColor: '#ffffff',
      affectsWorkingDays: false,
    });
    setEventModalOpen(true);
  };

  const openEventEdit = (e: CompanyEvent) => {
    setEditingEvent(e);
    setEventForm({
      title: e.title,
      description: e.description || '',
      startDate: e.startDate,
      endDate: e.endDate || '',
      startTime: e.startTime || '09:00',
      endTime: e.endTime || '10:00',
      isAllDay: e.isAllDay,
      color: e.color || '#8B5CF6',
      textColor: e.textColor || '#ffffff',
      affectsWorkingDays: e.affectsWorkingDays,
    });
    setEventModalOpen(true);
  };

  const handleEventFormSubmit = () => {
    if (!eventForm.title || !eventForm.startDate) {
      showSnack('Title and Start Date are required', 'error');
      return;
    }

    const payload: any = {
      title: eventForm.title,
      description: eventForm.description,
      startDate: eventForm.startDate,
      endDate: eventForm.endDate || null,
      isAllDay: eventForm.isAllDay,
      color: eventForm.color,
      textColor: eventForm.textColor,
      affectsWorkingDays: eventForm.affectsWorkingDays,
    };

    if (!eventForm.isAllDay) {
      payload.startTime = eventForm.startTime;
      payload.endTime = eventForm.endTime;
    }

    if (editingEvent) {
      updateEventMut.mutate(
        { id: editingEvent.id, data: payload },
        {
          onSuccess: () => {
            setEventModalOpen(false);
            showSnack('Company Event updated successfully.');
          },
          onError: (err: any) => {
            showSnack(parseError(err), 'error');
          },
        }
      );
    } else {
      createEventMut.mutate(payload as CompanyEventCreate, {
        onSuccess: () => {
          setEventModalOpen(false);
          showSnack('Company Event created successfully.');
        },
        onError: (err: any) => {
          showSnack(parseError(err), 'error');
        },
      });
    }
  };

  const triggerEventDelete = (id: string) => {
    setDeletingEventId(id);
    setEventDeleteConfirmOpen(true);
  };

  const handleEventDeleteSubmit = () => {
    if (deletingEventId) {
      deleteEventMut.mutate(deletingEventId, {
        onSuccess: () => {
          setEventDeleteConfirmOpen(false);
          setDeletingEventId(null);
          showSnack('Company Event deleted successfully.');
        },
        onError: (err: any) => {
          showSnack(parseError(err), 'error');
        },
      });
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 3 & 4: GENERAL SETTINGS, WORK DAYS, SHIFTS, COLORS
  // ───────────────────────────────────────────────────────────────────────────
  const { data: settingsData, isLoading: settingsLoading } = useGetCalendarSettings();
  const updateSettingsMut = useUpdateCalendarSettings();

  const [settingsForm, setSettingsForm] = useState<Partial<CalendarSettings>>({});

  useEffect(() => {
    if (settingsData) {
      setSettingsForm(settingsData);
    }
  }, [settingsData]);

  const handleSettingsFieldChange = (field: keyof CalendarSettings, value: any) => {
    setSettingsForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveGeneralSettings = () => {
    updateSettingsMut.mutate(settingsForm, {
      onSuccess: () => {
        showSnack('Shift and working days settings updated successfully. Task and project calendars updated.');
      },
      onError: (err: any) => {
        showSnack(parseError(err), 'error');
      },
    });
  };

  const handleSaveColorPreferences = () => {
    updateSettingsMut.mutate(settingsForm, {
      onSuccess: () => {
        showSnack('Category colors and preferences updated successfully.');
      },
      onError: (err: any) => {
        showSnack(parseError(err), 'error');
      },
    });
  };

  // Helper arrays
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const toggleWorkingDay = (day: string) => {
    const current: string[] = settingsForm.workingDays?.split(',') || [];
    let updated: string[];
    if (current.includes(day)) {
      updated = current.filter((d) => d !== day);
    } else {
      updated = [...current, day];
    }
    handleSettingsFieldChange('workingDays', updated.join(','));
  };

  const toggleWeekendDay = (day: string) => {
    const current: string[] = settingsForm.weekendDays?.split(',') || [];
    let updated: string[];
    if (current.includes(day)) {
      updated = current.filter((d) => d !== day);
    } else {
      updated = [...current, day];
    }
    handleSettingsFieldChange('weekendDays', updated.join(','));
  };

  if (settingsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Title Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Calendar & Scheduling Configuration
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage company holidays, schedules, shifts, working days, and color coding.
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="calendar configuration tabs">
          <Tab icon={<EventIcon fontSize="small" />} iconPosition="start" label="Holidays" />
          <Tab icon={<SettingsIcon fontSize="small" />} iconPosition="start" label="Company Events" />
          <Tab icon={<AccessTimeIcon fontSize="small" />} iconPosition="start" label="Shift & Work Days" />
          <Tab icon={<PaletteIcon fontSize="small" />} iconPosition="start" label="Colors & Category Visibility" />
        </Tabs>
      </Box>

      {/* ───────────────────────────────────────────────────────────────────────
          TAB 0: HOLIDAYS
          ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, maxWidth: 600 }}>
              <TextField
                label="Search Holidays"
                variant="outlined"
                size="small"
                value={holidaySearch}
                onChange={(e) => setHolidaySearch(e.target.value)}
                sx={{ flexGrow: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={holidayYear || ''}
                  label="Year"
                  onChange={(e) => setHolidayYear(Number(e.target.value) || undefined)}
                >
                  <MenuItem value="">All Years</MenuItem>
                  <MenuItem value={2025}>2025</MenuItem>
                  <MenuItem value={2026}>2026</MenuItem>
                  <MenuItem value={2027}>2027</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={openHolidayCreate}
              size="small"
            >
              Add Holiday
            </Button>
          </Box>

          <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningAmberIcon />}>
            Creating, editing, or toggling holidays will automatically trigger end-date recalculations for all active tasks and projects that overlap with the holiday date.
          </Alert>

          {holidaysLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : holidaysData?.holidays && holidaysData.holidays.length > 0 ? (
            <TableContainer component={Paper} elevation={1}>
              <Table sx={{ minWidth: 650 }} aria-label="holidays table">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Holiday Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Affects Schedule</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Active</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holidaysData.holidays.map((row) => (
                    <TableRow key={row.id} hover sx={{ opacity: row.isActive ? 1 : 0.6 }}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>{row.date}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.holidayType}
                          size="small"
                          color={row.holidayType === 'PUBLIC' ? 'primary' : 'secondary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell color="textSecondary">{row.description || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.affectsWorkingDays ? 'Yes' : 'No'}
                          size="small"
                          color={row.affectsWorkingDays ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleHolidayToggle(row)}
                          color={row.isActive ? 'success' : 'default'}
                          title={row.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {row.isActive ? <ToggleOnIcon fontSize="large" /> : <ToggleOffIcon fontSize="large" />}
                        </IconButton>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <IconButton size="small" onClick={() => openHolidayEdit(row)} title="Edit">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => triggerHolidayDelete(row.id)} title="Delete/Deactivate">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              No holidays found. Click "Add Holiday" to register a new company holiday.
            </Paper>
          )}

          {/* Holiday Dialog Form */}
          <Dialog open={holidayModalOpen} onClose={() => setHolidayModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>{editingHoliday ? 'Edit Company Holiday' : 'Create New Holiday'}</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Holiday Name"
                    fullWidth
                    required
                    value={holidayForm.name || ''}
                    onChange={(e) => setHolidayForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    required
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={holidayForm.date || ''}
                    onChange={(e) => setHolidayForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Holiday Type</InputLabel>
                    <Select
                      value={holidayForm.holidayType || 'PUBLIC'}
                      label="Holiday Type"
                      onChange={(e) => setHolidayForm((prev) => ({ ...prev, holidayType: e.target.value }))}
                    >
                      <MenuItem value="PUBLIC">Public Holiday</MenuItem>
                      <MenuItem value="OPTIONAL">Optional / Restricted</MenuItem>
                      <MenuItem value="COMPANY_SPECIFIC">Company Specific Holiday</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Short summary of the holiday (e.g. Christmas, Independence Day)"
                    value={holidayForm.description || ''}
                    onChange={(e) => setHolidayForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={holidayForm.affectsWorkingDays ?? true}
                        onChange={(e) => setHolidayForm((prev) => ({ ...prev, affectsWorkingDays: e.target.checked }))}
                        color="warning"
                      />
                    }
                    label="Affects Project Working Calendars (Cascades scheduling date shifts)"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setHolidayModalOpen(false)}>Cancel</Button>
              <Button variant="contained" color="primary" onClick={handleHolidayFormSubmit}>
                {editingHoliday ? 'Save Changes' : 'Create Holiday'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Holiday Delete Confirmation */}
          <Dialog open={holidayDeleteConfirmOpen} onClose={() => setHolidayDeleteConfirmOpen(false)}>
            <DialogTitle>Deactivate Holiday?</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Are you sure you want to deactivate/delete this holiday?
              </Typography>
              <Alert severity="warning">
                This holiday will no longer be active and its dates will not affect future task/project calculation sweeps, which will shift dates back!
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setHolidayDeleteConfirmOpen(false)}>Cancel</Button>
              <Button variant="contained" color="error" onClick={handleHolidayDeleteSubmit}>
                Yes, Deactivate
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          TAB 1: COMPANY EVENTS
          ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, alignSelf: 'center' }}>
              Company Events Library
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={openEventCreate}
              size="small"
            >
              Add Event
            </Button>
          </Box>

          {eventsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : eventsData?.events && eventsData.events.length > 0 ? (
            <TableContainer component={Paper} elevation={1}>
              <Table sx={{ minWidth: 650 }} aria-label="company events table">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Dates</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Timing</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Affects Schedule</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {eventsData.events.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: row.color || '#8B5CF6' }} />
                          {row.title}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {row.startDate} {row.endDate ? `to ${row.endDate}` : ''}
                      </TableCell>
                      <TableCell>
                        {row.isAllDay ? (
                          <Chip label="All Day" size="small" variant="outlined" color="primary" />
                        ) : (
                          `${row.startTime || ''} - ${row.endTime || ''}`
                        )}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{row.color || '#8B5CF6'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.affectsWorkingDays ? 'Yes' : 'No'}
                          size="small"
                          color={row.affectsWorkingDays ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <IconButton size="small" onClick={() => openEventEdit(row)} title="Edit">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => triggerEventDelete(row.id)} title="Delete">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              No company events registered. Click "Add Event" to add a new event (celebrations, training, meetings).
            </Paper>
          )}

          {/* Event Dialog Form */}
          <Dialog open={eventModalOpen} onClose={() => setEventModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>{editingEvent ? 'Edit Company Event' : 'Create Company Event'}</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Event Title"
                    fullWidth
                    required
                    value={eventForm.title || ''}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Start Date"
                    type="date"
                    fullWidth
                    required
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={eventForm.startDate || ''}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="End Date (Optional)"
                    type="date"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={eventForm.endDate || ''}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={eventForm.isAllDay ?? true}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, isAllDay: e.target.checked }))}
                      />
                    }
                    label="All Day Event"
                  />
                </Grid>
                {!eventForm.isAllDay && (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Start Time"
                        type="time"
                        fullWidth
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={eventForm.startTime || '09:00'}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, startTime: e.target.value }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="End Time"
                        type="time"
                        fullWidth
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={eventForm.endTime || '10:00'}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, endTime: e.target.value }))}
                      />
                    </Grid>
                  </>
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TextField
                      label="Event Badge Color"
                      type="color"
                      sx={{ width: 64, height: 56, flexShrink: 0, '& input': { p: 0, height: '100%', cursor: 'pointer' } }}
                      value={eventForm.color || '#8B5CF6'}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, color: e.target.value }))}
                    />
                    <TextField
                      label="Color Hex Code"
                      fullWidth
                      value={eventForm.color || ''}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, color: e.target.value }))}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TextField
                      label="Event Text Color"
                      type="color"
                      sx={{ width: 64, height: 56, flexShrink: 0, '& input': { p: 0, height: '100%', cursor: 'pointer' } }}
                      value={eventForm.textColor || '#ffffff'}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, textColor: e.target.value }))}
                    />
                    <TextField
                      label="Text Color Hex Code"
                      fullWidth
                      value={eventForm.textColor || ''}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, textColor: e.target.value }))}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Description"
                    fullWidth
                    required
                    multiline
                    rows={3}
                    value={eventForm.description || ''}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={eventForm.affectsWorkingDays ?? false}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, affectsWorkingDays: e.target.checked }))}
                        color="warning"
                      />
                    }
                    label="Affects Work Schedules (Blocks production work for these days)"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setEventModalOpen(false)}>Cancel</Button>
              <Button variant="contained" color="primary" onClick={handleEventFormSubmit}>
                {editingEvent ? 'Save Changes' : 'Create Event'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Event Delete Dialog */}
          <Dialog open={eventDeleteConfirmOpen} onClose={() => setEventDeleteConfirmOpen(false)}>
            <DialogTitle>Delete Event?</DialogTitle>
            <DialogContent>
              <Typography variant="body2">
                Are you sure you want to delete this event? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEventDeleteConfirmOpen(false)}>Cancel</Button>
              <Button variant="contained" color="error" onClick={handleEventDeleteSubmit}>
                Yes, Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          TAB 2: SHIFT AND WORK DAYS
          ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 2 && (
        <Card sx={{ maxWidth: 800 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
              Office Timings & Operating Days Setup
            </Typography>

            <Grid container spacing={3.5}>
              {/* Working Days */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Working Days (Active Production Work Days)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {daysOfWeek.map((day) => {
                    const isWorking = settingsForm.workingDays?.split(',').includes(day);
                    return (
                      <Chip
                        key={day}
                        label={day}
                        color={isWorking ? 'primary' : 'default'}
                        variant={isWorking ? 'filled' : 'outlined'}
                        onClick={() => toggleWorkingDay(day)}
                        sx={{ px: 1, py: 2, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                      />
                    );
                  })}
                </Box>
              </Grid>

              {/* Weekend Days */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Weekend Days (Non-Working/Overtime Warning Days)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {daysOfWeek.map((day) => {
                    const isWeekend = settingsForm.weekendDays?.split(',').includes(day);
                    return (
                      <Chip
                        key={day}
                        label={day}
                        color={isWeekend ? 'secondary' : 'default'}
                        variant={isWeekend ? 'filled' : 'outlined'}
                        onClick={() => toggleWeekendDay(day)}
                        sx={{ px: 1, py: 2, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                      />
                    );
                  })}
                </Box>
              </Grid>

              {/* Time Setup */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Office Operations Start Time"
                  type="time"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={settingsForm.officeStartTime || '09:00'}
                  onChange={(e) => handleSettingsFieldChange('officeStartTime', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Office Operations End Time"
                  type="time"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={settingsForm.officeEndTime || '18:00'}
                  onChange={(e) => handleSettingsFieldChange('officeEndTime', e.target.value)}
                />
              </Grid>

              {/* Working Hours */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Default Daily Hours"
                  type="number"
                  fullWidth
                  slotProps={{ htmlInput: { step: 0.5, min: 1, max: 24 } }}
                  value={settingsForm.defaultDailyHours ?? 8.0}
                  onChange={(e) => handleSettingsFieldChange('defaultDailyHours', parseFloat(e.target.value) || 8.0)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Productive Working Hours Per Day"
                  type="number"
                  fullWidth
                  slotProps={{ htmlInput: { step: 0.5, min: 1, max: 24 } }}
                  value={settingsForm.workingHoursPerDay ?? 8.0}
                  onChange={(e) => handleSettingsFieldChange('workingHoursPerDay', parseFloat(e.target.value) || 8.0)}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveGeneralSettings}
                  disabled={updateSettingsMut.isPending}
                >
                  Save Timings & Working Days
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          TAB 3: COLORS & CATEGORY VISIBILITY FLAGS
          ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 3 && (
        <Card sx={{ maxWidth: 800 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
              Global Calendar Visibility & Colors
            </Typography>

            <Grid container spacing={3}>
              {/* Feature Flags */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                  Calendar Event Categories Toggle (Turn features on/off globally)
                </Typography>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settingsForm.enableHolidays ?? true}
                          onChange={(e) => handleSettingsFieldChange('enableHolidays', e.target.checked)}
                        />
                      }
                      label="Show Company Holidays"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settingsForm.enableCompanyEvents ?? true}
                          onChange={(e) => handleSettingsFieldChange('enableCompanyEvents', e.target.checked)}
                        />
                      }
                      label="Show Company Events"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settingsForm.enableBirthdays ?? true}
                          onChange={(e) => handleSettingsFieldChange('enableBirthdays', e.target.checked)}
                        />
                      }
                      label="Show Birthdays"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settingsForm.enableTaskEvents ?? true}
                          onChange={(e) => handleSettingsFieldChange('enableTaskEvents', e.target.checked)}
                        />
                      }
                      label="Show Task Deadlines"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settingsForm.enableProjectEvents ?? true}
                          onChange={(e) => handleSettingsFieldChange('enableProjectEvents', e.target.checked)}
                        />
                      }
                      label="Show Project Timelines"
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Color Coding Preferences */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                  Calendar Color Palette Configuration
                </Typography>

                <Grid container spacing={2.5}>
                  {/* Holidays Color */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <TextField
                        type="color"
                        sx={{ width: 48, height: 48, flexShrink: 0, '& input': { p: 0, height: '100%', cursor: 'pointer' } }}
                        value={settingsForm.colorHoliday || '#EF4444'}
                        onChange={(e) => handleSettingsFieldChange('colorHoliday', e.target.value)}
                      />
                      <TextField
                        label="Holidays Color (Hex)"
                        fullWidth
                        value={settingsForm.colorHoliday || ''}
                        onChange={(e) => handleSettingsFieldChange('colorHoliday', e.target.value)}
                      />
                    </Box>
                  </Grid>

                  {/* Birthdays Color */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <TextField
                        type="color"
                        sx={{ width: 48, height: 48, flexShrink: 0, '& input': { p: 0, height: '100%', cursor: 'pointer' } }}
                        value={settingsForm.colorBirthday || '#EC4899'}
                        onChange={(e) => handleSettingsFieldChange('colorBirthday', e.target.value)}
                      />
                      <TextField
                        label="Birthdays Color (Hex)"
                        fullWidth
                        value={settingsForm.colorBirthday || ''}
                        onChange={(e) => handleSettingsFieldChange('colorBirthday', e.target.value)}
                      />
                    </Box>
                  </Grid>

                  {/* Tasks Color */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <TextField
                        type="color"
                        sx={{ width: 48, height: 48, flexShrink: 0, '& input': { p: 0, height: '100%', cursor: 'pointer' } }}
                        value={settingsForm.colorTask || '#3B82F6'}
                        onChange={(e) => handleSettingsFieldChange('colorTask', e.target.value)}
                      />
                      <TextField
                        label="Tasks Color (Hex)"
                        fullWidth
                        value={settingsForm.colorTask || ''}
                        onChange={(e) => handleSettingsFieldChange('colorTask', e.target.value)}
                      />
                    </Box>
                  </Grid>

                  {/* Projects Color */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <TextField
                        type="color"
                        sx={{ width: 48, height: 48, flexShrink: 0, '& input': { p: 0, height: '100%', cursor: 'pointer' } }}
                        value={settingsForm.colorProject || '#10B981'}
                        onChange={(e) => handleSettingsFieldChange('colorProject', e.target.value)}
                      />
                      <TextField
                        label="Projects Color (Hex)"
                        fullWidth
                        value={settingsForm.colorProject || ''}
                        onChange={(e) => handleSettingsFieldChange('colorProject', e.target.value)}
                      />
                    </Box>
                  </Grid>

                  {/* Company Events Color */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <TextField
                        type="color"
                        sx={{ width: 48, height: 48, flexShrink: 0, '& input': { p: 0, height: '100%', cursor: 'pointer' } }}
                        value={settingsForm.colorCompanyEvent || '#8B5CF6'}
                        onChange={(e) => handleSettingsFieldChange('colorCompanyEvent', e.target.value)}
                      />
                      <TextField
                        label="Company Events Color (Hex)"
                        fullWidth
                        value={settingsForm.colorCompanyEvent || ''}
                        onChange={(e) => handleSettingsFieldChange('colorCompanyEvent', e.target.value)}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveColorPreferences}
                  disabled={updateSettingsMut.isPending}
                >
                  Save Colors & Categories
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Snackbar alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CalendarConfigPage;
