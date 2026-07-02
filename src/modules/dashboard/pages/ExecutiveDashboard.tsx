import React from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Divider, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import GroupIcon from '@mui/icons-material/Group';
import BarChartIcon from '@mui/icons-material/BarChart';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

import {
  useGetExecutiveSummary,
  useGetExecutiveCharts,
  useGetExecutiveRecentActivities
} from '../services/dashboardService';

import WidgetErrorBoundary from '../components/WidgetErrorBoundary';
import { CardSkeleton, ListSkeleton } from '../components/DashboardSkeletons';

export const ExecutiveDashboard: React.FC = () => {
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetExecutiveSummary();
  const { data: charts, refetch: refetchCharts } = useGetExecutiveCharts();
  const { data: activities = [], isLoading: activitiesLoading, refetch: refetchActivities } = useGetExecutiveRecentActivities();

  // Remaining Hours = Planned - Actual
  const remainingHours = Math.max(0, (summary?.plannedHours ?? 0) - (summary?.actualHours ?? 0));
  const workedPercentage = summary?.plannedHours && summary.plannedHours > 0 
    ? ((summary.actualHours / summary.plannedHours) * 100).toFixed(1) 
    : '0.0';

  // Real data calculations
  const overBudgetCount = (charts?.plannedVsActual ?? []).filter((p: any) => p.actualHours > p.plannedHours).length;
  const estimatedRevenue = summary?.actualHours ? (summary.actualHours * 1000) : 0;
  const formattedRevenue = estimatedRevenue >= 100000 
    ? `₹${(estimatedRevenue / 100000).toFixed(2)} L` 
    : `₹${estimatedRevenue.toLocaleString()}`;

  const kpis = [
    { title: 'TOTAL PROJECTS', value: summary?.totalProjects ?? 0, desc: `${summary?.activeProjects ?? 0} Active Projects`, color: '#206bc4', icon: <FolderIcon sx={{ color: '#ffffff' }} /> },
    { title: 'PLANNED HOURS', value: (summary?.plannedHours ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 }), desc: 'Total Planned', color: '#4299e1', icon: <AccessTimeIcon sx={{ color: '#ffffff' }} /> },
    { title: 'WORKED HOURS', value: (summary?.actualHours ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 }), desc: `${workedPercentage}% of Planned`, color: '#2fb344', icon: <CheckCircleIcon sx={{ color: '#ffffff' }} /> },
    { title: 'REMAINING HOURS', value: remainingHours.toLocaleString(undefined, { maximumFractionDigits: 0 }), desc: 'To Complete', color: '#f59f00', icon: <WarningAmberIcon sx={{ color: '#ffffff' }} /> },
    { title: 'UTILIZATION', value: `${summary?.companyUtilizationPercentage ?? 0}%`, desc: 'Overall Utilization', color: '#00bcd4', icon: <GroupIcon sx={{ color: '#ffffff' }} /> },
    { title: 'UTILIZATION %', value: `${(summary?.companyUtilizationPercentage ?? 0).toFixed(1)}%`, desc: 'Company Utilization', color: '#2fb344', icon: <BarChartIcon sx={{ color: '#ffffff' }} /> },
    { title: 'COMPLETED PROJECTS', value: summary?.completedProjects ?? 0, desc: 'This Month', color: '#16a34a', icon: <CheckCircleIcon sx={{ color: '#ffffff' }} /> },
    { title: 'DELAYED PROJECTS', value: summary?.delayedProjects ?? 0, desc: 'Needs Attention', color: '#d63939', icon: <WarningAmberIcon sx={{ color: '#ffffff' }} /> },
    { title: 'OVER BUDGET PROJECTS', value: overBudgetCount, desc: 'Over Planned Hours', color: '#f76707', icon: <ReceiptIcon sx={{ color: '#ffffff' }} /> },
    { title: 'PENDING TIMESHEETS', value: summary?.pendingTimesheetsCount ?? 0, desc: 'Timesheet Approvals', color: '#f59f00', icon: <AssignmentIcon sx={{ color: '#ffffff' }} /> },
    { title: 'EMPLOYEES', value: summary?.employeesWorkingToday ?? 0, desc: 'Active Attendance', color: '#ae3ec9', icon: <GroupIcon sx={{ color: '#ffffff' }} /> },
    { title: 'REVENUE (EST.)', value: formattedRevenue, desc: 'Based on Logged Hours', color: '#2fb344', icon: <CurrencyRupeeIcon sx={{ color: '#ffffff' }} /> },
  ];

  // 1. Project Health Pie Chart from Real Data
  const projectHealthData = (charts?.projectStatuses ?? []).map((s: any) => ({
    name: s.status,
    value: s.count,
    color: s.status === 'Completed' || s.status === 'On Track' ? '#2fb344' : s.status === 'In Progress' ? '#206bc4' : s.status === 'On Hold' ? '#f59f00' : '#d63939'
  }));

  // 2. Employee Utilization Bar Chart from Real Data
  const employeeUtilizationData = (charts?.employeeUtilization ?? []).map((e: any) => ({
    name: e.employeeName,
    utilization: e.utilizationPercentage
  }));

  // 3. Department Hours Pie Chart from Real Data
  const departmentHoursData = (charts?.departmentPerformances ?? []).map((d: any, idx: number) => ({
    name: d.departmentName,
    value: d.actualHours,
    color: ['#206bc4', '#2fb344', '#f59f00', '#ae3ec9', '#00bcd4'][idx % 5]
  }));

  // 4. Hours Burn Trend Line Chart from Real Data
  const weeklyHoursTrend = (charts?.hoursBurnTrend ?? []).map((b: any) => ({
    name: b.date,
    hours: b.hoursLogged
  }));

  // 5. Projects At Risk Table from Real Data
  const projectsAtRisk = (charts?.plannedVsActual ?? [])
    .filter((p: any) => p.actualHours > p.plannedHours)
    .map((p: any) => {
      const diff = p.actualHours - p.plannedHours;
      const pct = p.plannedHours > 0 ? ((diff / p.plannedHours) * 100).toFixed(1) : '0';
      return {
        name: p.projectName,
        customer: p.projectCode || p.projectName || '—',
        planned: p.plannedHours,
        actual: p.actualHours,
        remaining: p.plannedHours - p.actualHours,
        var: `+${pct}%`,
        status: 'Over Budget',
        color: '#d63939'
      };
    });

  const handleRefreshAll = () => {
    refetchSummary();
    refetchCharts();
    refetchActivities();
  };

  return (
    <Box sx={{ bgcolor: '#090d16', color: '#ffffff', minHeight: '100vh', p: 3 }}>
      
      {/* Top Header Filter Bar */}
      <Card sx={{ mb: 3, p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '0.5px' }}>Executive Dashboard</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Real-time overview of projects, resources and performance</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', alignItems: 'center' }}>
            <TextField
              select
              size="small"
              defaultValue="This Month"
              slotProps={{ select: { native: true }, input: { sx: { color: '#ffffff', bgcolor: '#161f30', borderColor: '#222d4a' } } }}
            >
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Quarter">This Quarter</option>
            </TextField>
            <Button variant="outlined" size="small" sx={{ borderColor: '#1d243a', color: '#ffffff' }} onClick={handleRefreshAll}>
              Refresh Dashboard
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* KPI Cards Grid */}
      <WidgetErrorBoundary title="Executive summary cards" onRetry={refetchSummary}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {summaryLoading ? (
            Array.from({ length: 12 }).map((_, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 2 }} key={idx}>
                <CardSkeleton />
              </Grid>
            ))
          ) : (
            kpis.map((kpi: any, idx: number) => (
              <Grid size={{ xs: 12, sm: 6, md: 2 }} key={idx}>
                <Card sx={{ height: '100%', bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff' }}>
                  <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: kpi.color, p: 1, borderRadius: 1.5, display: 'flex', alignItems: 'center' }}>
                      {kpi.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.6875rem', display: 'block' }}>
                        {kpi.title}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', my: 0.2 }}>
                        {kpi.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        {kpi.desc}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </WidgetErrorBoundary>

      {/* Row 1 Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Project Health Donut */}
        <Grid size={{ xs: 12, md: 3 }}>
          <WidgetErrorBoundary title="Project Health Chart" onRetry={refetchCharts}>
            <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PROJECT HEALTH</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
              {projectHealthData.length === 0 ? (
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No project data in database</Box>
              ) : (
                <>
                  <Box sx={{ position: 'relative', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="99%" height={220} minHeight={200}>
                      <PieChart>
                        <Pie
                          data={projectHealthData}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {projectHealthData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>{summary?.totalProjects ?? 0}</Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>Total Projects</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                    {projectHealthData.map((d: any, i: number) => (
                      <Box key={i} sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: d.color, fontWeight: 700, display: 'block' }}>● {d.name}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{d.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Card>
          </WidgetErrorBoundary>
        </Grid>

        {/* Planned vs Actual top 7 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WidgetErrorBoundary title="Planned vs Actual Hours" onRetry={refetchCharts}>
            <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PLANNED VS ACTUAL HOURS (Top 7 Projects)</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
              {(!charts?.plannedVsActual || charts.plannedVsActual.length === 0) ? (
                <Box sx={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No project data logged</Box>
              ) : (
                <ResponsiveContainer width="99%" height={300} minHeight={0}>
                  <BarChart data={charts?.plannedVsActual?.slice(0, 7) ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d243a" />
                    <XAxis dataKey="projectCode" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#121824', borderColor: '#1d243a' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="plannedHours" fill="#206bc4" name="Planned Hours" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="actualHours" fill="#f59f00" name="Actual Hours" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </WidgetErrorBoundary>
        </Grid>

        {/* Hours Burn Line */}
        <Grid size={{ xs: 12, md: 3 }}>
          <WidgetErrorBoundary title="Hours Burn Trend" onRetry={refetchCharts}>
            <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>HOURS BURN TREND (This Week)</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
              {weeklyHoursTrend.length === 0 ? (
                <Box sx={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No logs this week</Box>
              ) : (
                <ResponsiveContainer width="99%" height={300} minHeight={0}>
                  <LineChart data={weeklyHoursTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d243a" />
                    <XAxis dataKey="name" tickFormatter={(t) => t.slice(0, 3)} stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="hours" stroke="#4299e1" strokeWidth={3} dot={{ fill: '#4299e1', r: 4 }} name="Hours Logged" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </WidgetErrorBoundary>
        </Grid>
      </Grid>

      {/* Row 2 Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Employee Utilization */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 320 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>EMPLOYEE UTILIZATION</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
            {employeeUtilizationData.length === 0 ? (
              <Box sx={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No employees active</Box>
            ) : (
              <ResponsiveContainer width="99%" height={280} minHeight={0}>
                <BarChart data={employeeUtilizationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d243a" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} />
                  <Tooltip />
                  <Bar dataKey="utilization" fill="#2fb344" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>

        {/* Task Status Donut */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 320, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TASK STATUS</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              No tasks found in database
            </Box>
          </Card>
        </Grid>

        {/* Hours By Department Donut */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 320, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>HOURS BY DEPARTMENT</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
            {departmentHoursData.length === 0 ? (
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No logs by department</Box>
            ) : (
              <>
                <Box sx={{ position: 'relative', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="99%" height={180} minHeight={160}>
                    <PieChart>
                      <Pie
                        data={departmentHoursData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {departmentHoursData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{(summary?.actualHours ?? 0).toLocaleString()}</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6875rem' }}>Total Hours</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                  {departmentHoursData.map((d: any, i: number) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                        <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>{d.name.slice(0, 18)}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6875rem' }}>{d.value.toFixed(0)}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Card>
        </Grid>

        {/* Hours By Customer */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 320 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>HOURS BY CLIENT (MTD)</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
            <Box sx={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Omitted mock clients</Box>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3 Tables */}
      <Grid container spacing={3}>
        {/* Projects At Risk */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 300 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PROJECTS OVER BUDGET / AT RISK</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            {projectsAtRisk.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>All active projects are within budget</Box>
            ) : (
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Project Name</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Code</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Planned Hours</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Actual Hours</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Remaining</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Overrun %</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projectsAtRisk.map((p: any, idx: number) => (
                      <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{p.name}</TableCell>
                        <TableCell sx={{ color: '#94a3b8' }}>{p.customer}</TableCell>
                        <TableCell align="right" sx={{ color: '#ffffff' }}>{p.planned}</TableCell>
                        <TableCell align="right" sx={{ color: '#ffffff' }}>{p.actual}</TableCell>
                        <TableCell align="right" sx={{ color: p.remaining < 0 ? '#ef4444' : '#ffffff' }}>{p.remaining}</TableCell>
                        <TableCell align="right" sx={{ color: p.remaining < 0 ? '#ef4444' : '#10b981' }}>{p.var}</TableCell>
                        <TableCell>
                          <Chip label={p.status} size="small" sx={{ bgcolor: p.color, color: '#ffffff', fontSize: '0.6875rem', fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WidgetErrorBoundary title="Recent Activities" onRetry={refetchActivities}>
            <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 300 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>RECENT SYSTEM ACTIVITIES</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
              {activities.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>No recent activities logged in DB</Box>
              ) : (
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                        <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Activity</TableCell>
                        <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Project / Entity</TableCell>
                        <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>User</TableCell>
                        <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activitiesLoading ? (
                        <TableRow><TableCell colSpan={4}><ListSkeleton /></TableCell></TableRow>
                      ) : (
                        activities.slice(0, 5).map((act: any, idx: number) => (
                          <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                            <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{act.action}</TableCell>
                            <TableCell sx={{ color: '#4299e1' }}>{act.entityCode}</TableCell>
                            <TableCell sx={{ color: '#ffffff' }}>{act.performedByName}</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>{new Date(act.timestamp).toLocaleTimeString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </WidgetErrorBoundary>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExecutiveDashboard;
