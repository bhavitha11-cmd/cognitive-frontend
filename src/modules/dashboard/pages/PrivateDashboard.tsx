import React from 'react';
import { useNavigate } from 'react-router';
import { Grid, Card, CardContent, Typography, Box, Divider, Chip, CircularProgress, Alert, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGetDashboardStats, useGetOverdueTasks, useGetUpcomingDeadlines } from '../services/dashboardService';
import { EmptyState } from '../../../components/EmptyState';

export const PrivateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, isError: statsError } = useGetDashboardStats();
  const { data: overdueTasks = [] } = useGetOverdueTasks();
  const { data: upcomingDeadlines = [] } = useGetUpcomingDeadlines(14);

  if (statsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (statsError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load dashboard statistics. Please try again later.
      </Alert>
    );
  }

  const statCards = [
    { title: 'Total Clients', value: stats?.totalClients ?? 0, icon: <PeopleIcon sx={{ color: 'text.secondary' }} /> },
    { title: 'Total Employees', value: stats?.totalEmployees ?? 0, icon: <PersonIcon sx={{ color: 'text.secondary' }} /> },
    { title: 'Total Projects', value: stats?.totalProjects ?? 0, icon: <FolderIcon sx={{ color: 'text.secondary' }} /> },
    { title: 'Hours Logged', value: `${stats?.totalActualHours ?? 0} hrs`, icon: <QueryBuilderIcon sx={{ color: 'text.secondary' }} /> },
    { title: 'Pending Tasks', value: stats?.pendingTasks ?? 0, icon: <PlaylistAddCheckIcon sx={{ color: 'text.secondary' }} /> },
    {
      title: 'Overdue Tasks',
      value: stats?.overdueTasks ?? 0,
      icon: <WarningAmberIcon sx={{ color: (stats?.overdueTasks ?? 0) > 0 ? 'error.main' : 'text.secondary' }} />,
    },
    {
      title: 'Today Attendance',
      value: `${stats?.presentToday ?? 0} / ${stats?.activeEmployees ?? 0}`,
      icon: <CalendarMonthIcon sx={{ color: 'text.secondary' }} />,
    },
  ];

  const topOverrun = (stats?.overrunPercentage ?? 0) > 0;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((stat, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3, lg: 1.71 }} key={idx} sx={{ minWidth: 150 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {stat.title}
                  </Typography>
                  {stat.icon}
                </Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: stat.title === 'Overdue Tasks' && (stats?.overdueTasks ?? 0) > 0 ? 'error.main' : 'primary.main' }}
                >
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Plan vs Actual — Top 5 Overrun Projects
              </Typography>
              {topOverrun && (
                <Chip
                  icon={<WarningAmberIcon />}
                  label={`${stats?.overrunPercentage.toFixed(1)}% overall overrun`}
                  color="warning"
                  size="small"
                />
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
                <BarChart
                  data={(stats?.totalProjects ?? 0) > 0 ? [
                    { name: 'Estimated', hours: stats?.totalEstimatedHours ?? 0 },
                    { name: 'Actual', hours: stats?.totalActualHours ?? 0 },
                  ] : []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#206bc4" radius={[4, 4, 0, 0]} name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Quick Links
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/reports')}
              >
                View Reports
              </Button>
              <Button
                variant="outlined"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/projects')}
              >
                View All Projects
              </Button>
              <Button
                variant="outlined"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/tasks')}
              >
                View All Tasks
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ display: 'flex', flexDirection: 'column', height: 400 }}>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Overdue Tasks
              </Typography>
              {overdueTasks.length > 0 && (
                <Chip label={`${overdueTasks.length} overdue`} color="error" size="small" />
              )}
            </Box>
            <Divider />
            {overdueTasks.length > 0 ? (
              <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Task Code</TableCell>
                      <TableCell>Project</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Planned</TableCell>
                      <TableCell>Days Overdue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {overdueTasks.slice(0, 10).map((task) => (
                      <TableRow
                        key={task.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate('/tasks')}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{task.taskCode}</TableCell>
                        <TableCell>{task.projectName}</TableCell>
                        <TableCell>
                          <Chip label={task.status} size="small" color={task.status === 'OVERDUE' ? 'error' : 'warning'} />
                        </TableCell>
                        <TableCell>{task.plannedDeliveryDate ? new Date(task.plannedDeliveryDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <Typography color="error" fontWeight={600}>{task.daysOverdue}d</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmptyState title="No overdue tasks" description="All tasks are on schedule." />
              </Box>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ display: 'flex', flexDirection: 'column', height: 400 }}>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Upcoming Deadlines (Next 14 Days)
              </Typography>
              {upcomingDeadlines.length > 0 && (
                <Chip label={`${upcomingDeadlines.length} upcoming`} color="info" size="small" />
              )}
            </Box>
            <Divider />
            {upcomingDeadlines.length > 0 ? (
              <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Task Code</TableCell>
                      <TableCell>Project</TableCell>
                      <TableCell>Assignee</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingDeadlines.slice(0, 10).map((task) => (
                      <TableRow
                        key={task.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate('/tasks')}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{task.taskCode}</TableCell>
                        <TableCell>{task.projectName}</TableCell>
                        <TableCell>{task.assigneeName || '-'}</TableCell>
                        <TableCell>
                          {task.plannedDeliveryDate ? new Date(task.plannedDeliveryDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip label={task.status} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmptyState title="No upcoming deadlines" description="No tasks due in the next 14 days." />
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PrivateDashboard;
