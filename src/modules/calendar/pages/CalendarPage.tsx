import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventIcon from '@mui/icons-material/Event';
import { useGetOverdueTasks, useGetUpcomingDeadlines } from '../../dashboard/services/dashboardService';
import { useGetCalendarConfigEvents } from '../../master-data/services/calendarConfigService';
import type { EventClickArg } from '@fullcalendar/core';
import { api } from '../../../utils/api';

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const [currentRange, setCurrentRange] = useState<{ start: string; end: string }>(() => {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  });

  const { data: events = [], isLoading: eventsLoading } = useGetCalendarConfigEvents(currentRange.start, currentRange.end);
  const { data: overdueTasks = [] } = useGetOverdueTasks();
  const { data: upcomingDeadlines = [] } = useGetUpcomingDeadlines(30);

  const [selectedRisk, setSelectedRisk] = useState<{
    id: string;
    taskCode: string;
    taskTitle: string;
    employeeName: string;
    leaveStart: string;
    leaveEnd: string;
    remainingHours: number;
    riskLevel: string;
  } | null>(null);

  const [decision, setDecision] = useState<string>('PAUSE');
  const [reason, setReason] = useState<string>('');
  const [pauseClass, setPauseClass] = useState<string>('Leave');
  const [reassignTo, setReassignTo] = useState<string>('');
  const [delegateTo, setDelegateTo] = useState<string>('');
  const [employeesList, setEmployeesList] = useState<{ id: string; name: string }[]>([]);

  const handleEventClick = async (info: EventClickArg) => {
    const eventType = info.event.extendedProps?.type;
    
    if (eventType === 'task_risk') {
      const riskId = info.event.id.replace('risk-', '');
      try {
        const response = await api.get('/task-continuity/risks');
        const risks = response.data?.data?.risks || [];
        const risk = risks.find((r: any) => r.id === riskId);
        
        if (risk) {
          setSelectedRisk({
            id: risk.id,
            taskCode: risk.task_code || 'Unknown',
            taskTitle: risk.task_title || 'Unknown',
            employeeName: risk.employee_name || 'Unknown',
            leaveStart: risk.leave_start_date,
            leaveEnd: risk.leave_end_date,
            remainingHours: risk.remaining_hours,
            riskLevel: risk.risk_level,
          });
          
          const empRes = await api.get('/employees?limit=200');
          const emps = empRes.data?.data?.employees || [];
          setEmployeesList(emps.map((e: any) => ({
            id: e.id,
            name: `${e.first_name} ${e.last_name || ''}`.trim()
          })));
        }
      } catch (err) {
        console.error('Failed to load risk details', err);
      }
    } else {
      const taskCode = info.event.extendedProps?.task_code;
      if (taskCode) {
        navigate('/tasks');
      }
    }
  };

  const handleResolveSubmit = async () => {
    if (!selectedRisk) return;
    
    try {
      const payload: any = {
        decision: decision,
        reason: reason || 'Resolved via calendar UI modal',
      };
      
      if (decision === 'PAUSE') {
        payload.pause_classification = pauseClass;
      } else if (decision === 'REASSIGN' || decision === 'SPLIT') {
        payload.reassign_to_id = reassignTo;
      } else if (decision === 'DELEGATE') {
        payload.delegate_id = delegateTo;
      }
      
      await api.post(`/task-continuity/risks/${selectedRisk.id}/resolve`, payload);
      
      setSelectedRisk(null);
      setReason('');
      setReassignTo('');
      setDelegateTo('');
      
      window.location.reload();
    } catch (err) {
      console.error('Failed to resolve risk', err);
      alert('Error resolving task risk. Please check selections.');
    }
  };

  const handleDatesSet = (arg: { start: Date; end: Date }) => {
    const startStr = arg.start.toISOString().split('T')[0];
    const endStr = arg.end.toISOString().split('T')[0];
    setCurrentRange({ start: startStr, end: endStr });
  };

  const fullCalendarEvents = events.map((ev) => ({
    id: ev.id,
    title: ev.title,
    start: ev.start,
    allDay: ev.allDay,
    backgroundColor: ev.backgroundColor,
    borderColor: ev.borderColor,
    textColor: ev.textColor,
    extendedProps: ev.extendedProps,
  }));

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        My Calendar
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 9 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  '& .fc': { fontFamily: 'inherit', color: 'text.primary' },
                  '& .fc-theme-standard td, & .fc-theme-standard th': { borderColor: '#e2e8f0' },
                  '& .fc-header-toolbar': { flexWrap: 'wrap', gap: 1.5, mb: 3 },
                  '& .fc-button-primary': {
                    backgroundColor: 'primary.main',
                    borderColor: 'primary.main',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    textTransform: 'capitalize',
                    padding: '6px 12px',
                    '&:hover': { backgroundColor: 'primary.dark', borderColor: 'primary.dark' },
                    '&:disabled': { backgroundColor: 'primary.light', borderColor: 'primary.light', color: 'primary.main' },
                  },
                  '& .fc-button-group > .fc-button': { textTransform: 'capitalize' },
                  '& .fc-day-today': { backgroundColor: 'rgba(32, 107, 196, 0.04) !important' },
                  '& .fc-event': { cursor: 'pointer', borderRadius: '4px', padding: '2px 4px', fontSize: '0.75rem', fontWeight: 600 },
                  '& .fc-list-day-cushion': { backgroundColor: '#f8fafc' },
                }}
              >
                {eventsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    initialDate={now}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
                    }}
                    events={fullCalendarEvents}
                    editable={false}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    height="70vh"
                    eventClick={handleEventClick}
                    datesSet={handleDatesSet}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ mb: 2 }}>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningAmberIcon color="error" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Overdue Tasks ({overdueTasks.length})
              </Typography>
            </Box>
            <Divider />
            <List dense sx={{ maxHeight: 250, overflow: 'auto' }}>
              {overdueTasks.length > 0 ? (
                overdueTasks.slice(0, 8).map((task) => (
                  <ListItem key={task.id} component="button" onClick={() => navigate('/tasks')} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <WarningAmberIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={task.taskCode}
                      secondary={`${task.daysOverdue}d overdue`}
                      slotProps={{ primary: { variant: 'body2', sx: { fontWeight: 600 }, color: 'error' }, secondary: { variant: 'caption', color: 'error' } }}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No overdue tasks" slotProps={{ primary: { variant: 'body2', color: 'textSecondary' } }} />
                </ListItem>
              )}
            </List>
          </Card>

          <Card>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Upcoming Deadlines
              </Typography>
            </Box>
            <Divider />
            <List dense sx={{ maxHeight: 250, overflow: 'auto' }}>
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.slice(0, 8).map((task) => (
                  <ListItem key={task.id} component="button" onClick={() => navigate('/tasks')} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                    <ListItemText
                      primary={task.taskCode}
                      secondary={task.plannedDeliveryDate ? new Date(task.plannedDeliveryDate).toLocaleDateString() : ''}
                      slotProps={{ primary: { variant: 'body2', sx: { fontWeight: 500 } }, secondary: { variant: 'caption' } }}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No upcoming deadlines" slotProps={{ primary: { variant: 'body2', color: 'textSecondary' } }} />
                </ListItem>
              )}
            </List>
          </Card>
        </Grid>
      </Grid>

      {/* Task Risk Resolution Dialog */}
      <Dialog open={!!selectedRisk} onClose={() => setSelectedRisk(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Resolve Task Overlap Conflict
        </DialogTitle>
        <DialogContent dividers>
          {selectedRisk && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity={selectedRisk.riskLevel === 'HIGH' ? 'error' : 'warning'}>
                <strong>{selectedRisk.riskLevel} RISK</strong>: {selectedRisk.employeeName} is on approved leave from {selectedRisk.leaveStart} to {selectedRisk.leaveEnd} during task dates.
              </Alert>
              
              <Box>
                <Typography variant="body2" color="textSecondary">Task details:</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{selectedRisk.taskCode}: {selectedRisk.taskTitle}</Typography>
                <Typography variant="body2">Remaining Hours: {selectedRisk.remainingHours} hrs</Typography>
              </Box>
              
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel id="decision-label">Resolution Strategy</InputLabel>
                <Select
                  labelId="decision-label"
                  value={decision}
                  label="Resolution Strategy"
                  onChange={(e) => setDecision(e.target.value as string)}
                >
                  <MenuItem value="CONTINUE">Continue (Accept Risk & Proceed)</MenuItem>
                  <MenuItem value="PAUSE">Pause (Put Task On-Hold)</MenuItem>
                  <MenuItem value="REASSIGN">Reassign (Transfer Task to Another Engineer)</MenuItem>
                  <MenuItem value="SPLIT">Split (Split Remaining Hours to New Task)</MenuItem>
                  <MenuItem value="DELEGATE">Delegate (Temporarily Reassign Task)</MenuItem>
                </Select>
              </FormControl>

              {decision === 'PAUSE' && (
                <FormControl fullWidth>
                  <InputLabel id="pause-class-label">Pause Reason Classification</InputLabel>
                  <Select
                    labelId="pause-class-label"
                    value={pauseClass}
                    label="Pause Reason Classification"
                    onChange={(e) => setPauseClass(e.target.value as string)}
                  >
                    <MenuItem value="Leave">Leave</MenuItem>
                    <MenuItem value="Waiting Information">Waiting Information</MenuItem>
                    <MenuItem value="Waiting Customer">Waiting Customer</MenuItem>
                    <MenuItem value="Waiting Review">Waiting Review</MenuItem>
                    <MenuItem value="Blocked">Blocked</MenuItem>
                    <MenuItem value="Dependency">Dependency</MenuItem>
                  </Select>
                </FormControl>
              )}

              {(decision === 'REASSIGN' || decision === 'SPLIT') && (
                <FormControl fullWidth>
                  <InputLabel id="reassign-label">Reassign To</InputLabel>
                  <Select
                    labelId="reassign-label"
                    value={reassignTo}
                    label="Reassign To"
                    onChange={(e) => setReassignTo(e.target.value as string)}
                  >
                    {employeesList.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {decision === 'DELEGATE' && (
                <FormControl fullWidth>
                  <InputLabel id="delegate-label">Delegate To</InputLabel>
                  <Select
                    labelId="delegate-label"
                    value={delegateTo}
                    label="Delegate To"
                    onChange={(e) => setDelegateTo(e.target.value as string)}
                  >
                    {employeesList.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                label="Reason / Notes"
                multiline
                rows={3}
                fullWidth
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why this decision is being made..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRisk(null)}>Cancel</Button>
          <Button onClick={handleResolveSubmit} variant="contained" color="primary">
            Submit Decision
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarPage;
