import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, Typography, Box, Grid, Chip, CircularProgress, Alert, Divider, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventIcon from '@mui/icons-material/Event';
import { useGetOverdueTasks, useGetUpcomingDeadlines } from '../../dashboard/services/dashboardService';
import { useGetCalendarEvents } from '../../master-data/services/calendarConfigService';
import type { EventClickArg } from '@fullcalendar/core';

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const [currentRange, setCurrentRange] = useState<{ start: string; end: string }>(() => {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  });

  const { data: events = [], isLoading: eventsLoading } = useGetCalendarEvents(currentRange.start, currentRange.end);
  const { data: overdueTasks = [] } = useGetOverdueTasks();
  const { data: upcomingDeadlines = [] } = useGetUpcomingDeadlines(30);

  const handleEventClick = (info: EventClickArg) => {
    const taskCode = info.event.extendedProps?.task_code;
    if (taskCode) {
      navigate('/tasks');
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
                      slotProps={{ primary: { variant: 'body2', fontWeight: 600, color: 'error' }, secondary: { variant: 'caption', color: 'error' } }}
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
                      slotProps={{ primary: { variant: 'body2', fontWeight: 500 }, secondary: { variant: 'caption' } }}
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
    </Box>
  );
};

export default CalendarPage;
