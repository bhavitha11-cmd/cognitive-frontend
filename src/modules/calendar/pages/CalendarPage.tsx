import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

import { useAppStore } from '../../../store/useAppStore';

export const CalendarPage: React.FC = () => {
  const tasks = useAppStore((state) => state.tasks);
  const projects = useAppStore((state) => state.projects);

  // Transform Tasks & Projects into FullCalendar Event format
  const calendarEvents = useMemo(() => {
    const taskEvents = tasks.map((task) => {
      const proj = projects.find((p) => p.id === task.projectId);
      
      // Select event color based on priority
      let color = '#626973'; // Default Gray
      if (task.priority === 'High') color = '#d63939'; // Red
      if (task.priority === 'Medium') color = '#f59f00'; // Orange

      return {
        id: task.id,
        title: `[${proj?.shortCode || 'TSK'}] ${task.title}`,
        start: task.startDate,
        end: task.dueDate,
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff',
        extendedProps: {
          type: 'task',
          status: task.status,
          assignees: task.assignees,
        },
      };
    });

    const projectEvents = projects.map((proj) => {
      const color = '#206bc4'; // Blue for project deadline

      return {
        id: proj.id,
        title: `🚨 Deadline: ${proj.name}`,
        start: proj.deadline,
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff',
        extendedProps: {
          type: 'project',
          status: proj.status,
        },
      };
    });

    return [...taskEvents, ...projectEvents];
  }, [tasks, projects]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          My Calendar
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 3 }}>
          {/* Custom style wrapper to integrate FullCalendar with our theme */}
          <Box
            sx={{
              '& .fc': {
                fontFamily: 'inherit',
                color: 'text.primary',
              },
              '& .fc-theme-standard td, & .fc-theme-standard th': {
                borderColor: '#e2e8f0',
              },
              '& .fc-header-toolbar': {
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 3,
              },
              '& .fc-button-primary': {
                backgroundColor: 'primary.main',
                borderColor: 'primary.main',
                fontWeight: 600,
                fontSize: '0.8125rem',
                textTransform: 'capitalize',
                padding: '6px 12px',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  borderColor: 'primary.dark',
                },
                '&:disabled': {
                  backgroundColor: 'primary.light',
                  borderColor: 'primary.light',
                  color: 'primary.main',
                },
              },
              '& .fc-button-group > .fc-button': {
                textTransform: 'capitalize',
              },
              '& .fc-day-today': {
                backgroundColor: 'rgba(32, 107, 196, 0.04) !important',
              },
              '& .fc-event': {
                cursor: 'pointer',
                borderRadius: '4px',
                padding: '2px 4px',
                fontSize: '0.75rem',
                fontWeight: 600,
              },
              '& .fc-list-day-cushion': {
                backgroundColor: '#f8fafc',
              },
            }}
          >
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
              }}
              events={calendarEvents}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              height="70vh"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CalendarPage;
