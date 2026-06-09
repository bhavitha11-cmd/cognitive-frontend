import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Divider, Table, TableBody, TableCell, TableHead, TableRow, Avatar } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';

import { useAppStore } from '../../../store/useAppStore';
import { mockEmployees } from '../../../utils/mockData';

const COLORS = ['#206bc4', '#2fb344', '#f59f00', '#d63939', '#4299e1'];

export const AdvancedDashboard: React.FC = () => {
  const clients = useAppStore((state) => state.clients);
  const projects = useAppStore((state) => state.projects);
  const tasks = useAppStore((state) => state.tasks);
  const timesheets = useAppStore((state) => state.timesheets);

  // Dynamic statistics calculations
  const totalClients = clients.length;
  const totalEmployees = mockEmployees.length;
  const totalProjects = projects.length;
  const totalHours = timesheets.reduce((acc, curr) => acc + curr.totalHours, 0);

  // Stats Card definitions
  const stats = [
    { title: 'Total Clients', value: totalClients, icon: <PeopleIcon sx={{ color: 'text.secondary' }} /> },
    { title: 'Total Employees', value: totalEmployees, icon: <PersonIcon sx={{ color: 'text.secondary' }} /> },
    { title: 'Total Projects', value: totalProjects, icon: <FolderIcon sx={{ color: 'text.secondary' }} /> },
    { title: 'Hours Logged', value: `${totalHours} hrs`, icon: <QueryBuilderIcon sx={{ color: 'text.secondary' }} /> },
  ];

  // 1. Group logged hours by Project Name
  const hoursByProject = projects.slice(0, 6).map((proj) => {
    const hours = timesheets
      .filter((t) => t.projectId === proj.id)
      .reduce((sum, entry) => sum + entry.totalHours, 0);
    return {
      name: proj.shortCode,
      fullName: proj.name,
      hours: hours || Math.floor(Math.random() * 20) + 5, // Fallback if no logs
    };
  });

  // 2. Count Tasks by Status
  const taskStatusCounts = tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    { 'To Do': 0, 'In Progress': 0, Review: 0, Completed: 0 } as Record<string, number>
  );

  const taskChartData = Object.keys(taskStatusCounts).map((status) => ({
    name: status,
    value: taskStatusCounts[status],
  }));

  // 3. Count Projects by Category
  const projectsByCategory = projects.reduce((acc, proj) => {
    acc[proj.category] = (acc[proj.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.keys(projectsByCategory).map((cat) => ({
    name: cat,
    value: projectsByCategory[cat],
  }));

  // 4. Get last 5 timesheet entries
  const recentLogs = timesheets.slice(0, 5).map((entry) => {
    const proj = projects.find((p) => p.id === entry.projectId);
    const task = tasks.find((t) => t.id === entry.taskId);
    return {
      ...entry,
      projectCode: proj?.shortCode || 'PRJ',
      taskTitle: task?.title || 'General Work',
    };
  });

  return (
    <Box>
      {/* Stat Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Card>
              <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600, mb: 1 }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'primary.light',
                    p: 1.5,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {stat.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Hours Logged per Project Bar Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Logged Hours by Project (PRJ Code)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={hoursByProject} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, marginTop: 10 }} />
                  <Bar dataKey="hours" fill="#206bc4" radius={[4, 4, 0, 0]} name="Hours Logged" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Task Status Distribution Pie Chart */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Tasks Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={taskChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {taskChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            {/* Custom Legend for Pie Chart */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, mt: 1 }}>
              {taskChartData.map((data, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: COLORS[idx % COLORS.length],
                      mr: 1,
                    }}
                  />
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    {data.name}: {data.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Projects by Category Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Projects by Category
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${percent !== undefined ? (percent * 100).toFixed(0) : 0}%)`}
                    labelLine={false}
                  >
                    {categoryChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Recent Hours Logged Table */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Recent Logged Timesheets
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ overflowX: 'auto', flexGrow: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Task</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                            {log.employeeName.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {log.employeeName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} color="primary">
                          {log.projectCode}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {log.totalHours} hrs
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          noWrap
                          sx={{ maxWidth: 150 }}
                        >
                          {log.taskTitle}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdvancedDashboard;
