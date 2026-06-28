import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Divider, Table, TableBody, TableCell, TableHead, TableRow, Chip, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useNavigate } from 'react-router';
import { useGetDashboardStats, useGetPlanVsActual, useGetUtilization, useGetOverdueTasks, useGetScopeDistribution } from '../services/dashboardService';
import { useAuthStore } from '../../../store/useAuthStore';
import { EmptyState } from '../../../components/EmptyState';

const PIE_COLORS = ['#206bc4', '#2fb344', '#f59f00', '#d63939', '#4299e1', '#ae3ec9', '#17a2b8', '#6c757d'];

const EmployeeHome: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Welcome back, {user?.firstName || 'there'}!
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
        Here's your workspace. Use the navigation on the left to access your tasks and timesheets.
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate('/tasks')}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Box sx={{ bgcolor: 'primary.light', p: 1.5, borderRadius: 2 }}>
                <AssignmentIcon color="primary" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>My Tasks</Typography>
                <Typography variant="body2" color="textSecondary">View and update your assigned tasks</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate('/timesheets')}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Box sx={{ bgcolor: 'success.light', p: 1.5, borderRadius: 2 }}>
                <AccessTimeIcon color="success" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>My Timesheets</Typography>
                <Typography variant="body2" color="textSecondary">Log time entries against your tasks</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export const AdvancedDashboard: React.FC = () => {
  const canViewAnalytics = useAuthStore((s) => {
    const isSuperAdmin = s.roleCodes.some((c) =>
      ['ADMIN', 'CEO', 'CHIEF_EXECUTIVE_OFFICER', 'ADMINISTRATOR'].includes(c)
    );
    if (isSuperAdmin) return true;
    const perm = s.permissions.find((p) => p.module_name.toLowerCase() === 'analytics');
    return perm?.can_view ?? false;
  });

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: planVsActual, isLoading: planLoading } = useGetPlanVsActual();
  const { data: utilData, isLoading: utilLoading } = useGetUtilization();
  const { data: overdueTasks = [], isLoading: overdueLoading } = useGetOverdueTasks();
  const { data: scopeData = [] } = useGetScopeDistribution();

  if (!canViewAnalytics) {
    return <EmployeeHome />;
  }

  const isLoading = statsLoading || planLoading || utilLoading || overdueLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    { title: 'Total Clients', value: stats?.totalClients ?? 0, icon: <PeopleIcon sx={{ color: 'text.secondary' }} /> },
    { title: 'Total Employees', value: stats?.totalEmployees ?? 0, icon: <PersonIcon sx={{ color: 'text.secondary' }} /> },
    { title: 'Total Projects', value: stats?.totalProjects ?? 0, icon: <FolderIcon sx={{ color: 'text.secondary' }} /> },
    { title: 'Hours Logged', value: `${stats?.totalActualHours ?? 0} hrs`, icon: <QueryBuilderIcon sx={{ color: 'text.secondary' }} /> },
  ];

  const taskStatusData = [
    { name: 'Pending', value: stats?.pendingTasks ?? 0 },
    { name: 'In Progress', value: stats?.inProgressTasks ?? 0 },
    { name: 'Completed', value: stats?.completedTasks ?? 0 },
    { name: 'Overdue', value: stats?.overdueTasks ?? 0 },
  ];

  const categoryMap = new Map<string, { name: string; estimated: number; actual: number }>();
  scopeData.forEach((s) => {
    const cat = s.departmentCategory || 'Uncategorized';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { name: cat, estimated: 0, actual: 0 });
    }
    const entry = categoryMap.get(cat)!;
    entry.estimated += s.estimatedHours;
    entry.actual += s.actualHours;
  });
  const categoryChartData = Array.from(categoryMap.values());

  const topEmployees = [...(utilData?.employees ?? [])]
    .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage)
    .slice(0, 5);

  const projectHours = planVsActual?.projects.map((p) => ({
    name: p.partNumber,
    estimated: p.estimatedHours,
    actual: p.actualHours,
  })) ?? [];

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((stat, idx) => (
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
                <Box sx={{ bgcolor: 'primary.light', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stat.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Hours by Project (Estimated vs Actual)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: '100%', height: 300 }}>
              {projectHours.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
                  <BarChart data={projectHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12, marginTop: 10 }} />
                    <Bar dataKey="estimated" fill="#206bc4" radius={[4, 4, 0, 0]} name="Estimated" />
                    <Bar dataKey="actual" fill="#f59f00" radius={[4, 4, 0, 0]} name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No project data" description="No plan vs actual data available yet." />
              )}
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Task Status Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {taskStatusData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value">
                      {taskStatusData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="textSecondary">No task data</Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, mt: 1 }}>
              {taskStatusData.map((data, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: PIE_COLORS[idx % PIE_COLORS.length], mr: 1 }} />
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    {data.name}: {data.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Department Category Load
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={categoryChartData.map((d) => ({ name: d.name, value: d.actual }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {categoryChartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="textSecondary">No scope data</Typography>
              )}
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Top 5 Employees by Utilization
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ overflowX: 'auto', flexGrow: 1 }}>
              {topEmployees.length > 0 ? (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Hours Logged</TableCell>
                      <TableCell>Utilization</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topEmployees.map((emp) => (
                      <TableRow key={emp.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{emp.employeeName}</TableCell>
                        <TableCell>{emp.departmentName || '-'}</TableCell>
                        <TableCell>{emp.totalHoursLogged}h</TableCell>
                        <TableCell>
                          <Chip
                            label={`${emp.utilizationPercentage.toFixed(0)}%`}
                            size="small"
                            color={emp.utilizationPercentage >= 80 ? 'success' : emp.utilizationPercentage >= 50 ? 'warning' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1, py: 4 }}>
                  <EmptyState title="No utilization data" description="No employee utilization data available." />
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Overdue Tasks
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ overflowX: 'auto', flexGrow: 1 }}>
              {overdueTasks.length > 0 ? (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Task Code</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Project</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Days Overdue</TableCell>
                      <TableCell>Assignee</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {overdueTasks.slice(0, 10).map((task) => (
                      <TableRow key={task.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{task.taskCode}</TableCell>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>{task.projectName}</TableCell>
                        <TableCell>
                          <Chip label={task.priority} size="small" color={task.priority === 'URGENT' || task.priority === 'HIGH' ? 'error' : 'warning'} />
                        </TableCell>
                        <TableCell>
                          <Typography color="error" fontWeight={600}>{task.daysOverdue}d</Typography>
                        </TableCell>
                        <TableCell>{task.assigneeName || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                  <EmptyState title="No overdue tasks" description="All tasks are on track." />
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdvancedDashboard;
