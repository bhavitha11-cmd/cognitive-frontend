import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Divider } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

import { useAppStore } from '../../../store/useAppStore';
import { EmptyState } from '../../../components/EmptyState';
import { mockEmployees } from '../../../utils/mockData';

export const PrivateDashboard: React.FC = () => {
  const clients = useAppStore((state) => state.clients);
  const projects = useAppStore((state) => state.projects);
  const tasks = useAppStore((state) => state.tasks);
  const timesheets = useAppStore((state) => state.timesheets);

  // Dynamic statistics calculations
  const totalClients = clients.length;
  const totalEmployees = mockEmployees.length;
  const totalProjects = projects.length;
  
  const totalHours = timesheets.reduce((acc, curr) => acc + curr.totalHours, 0);
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed').length;
  const unresolvedTickets = 0; // standard mock ticket count

  const stats = [
    { title: 'Total Clients', value: totalClients, icon: <PeopleIcon sx={{ color: 'text.secondary' }} /> },
    { title: 'Total Employees', value: totalEmployees, icon: <PersonIcon sx={{ color: 'text.secondary' }} /> },
    { title: 'Total Projects', value: totalProjects, icon: <FolderIcon sx={{ color: 'text.secondary' }} /> },
    {
      title: 'Hours Logged',
      value: `${totalHours} hrs`,
      icon: <QueryBuilderIcon sx={{ color: 'text.secondary' }} />,
    },
    { title: 'Pending Tasks', value: pendingTasks, icon: <PlaylistAddCheckIcon sx={{ color: 'text.secondary' }} />, tooltip: 'Tasks not completed' },
    { title: 'Today Attendance', value: `0/${totalEmployees}`, icon: <CalendarMonthIcon sx={{ color: 'text.secondary' }} /> },
    { title: 'Unresolved Tickets', value: unresolvedTickets, icon: <ConfirmationNumberIcon sx={{ color: 'text.secondary' }} /> },
  ];

  return (
    <Box>
      {/* Stat Cards Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3, lg: 1.71 }} key={idx} sx={{ minWidth: 150 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    {stat.title}
                  </Typography>
                  {stat.icon}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }} color="primary">
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Dash Panel Widgets */}
      <Grid container spacing={3}>
        {/* Timesheet Panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Timesheet
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                title="- Not enough data -"
                description="Insufficient data logged to draw timesheet analytics."
              />
            </Box>
          </Card>
        </Grid>

        {/* Pending Leaves Panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Pending Leaves
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                title="- No record found -"
                description="No employee leave requests are pending approval."
              />
            </Box>
          </Card>
        </Grid>

        {/* Open Tickets Panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: 350, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Open Tickets
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                title="- No record found -"
                description="There are currently no active support tickets open."
              />
            </Box>
          </Card>
        </Grid>

        {/* Pending Tasks Panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: 350, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Pending Tasks
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                title="- No record found -"
                description="No pending tasks assigned directly to your profile."
              />
            </Box>
          </Card>
        </Grid>

        {/* Document Expiries Panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: 350, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Document Expiries
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                title="- No upcoming document expiries -"
                description="All corporate, tax, and employee agreements are valid."
              />
            </Box>
          </Card>
        </Grid>

        {/* Project Activity Timeline Panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: 350, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Project Activity Timeline
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                title="- No record found -"
                description="No recent project check-ins or commits logged."
              />
            </Box>
          </Card>
        </Grid>

        {/* User Activity Timeline Panel */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Card sx={{ height: 300, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                User Activity Timeline
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                title="- No record found -"
                description="There are no recent actions or sessions logged for this profile."
              />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PrivateDashboard;
