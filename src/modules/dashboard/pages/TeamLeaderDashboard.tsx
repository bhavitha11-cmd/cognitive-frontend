import React from 'react';
import { useNavigate } from 'react-router';
import {
  Grid, Card, CardContent, Typography, Box, Divider, Link, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChecklistIcon from '@mui/icons-material/Checklist';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

import { useGetTeamLeadSummary, useGetTeamLeadCharts, useGetTeamLeadAttendance, useGetUpcomingDeadlines } from '../services/dashboardService';

import WidgetErrorBoundary from '../components/WidgetErrorBoundary';
import { CardSkeleton } from '../components/DashboardSkeletons';

export const TeamLeaderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetTeamLeadSummary();
  const { data: charts, refetch: refetchCharts } = useGetTeamLeadCharts();
  const { data: attendance = [], refetch: refetchAttendance } = useGetTeamLeadAttendance();
  const { data: upcomingDeadlines = [], isLoading: deadlinesLoading } = useGetUpcomingDeadlines(7);

  // 1. KPI cards mapping
  const kpis = [
    { title: 'TOTAL TEAM MEMBERS', value: summary?.totalTeamMembers ?? 0, desc: 'Active Direct Reports', color: '#206bc4', icon: <PeopleIcon sx={{ color: '#ffffff' }} /> },
    { title: 'TODAY ATTENDANCE', value: summary?.todayAttendanceCount ?? 0, desc: 'Present Today', color: '#2fb344', icon: <PeopleIcon sx={{ color: '#ffffff' }} /> },
    { title: 'PENDING TIMESHEETS', value: summary?.pendingApprovalsCount ?? 0, desc: 'Awaiting Review', color: '#f59f00', icon: <AccessTimeIcon sx={{ color: '#ffffff' }} /> },
    { title: 'TASKS IN PROGRESS', value: summary?.tasksInProgressCount ?? 0, desc: 'Active Work', color: '#206bc4', icon: <ChecklistIcon sx={{ color: '#ffffff' }} /> },
    { title: 'OVERDUE TASKS', value: summary?.delayedTasksCount ?? 0, desc: 'Requires Attention', color: '#d63939', icon: <WarningAmberIcon sx={{ color: '#ffffff' }} /> },
    { title: 'OVERLOADED MEMBERS', value: summary?.overloadedEmployeesCount ?? 0, desc: 'Load > 120%', color: '#f76707', icon: <WarningAmberIcon sx={{ color: '#ffffff' }} /> },
    { title: 'UNDERUTILIZED MEMBERS', value: summary?.underutilizedEmployeesCount ?? 0, desc: 'Load < 50%', color: '#00bcd4', icon: <WarningAmberIcon sx={{ color: '#ffffff' }} /> },
  ];

  // 2. Team Workload chart mapping
  const teamUtilizationData = (charts?.employeeWorkload ?? []).map(w => ({
    name: w.employeeName,
    utilization: w.utilizationPercentage
  }));

  // 3. Weekly Task completions chart mapping
  const completionsTrend = (charts?.taskCompletionsWeekly ?? []).map(w => ({
    name: w.weekLabel,
    completed: w.completedCount
  }));

  // 4. Submission status donut mapping
  const presentCount = attendance.filter((a: any) =>
    a.status?.toUpperCase() === 'PRESENT' || a.status?.toUpperCase() === 'CLOCKED_IN'
  ).length;
  const absentCount = attendance.filter((a: any) =>
    a.status?.toUpperCase() === 'ABSENT'
  ).length;
  const submissionStatusData = [
    { name: 'Approved / Logged', value: presentCount, color: '#2fb344' },
    { name: 'Pending', value: summary?.pendingApprovalsCount ?? 0, color: '#f59f00' },
    { name: 'Absent', value: absentCount, color: '#d63939' }
  ];

  const hasSubmissions = presentCount > 0 || (summary?.pendingApprovalsCount ?? 0) > 0 || absentCount > 0;

  // 5. Team Member Performance Table mapping
  const memberPerformance = (charts?.employeeWorkload ?? []).map(w => {
    const prod = charts?.employeeProductivity?.find((p: any) => p.employeeName === w.employeeName);
    return {
      name: w.employeeName,
      planned: w.availableHours,
      actual: w.assignedHours,
      efficiency: `${w.utilizationPercentage.toFixed(1)}%`,
      load: `${w.assignedHours.toFixed(1)}h`,
      compliance: `${prod ? prod.productivityPercentage.toFixed(0) : '100'}%`
    };
  });

  const alertsList = [
    ...(summary?.delayedTasksCount && summary.delayedTasksCount > 0 ? [{ txt: `${summary.delayedTasksCount} tasks are overdue`, action: 'View Tasks', type: 'error.main' }] : []),
    ...(summary?.pendingApprovalsCount && summary.pendingApprovalsCount > 0 ? [{ txt: `${summary.pendingApprovalsCount} timesheets are pending approval`, action: 'Review', type: 'warning.main' }] : []),
    ...(summary?.underutilizedEmployeesCount && summary.underutilizedEmployeesCount > 0 ? [{ txt: `${summary.underutilizedEmployeesCount} employees have low utilization (<50%)`, action: 'View Details', type: 'warning.main' }] : []),
    ...(summary?.overloadedEmployeesCount && summary.overloadedEmployeesCount > 0 ? [{ txt: `${summary.overloadedEmployeesCount} employees are overloaded (>120%)`, action: 'View Load', type: 'error.main' }] : [])
  ];

  const handleRefreshAll = () => {
    refetchSummary();
    refetchCharts();
    refetchAttendance();
  };

  return (
    <Box sx={{ bgcolor: '#090d16', color: '#ffffff', minHeight: '100vh', p: 3 }}>
      
      {/* Header and filters */}
      <Card sx={{ mb: 3, p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>TEAM LEADER DASHBOARD</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Track team performance, project progress and resource utilization</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', alignItems: 'center' }}>
            <TextField select size="small" defaultValue="May 2025" slotProps={{ select: { native: true }, input: { sx: { color: '#ffffff', bgcolor: '#161f30', borderColor: '#222d4a' } } }}>
              <option value="May 2025">Month: May 2025</option>
            </TextField>
            <TextField select size="small" defaultValue="All" slotProps={{ select: { native: true }, input: { sx: { color: '#ffffff', bgcolor: '#161f30', borderColor: '#222d4a' } } }}>
              <option value="All">All Projects</option>
            </TextField>
            <Button variant="outlined" size="small" sx={{ borderColor: '#1d243a', color: '#ffffff' }} onClick={handleRefreshAll}>
              Refresh Team
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* KPI Row */}
      <WidgetErrorBoundary title="Team Lead summary statistics" onRetry={refetchSummary}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {summaryLoading ? (
            Array.from({ length: 7 }).map((_, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 1.7 }} key={idx}>
                <CardSkeleton />
              </Grid>
            ))
          ) : (
            kpis.map((kpi, idx) => (
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
        {/* Team Utilization Bar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <WidgetErrorBoundary title="Team Workload charts" onRetry={refetchCharts}>
            <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TEAM UTILIZATION</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
              {teamUtilizationData.length === 0 ? (
                <Box sx={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No team members assigned</Box>
              ) : (
                <ResponsiveContainer width="99%" height={300} minHeight={0}>
                  <BarChart data={teamUtilizationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d243a" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} width={80} />
                    <Tooltip />
                    <Bar dataKey="utilization" fill="#2fb344" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </WidgetErrorBoundary>
        </Grid>

        {/* Weekly Task completions */}
        <Grid size={{ xs: 12, md: 5 }}>
          <WidgetErrorBoundary title="Weekly Task completions trend" onRetry={refetchCharts}>
            <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>WEEKLY TASK COMPLETIONS (Trend)</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
              {completionsTrend.length === 0 ? (
                <Box sx={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No completed tasks recorded in period</Box>
              ) : (
                <ResponsiveContainer width="99%" height={300} minHeight={0}>
                  <BarChart data={completionsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d243a" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#206bc4" name="Tasks Completed" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </WidgetErrorBoundary>
        </Grid>

        {/* Task Status Donut */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TASK STATUS DISTRIBUTION</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              No tasks logged in database
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2 Content */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Team Member Performance */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 320 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TEAM MEMBER PERFORMANCE</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            {memberPerformance.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>No team performance logs</Box>
            ) : (
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Employee</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Avail. Hrs</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Assigned Hrs</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Util %</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Load</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Productivity %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {memberPerformance.map((p, idx) => (
                      <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                        <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>{p.name}</TableCell>
                        <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{p.planned.toFixed(0)}</TableCell>
                        <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{p.actual.toFixed(0)}</TableCell>
                        <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>{p.efficiency}</TableCell>
                        <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{p.load}</TableCell>
                        <TableCell align="right" sx={{ color: '#10b981', p: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>{p.compliance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Top Overdue Tasks */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 320 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TOP OVERDUE TASKS</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>No overdue tasks for your reports in DB</Box>
          </Card>
        </Grid>

        {/* Timesheet Approval Status */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 320, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TIMESHEET APPROVAL STATUS</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
            {!hasSubmissions ? (
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No timesheets logged today</Box>
            ) : (
              <>
                <Box sx={{ position: 'relative', height: 175, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="99%" height={175} minHeight={150}>
                    <PieChart>
                      <Pie
                        data={submissionStatusData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {submissionStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{attendance.length}</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6875rem' }}>Submissions</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                  {submissionStatusData.map((d, i) => (
                    <Box key={i} sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: d.color, fontWeight: 700, display: 'block', fontSize: '0.6875rem' }}>● {d.name}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800 }}>{d.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
            <Divider sx={{ borderColor: '#1d243a', my: 1 }} />
            <Link sx={{ textAlign: 'center', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: '#4299e1' }} onClick={() => navigate('/timesheets/approvals')}>
              Go to Approval <ArrowForwardIcon sx={{ fontSize: 10 }} />
            </Link>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3 Content */}
      <Grid container spacing={3}>
        {/* Projects Under My Supervision */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 300 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PROJECTS UNDER MY SUPERVISION</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>No assigned projects found in database</Box>
          </Card>
        </Grid>

        {/* Upcoming Deadlines */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 300 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>UPCOMING DEADLINES (Next 7 Days)</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            {deadlinesLoading ? (
              <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>Loading...</Box>
            ) : upcomingDeadlines.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>No upcoming deadlines in the next 7 days</Box>
            ) : (
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Task</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Project</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Due Date</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Assignee</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingDeadlines.map((d, idx) => (
                      <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                        <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>{d.title}</TableCell>
                        <TableCell sx={{ color: '#94a3b8', p: 0.5, fontSize: '0.75rem' }}>{d.projectName}</TableCell>
                        <TableCell sx={{ color: '#f59f00', p: 0.5, fontSize: '0.75rem' }}>{d.plannedDeliveryDate || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#94a3b8', p: 0.5, fontSize: '0.75rem' }}>{d.assigneeName || 'Unassigned'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Alerts & Action Required */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 300, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>ALERTS & ACTION REQUIRED</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
              {alertsList.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No alerts triggered for team</Box>
              ) : (
                alertsList.map((al, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', bgcolor: '#161f30', p: 1, borderRadius: 1.5, borderLeft: '3px solid', borderColor: al.type }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', color: '#ffffff' }}>{al.txt}</Typography>
                    </Box>
                    <Link sx={{ fontSize: '0.6875rem', color: '#4299e1', fontWeight: 700, cursor: 'pointer', minWidth: 70, textAlign: 'right' }}>
                      {al.action}
                    </Link>
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeamLeaderDashboard;
