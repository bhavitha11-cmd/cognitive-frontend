import React from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Divider, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar,
  TextField
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

import { useGetEmployeeSummary, useGetEmployeeCharts } from '../services/dashboardService';
import { useAuthStore } from '../../../store/useAuthStore';

import WidgetErrorBoundary from '../components/WidgetErrorBoundary';
import { CardSkeleton } from '../components/DashboardSkeletons';

export const EmployeeDashboard: React.FC = () => {
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetEmployeeSummary();
  const { data: charts, refetch: refetchCharts } = useGetEmployeeCharts();
  const { user } = useAuthStore();

  // 1. KPI Metrics
  const productivityVal = summary?.personalProductivityPercentage ?? 0.0;
  const thisMonthHoursVal = summary?.monthlyHours ?? 0.0;

  const kpis = [
    { title: 'OVERALL PERFORMANCE SCORE', value: `${productivityVal.toFixed(0)} / 100`, desc: productivityVal >= 80 ? 'Very Good' : 'Performance Rate', color: '#206bc4', icon: <EmojiEventsIcon sx={{ color: '#ffffff' }} /> },
    { title: 'PLANNED HOURS', value: '0.00', desc: 'This Month', color: '#4299e1', icon: <AccessTimeIcon sx={{ color: '#ffffff' }} /> },
    { title: 'ACTUAL HOURS', value: `${thisMonthHoursVal.toFixed(2)}`, desc: 'This Month', color: '#2fb344', icon: <AccessTimeIcon sx={{ color: '#ffffff' }} /> },
    { title: 'PLANNED VS ACTUAL', value: '0.00%', desc: 'Efficiency', color: '#f59f00', icon: <TrendingUpIcon sx={{ color: '#ffffff' }} /> },
    { title: 'TASKS COMPLETED', value: `${summary?.completedTasksCount ?? 0}`, desc: 'Today', color: '#16a34a', icon: <AccessTimeIcon sx={{ color: '#ffffff' }} /> },
    { title: 'QUALITY SCORE', value: '0 / 100', desc: 'Pending Audit', color: '#ae3ec9', icon: <EmojiEventsIcon sx={{ color: '#ffffff' }} /> },
  ];

  // 2. Project Hours Distribution
  const hoursDistributionData = (charts?.hoursDistributionByProject ?? []).map((h: any, idx: number) => ({
    name: h.projectName || 'Project',
    hoursLogged: h.hoursLogged,
    color: ['#206bc4', '#2fb344', '#f59f00', '#ae3ec9', '#00bcd4'][idx % 5]
  }));

  const totalLoggedHoursSum = hoursDistributionData.reduce((acc: number, curr: any) => acc + curr.hoursLogged, 0);

  // 3. Daily Hours Logged Chart
  const dailyHoursTrend = (charts?.dailyHours ?? []).map((d: any) => ({
    name: d.date,
    planned: 8,
    actual: d.hoursLogged,
    efficiency: (d.hoursLogged / 8) * 100
  }));

  // 4. Timesheet Status Summary (replaces unavailable skillsMatrix)
  const timesheetStatusData = (charts?.timesheetStatusSummary ?? []).map((s) => ({
    subject: s.status,
    A: s.count,
    fullMark: Math.max(...(charts?.timesheetStatusSummary ?? []).map((x) => x.count), 1)
  }));

  // 5. Performance by parameters — not available in EmployeeCharts; show timesheet status table
  const timesheetStatusRows = (charts?.timesheetStatusSummary ?? []).map((s) => ({
    name: s.status,
    score: String(s.count)
  }));

  const handleRefreshData = () => {
    refetchSummary();
    refetchCharts();
  };

  return (
    <Box sx={{ bgcolor: '#090d16', color: '#ffffff', minHeight: '100vh', p: 3 }}>
      
      {/* Header filter block */}
      <Card sx={{ mb: 3, p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>EMPLOYEE PERFORMANCE DASHBOARD</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Track, Analyze and Improve Employee Performance</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', alignItems: 'center' }}>
            <TextField select size="small" defaultValue="May 2025" slotProps={{ select: { native: true }, input: { sx: { color: '#ffffff', bgcolor: '#161f30', borderColor: '#222d4a' } } }}>
              <option value="May 2025">May 2025</option>
            </TextField>
            <Button variant="outlined" size="small" sx={{ borderColor: '#1d243a', color: '#ffffff' }} onClick={handleRefreshData}>
              Refresh Stats
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* KPI Cards Row */}
      <WidgetErrorBoundary title="Performance KPIs summary" onRetry={refetchSummary}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {summaryLoading ? (
            Array.from({ length: 7 }).map((_, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 1.7 }} key={idx}>
                <CardSkeleton />
              </Grid>
            ))
          ) : (
            kpis.map((kpi: any, idx: number) => (
              <Grid size={{ xs: 12, sm: 6, md: 1.7 }} key={idx}>
                <Card sx={{ height: '100%', bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff' }}>
                  <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ bgcolor: kpi.color, p: 0.8, borderRadius: 1.5, display: 'flex', alignItems: 'center' }}>
                      {kpi.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.625rem', display: 'block' }}>
                        {kpi.title}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', my: 0.2 }}>
                        {kpi.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6875rem' }}>
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

      {/* Row 1 Content */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Profile Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: '#94a3b8' }}>EMPLOYEE PROFILE</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 2.5 }} />
            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', mb: 2 }}>
              <Avatar
                src="/avatar.png"
                sx={{ width: 80, height: 80, border: '2px solid #206bc4' }}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 850 }}>
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Employee'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>N/A</Typography>
              </Box>
            </Box>
            <Grid container spacing={1} sx={{ mt: 1.5 }}>
              {[
                { label: 'Employee ID', val: user?.employeeCode || 'N/A' },
                { label: 'Email', val: user?.email || 'N/A' },
                { label: 'Team Leader', val: 'N/A' },
                { label: 'Status', val: 'Active' }
              ].map((row: any, idx: number) => (
                <React.Fragment key={idx}>
                  <Grid size={{ xs: 5 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>{row.label}</Typography>
                  </Grid>
                  <Grid size={{ xs: 7 }}>
                    <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>{row.val}</Typography>
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
          </Card>
        </Grid>

        {/* Combo Chart */}
        <Grid size={{ xs: 12, md: 5 }}>
          <WidgetErrorBoundary title="Daily Hours Logged" onRetry={refetchCharts}>
            <Card sx={{ p: 2.5, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PLANNED VS ACTUAL HOURS TREND</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
              {dailyHoursTrend.length === 0 ? (
                <Box sx={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No daily logged hours in database</Box>
              ) : (
                <ResponsiveContainer width="99%" height={280} minHeight={0}>
                  <BarChart data={dailyHoursTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d243a" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="planned" fill="#206bc4" name="Planned Hours" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="actual" fill="#2fb344" name="Actual Hours" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </WidgetErrorBoundary>
        </Grid>

        {/* Hours Distribution Pie */}
        <Grid size={{ xs: 12, md: 3 }}>
          <WidgetErrorBoundary title="Hours Distribution Chart" onRetry={refetchCharts}>
            <Card sx={{ p: 2.5, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>HOURS DISTRIBUTION (THIS MONTH)</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
              {hoursDistributionData.length === 0 ? (
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No project hours logged</Box>
              ) : (
                <>
                  <Box sx={{ position: 'relative', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="99%" height={180} minHeight={160}>
                      <PieChart>
                        <Pie
                          data={hoursDistributionData}
                          dataKey="hoursLogged"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {hoursDistributionData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>{totalLoggedHoursSum.toFixed(1)}</Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6875rem' }}>Total Hours</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    {hoursDistributionData.map((d: any, i: number) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                        <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>{d.name.slice(0, 15)}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Card>
          </WidgetErrorBoundary>
        </Grid>
      </Grid>

      {/* Row 2 Content */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Task Performance Table */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 2.5, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 330 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TASK WORK SESSION PERFORMANCE</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>No task assignments found in database</Box>
          </Card>
        </Grid>

        {/* Timesheet Status Radar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <WidgetErrorBoundary title="Timesheet Status chart" onRetry={refetchCharts}>
            <Card sx={{ p: 2.5, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 330, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TIMESHEET STATUS OVERVIEW</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
              {timesheetStatusData.length === 0 ? (
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No timesheet data in DB</Box>
              ) : (
                <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="99%" height={220} minHeight={200}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={timesheetStatusData}>
                      <PolarGrid stroke="#1d243a" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                      <PolarRadiusAxis angle={30} stroke="#1d243a" tick={false} />
                      <Radar name="Count" dataKey="A" stroke="#206bc4" fill="#206bc4" fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Card>
          </WidgetErrorBoundary>
        </Grid>

        {/* Timesheet Status Breakdown */}
        <Grid size={{ xs: 12, md: 3 }}>
          <WidgetErrorBoundary title="Timesheet Status Breakdown" onRetry={refetchCharts}>
            <Card sx={{ p: 2.5, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 330 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TIMESHEET STATUS BREAKDOWN</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
              {timesheetStatusRows.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>No timesheet entries in DB</Box>
              ) : (
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                        <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Status</TableCell>
                        <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {timesheetStatusRows.map((row, idx: number) => (
                        <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                          <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{row.name}</TableCell>
                          <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>{row.score}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </WidgetErrorBoundary>
        </Grid>
      </Grid>

      {/* Row 3 Content */}
      <Grid container spacing={3}>
        {/* Monthly Performance Trend */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 320 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>MONTHLY PERFORMANCE TREND</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
            <Box sx={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No monthly trend data</Box>
          </Card>
        </Grid>

        {/* Strengths & Improvement */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 320, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>STRENGTHS & AREAS OF IMPROVEMENT</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>No feedback parameters logged</Box>
          </Card>
        </Grid>

        {/* Achievements & Feedback */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 320, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>ACHIEVEMENTS & FEEDBACK</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>No reviews logged in DB</Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeDashboard;
