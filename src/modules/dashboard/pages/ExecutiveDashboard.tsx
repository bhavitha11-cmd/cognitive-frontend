import React, { useState, useMemo } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Divider, Button,
  Select, MenuItem, FormControl, InputLabel, Tabs, Tab,
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
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

import {
  useGetExecutiveSummary,
  useGetExecutiveCharts,
  useGetExecutiveRecentActivities,
  useGetExecutiveTeamPerformance,
  useGetExecutiveClientPerformance,
  useGetExecutiveIndividualPerformance,
  useGetExecutiveProjectList,
  useGetExecutiveTaskSummary
} from '../services/dashboardService';

import { useGetDepartmentsLookup, useGetTeamsLookup } from '../../hr/services/hrService';
import WidgetErrorBoundary from '../components/WidgetErrorBoundary';
import { CardSkeleton, ListSkeleton } from '../components/DashboardSkeletons';

export const ExecutiveDashboard: React.FC = () => {
  // ── Period & Filter States ───────────────────────────────────────────────────
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this_month');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);

  // Generate last 12 months + current month as options
  const monthOptions = useMemo(() => {
    const options: { label: string; value: string; from: string; to: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      options.push({ label: i === 0 ? 'This Month' : label, value: i === 0 ? 'this_month' : from, from, to });
    }
    // Add quarter/year options
    const q = Math.floor(today.getMonth() / 3);
    const qStart = new Date(today.getFullYear(), q * 3, 1);
    const qEnd = new Date(today.getFullYear(), q * 3 + 3, 0);
    options.push({
      label: `Q${q + 1} ${today.getFullYear()}`,
      value: 'this_quarter',
      from: qStart.toISOString().slice(0, 10),
      to: qEnd.toISOString().slice(0, 10),
    });
    const yearStart = `${today.getFullYear()}-01-01`;
    const yearEnd = `${today.getFullYear()}-12-31`;
    options.push({ label: `Year ${today.getFullYear()}`, value: 'this_year', from: yearStart, to: yearEnd });
    return options;
  }, []);

  const activePeriod = monthOptions.find((o) => o.value === selectedPeriod) ?? monthOptions[0];
  const fromDate = activePeriod.from;
  const toDate = activePeriod.to;

  // ── Reference Lookups ────────────────────────────────────────────────────────
  const { data: departments = [] } = useGetDepartmentsLookup();
  const { data: teams = [] } = useGetTeamsLookup(departmentId || undefined);

  // ── Executive Dashboard API Queries ──────────────────────────────────────────
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetExecutiveSummary(fromDate, toDate);
  const { data: charts, refetch: refetchCharts } = useGetExecutiveCharts(fromDate, toDate);
  const { data: activities = [], isLoading: activitiesLoading, refetch: refetchActivities } = useGetExecutiveRecentActivities();

  // Tabbed queries
  const { data: teamPerformance = [], refetch: refetchTeams } = useGetExecutiveTeamPerformance(fromDate, toDate);
  const { data: clientPerformance = [], refetch: refetchClients } = useGetExecutiveClientPerformance(fromDate, toDate);
  const { data: individualPerformance = [], refetch: refetchIndividual } = useGetExecutiveIndividualPerformance(departmentId || undefined, teamId || undefined, fromDate, toDate);
  const { data: projectList = [], refetch: refetchProjects } = useGetExecutiveProjectList(departmentId || undefined, teamId || undefined, fromDate, toDate);
  const { data: taskSummary = [], refetch: refetchTasks } = useGetExecutiveTaskSummary(departmentId || undefined, teamId || undefined, fromDate, toDate);

  // Remaining Hours = Planned - Actual
  const remainingHours = Math.max(0, (summary?.plannedHours ?? 0) - (summary?.actualHours ?? 0));
  const workedPercentage = summary?.plannedHours && summary.plannedHours > 0 
    ? ((summary.actualHours / summary.plannedHours) * 100).toFixed(1) 
    : '0.0';

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

  // Overview Tab Chart Calculations
  const projectHealthData = (charts?.projectStatuses ?? []).map((s: any) => ({
    name: s.status,
    value: s.count,
    color: s.status === 'Completed' || s.status === 'On Track' ? '#2fb344' : s.status === 'In Progress' ? '#206bc4' : s.status === 'On Hold' ? '#f59f00' : '#d63939'
  }));

  const employeeUtilizationData = (charts?.employeeUtilization ?? []).map((e: any) => ({
    name: e.employeeName,
    utilization: e.utilizationPercentage
  }));

  const departmentHoursData = (charts?.departmentPerformances ?? []).map((d: any, idx: number) => ({
    name: d.departmentName,
    value: d.actualHours,
    color: ['#206bc4', '#2fb344', '#f59f00', '#ae3ec9', '#00bcd4'][idx % 5]
  }));

  const weeklyHoursTrend = (charts?.hoursBurnTrend ?? []).map((b: any) => ({
    name: b.date,
    hours: b.hoursLogged
  }));

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
    refetchTeams();
    refetchClients();
    refetchIndividual();
    refetchProjects();
    refetchTasks();
  };

  return (
    <Box sx={{ bgcolor: '#090d16', color: '#ffffff', minHeight: '100vh', p: 3 }}>
      
      {/* Top Header Filter Bar */}
      <Card sx={{ mb: 3, p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '0.5px' }}>EXECUTIVE ANALYTICS</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Corporate role-based summary & detailed performance breakdown</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* Period Dropdown */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                displayEmpty
                sx={{
                  color: '#ffffff', bgcolor: '#161f30',
                  border: '1px solid #222d4a', borderRadius: 1,
                  '& .MuiSelect-icon': { color: '#94a3b8' },
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#161f30', color: '#ffffff', maxHeight: 280 } } }}
              >
                {monthOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.875rem' }}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Department Cascade Filter */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={departmentId}
                onChange={(e) => { setDepartmentId(e.target.value); setTeamId(''); }}
                displayEmpty
                sx={{
                  color: '#ffffff', bgcolor: '#161f30',
                  border: '1px solid #222d4a', borderRadius: 1,
                  '& .MuiSelect-icon': { color: '#94a3b8' },
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#161f30', color: '#ffffff', maxHeight: 280 } } }}
              >
                <MenuItem value="" sx={{ fontSize: '0.875rem' }}>All Departments</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id} sx={{ fontSize: '0.875rem' }}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Team Cascade Filter */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                displayEmpty
                sx={{
                  color: '#ffffff', bgcolor: '#161f30',
                  border: '1px solid #222d4a', borderRadius: 1,
                  '& .MuiSelect-icon': { color: '#94a3b8' },
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#161f30', color: '#ffffff', maxHeight: 280 } } }}
              >
                <MenuItem value="" sx={{ fontSize: '0.875rem' }}>All Teams</MenuItem>
                {teams.map((t) => (
                  <MenuItem key={t.id} value={t.id} sx={{ fontSize: '0.875rem' }}>{t.team_name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button variant="outlined" size="small" sx={{ borderColor: '#1d243a', color: '#ffffff' }} onClick={handleRefreshAll}>
              Refresh Data
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: '#1d243a', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': { color: '#94a3b8', fontSize: '0.875rem', fontWeight: 700, minWidth: 100 },
            '& .Mui-selected': { color: '#206bc4 !important' },
            '& .MuiTabs-indicator': { bgcolor: '#206bc4' }
          }}
        >
          <Tab label="Overview" icon={<BusinessIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Projects" icon={<WorkIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Clients" icon={<FolderIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Departments" icon={<BarChartIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Teams" icon={<GroupIcon fontSize="small" />} iconPosition="start" />
          <Tab label="People" icon={<PersonIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      
      {/* ── 1. OVERVIEW TAB ────────────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <Box>
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

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <WidgetErrorBoundary title="Project Health Chart" onRetry={refetchCharts}>
                <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PROJECT HEALTH</Typography>
                  <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
                  {projectHealthData.length === 0 ? (
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No project data</Box>
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
                      </Box>
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                        {projectHealthData.map((entry: any, index: number) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 10, height: 10, bgcolor: entry.color, borderRadius: '50%' }} />
                            <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 600 }}>{entry.name} ({entry.value})</Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                </Card>
              </WidgetErrorBoundary>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <WidgetErrorBoundary title="Hours Burn Trend" onRetry={refetchCharts}>
                <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>HOURS BURN TREND (DAILY LOGGED)</Typography>
                  <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
                  <ResponsiveContainer width="99%" height={280} minHeight={200}>
                    <LineChart data={weeklyHoursTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1d243a" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip />
                      <Line type="monotone" dataKey="hours" stroke="#206bc4" strokeWidth={2.5} dot={{ r: 3 }} name="Hours Logged" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </WidgetErrorBoundary>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <WidgetErrorBoundary title="Department Performance" onRetry={refetchCharts}>
                <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>HOURS BY DEPARTMENT (MTD)</Typography>
                  <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
                  {departmentHoursData.length === 0 ? (
                    <Box sx={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No department hours</Box>
                  ) : (
                    <ResponsiveContainer width="99%" height={280} minHeight={200}>
                      <PieChart>
                        <Pie
                          data={departmentHoursData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={{ stroke: '#1d243a' }}
                        >
                          {departmentHoursData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </WidgetErrorBoundary>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
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
      )}

      {/* ── 2. PROJECTS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 1 && (
        <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#ffffff' }}>PROJECT WISE PERFORMANCE</Typography>
          <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
          {projectList.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>No project data matches selected filters</Box>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Code</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Project Name</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Client</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Department</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Manager</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Planned Hours</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Actual Hours</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Overrun Hours</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Overrun %</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ color: '#94a3b8', fontWeight: 700 }}>Tasks</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Planned Delivery</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projectList.map((p, idx) => (
                    <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                      <TableCell sx={{ color: '#4299e1', fontWeight: 600 }}>{p.projectCode}</TableCell>
                      <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{p.projectName}</TableCell>
                      <TableCell sx={{ color: '#ffffff' }}>{p.clientName || '—'}</TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>{p.departmentName || '—'}</TableCell>
                      <TableCell sx={{ color: '#ffffff' }}>{p.projectManagerName || '—'}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff' }}>{p.plannedHours.toFixed(1)}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff' }}>{p.actualHours.toFixed(1)}</TableCell>
                      <TableCell align="right" sx={{ color: p.overrunHours > 0 ? '#ef4444' : '#10b981' }}>
                        {p.overrunHours > 0 ? `+${p.overrunHours.toFixed(1)}` : p.overrunHours.toFixed(1)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: p.overrunPercentage > 0 ? '#ef4444' : '#10b981' }}>
                        {p.overrunPercentage > 0 ? `+${p.overrunPercentage.toFixed(1)}%` : `${p.overrunPercentage.toFixed(1)}%`}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={p.status}
                          size="small"
                          sx={{
                            bgcolor: p.status === 'Completed' ? '#16a34a' : p.status === 'In Progress' ? '#206bc4' : '#f59f00',
                            color: '#ffffff', fontSize: '0.6875rem', fontWeight: 700
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ color: '#ffffff' }}>
                        {p.completedTaskCount} / {p.taskCount}
                      </TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>
                        {p.plannedEndDate ? new Date(p.plannedEndDate).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* ── 3. CLIENTS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {clientPerformance.length === 0 ? (
            <Grid size={{ xs: 12 }} sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>No client data available</Grid>
          ) : (
            clientPerformance.map((c, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                <Card sx={{ bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff' }}>{c.clientName}</Typography>
                      <Chip label={`On-Time: ${c.onTimeDeliveryPct.toFixed(0)}%`} size="small" sx={{ bgcolor: c.onTimeDeliveryPct >= 80 ? '#16a34a' : '#f59f00', color: '#ffffff' }} />
                    </Box>
                    <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Total Projects</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>{c.totalProjects}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Active / Completed</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>{c.activeProjects} / {c.completedProjects}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }} sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Planned Hours</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#4299e1' }}>{c.plannedHours.toFixed(0)}h</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }} sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Worked Hours</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#2fb344' }}>{c.actualHours.toFixed(0)}h</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* ── 4. DEPARTMENTS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 350 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PLANNED VS ACTUAL HOURS BY DEPARTMENT</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
              {departmentHoursData.length === 0 ? (
                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No department data</Box>
              ) : (
                <ResponsiveContainer width="99%" height={280} minHeight={200}>
                  <BarChart data={charts?.departmentPerformances || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d243a" />
                    <XAxis dataKey="departmentName" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="estimatedHours" fill="#206bc4" name="Estimated Hours" />
                    <Bar dataKey="actualHours" fill="#2fb344" name="Actual Hours" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 350 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>DEPARTMENT METRICS LIST</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Department</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Planned</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Actual</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Tasks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(charts?.departmentPerformances || []).map((d: any, idx: number) => (
                      <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a' }}>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{d.departmentName}</TableCell>
                        <TableCell align="right" sx={{ color: '#ffffff' }}>{d.estimatedHours.toFixed(0)}h</TableCell>
                        <TableCell align="right" sx={{ color: '#ffffff' }}>{d.actualHours.toFixed(0)}h</TableCell>
                        <TableCell align="right" sx={{ color: '#94a3b8' }}>{d.taskCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── 5. TEAMS TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 4 && (
        <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#ffffff' }}>TEAM WISE PERFORMANCE</Typography>
          <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
          {teamPerformance.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>No team performance data matches filters</Box>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Team Name</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Department</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Headcount</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Planned Hours</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Worked Hours</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Utilization %</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Task Count</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Overdue Tasks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamPerformance.map((t, idx) => (
                    <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                      <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t.teamName}</TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>{t.departmentName || '—'}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff' }}>{t.headcount}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff' }}>{t.plannedHours.toFixed(1)}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff' }}>{t.actualHours.toFixed(1)}</TableCell>
                      <TableCell align="right" sx={{ color: t.utilizationPercentage >= 80 ? '#16a34a' : '#f59f00', fontWeight: 700 }}>
                        {t.utilizationPercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff' }}>{t.taskCount}</TableCell>
                      <TableCell align="right" sx={{ color: t.overdueTasksCount > 0 ? '#ef4444' : '#16a34a' }}>
                        {t.overdueTasksCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* ── 6. PEOPLE TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 5 && (
        <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#ffffff' }}>INDIVIDUAL EMPLOYEE RANKINGS & METRICS</Typography>
          <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
          {individualPerformance.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>No employee rankings matches selected filters</Box>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Rank</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Department</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Team</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Utilization %</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Efficiency %</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Planned Hours</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Actual Hours</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Task Comp %</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700 }}>Timesheet Comp %</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, bgcolor: '#1c2536' }}>Productivity Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {individualPerformance.map((emp, idx) => (
                    <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>#{emp.performanceRank}</TableCell>
                      <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{emp.employeeName}</TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>{emp.departmentName || '—'}</TableCell>
                      <TableCell sx={{ color: '#ffffff' }}>{emp.teamName || '—'}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff' }}>{emp.utilizationPercentage.toFixed(1)}%</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff' }}>{emp.efficiencyScore.toFixed(1)}%</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8' }}>{emp.plannedHours.toFixed(1)}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff' }}>{emp.actualHours.toFixed(1)}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff' }}>{emp.taskCompletionPercentage.toFixed(1)}%</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff' }}>{emp.timesheetComplianceScore.toFixed(1)}%</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 800, bgcolor: '#1c2536' }}>
                        {emp.productivityScore.toFixed(1)} / 100
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

    </Box>
  );
};

export default ExecutiveDashboard;
