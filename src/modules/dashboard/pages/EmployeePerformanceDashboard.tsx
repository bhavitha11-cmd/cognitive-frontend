import React, { useState, useMemo } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Divider, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, LinearProgress,
  Select, MenuItem, FormControl
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChecklistIcon from '@mui/icons-material/Checklist';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

import { useGetPerformanceRankings } from '../services/dashboardService';
import { useAuthStore } from '../../../store/useAuthStore';
import { useGetDepartmentsLookup, useGetTeamsLookup } from '../../hr/services/hrService';

export const EmployeePerformanceDashboard: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const canViewPerformance = hasPermission('HR', 'view') || hasPermission('Analytics', 'view');

  // ── Month options (last 12 months) ────────────────────────────────────────────
  const monthOptions = useMemo(() => {
    const opts: { label: string; value: string; from: string; to: string }[] = [
      { label: 'All Months', value: '', from: '', to: '' },
    ];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const label = i === 0
        ? `This Month (${d.toLocaleString('default', { month: 'short', year: 'numeric' })})`
        : d.toLocaleString('default', { month: 'long', year: 'numeric' });
      opts.push({ label, value: from, from, to });
    }
    return opts;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');

  const activePeriod = monthOptions.find((o) => o.value === selectedMonth);
  const fromDate = activePeriod?.from || '';
  const toDate = activePeriod?.to || '';

  // ── Department & Team lookups ──────────────────────────────────────────
  const { data: departments = [] } = useGetDepartmentsLookup();
  const { data: teams = [] } = useGetTeamsLookup(departmentId || undefined);

  const { data: rankings = [], refetch } = useGetPerformanceRankings(
    departmentId || undefined,
    teamId || undefined,
    fromDate || undefined,
    toDate || undefined
  );

  // Fallback Mock data if database is unpopulated (now disabled for real-time E2E compliance)
  const hasRealData = rankings.length > 0;
  
  // 1. Calculate Metric Summary KPIs
  let avgPerfScore = 0;
  let avgEfficiency = 0;
  let avgUtilization = 0;
  let tasksCompletedText = '0 / 0';
  let taskCompletionPct = 0;
  let timesheetComplianceVal = 0;
  let avgQualityScore = 0;

  if (hasRealData) {
    const totalScore = rankings.reduce((acc: number, curr: any) => acc + (curr.productivityScore ?? curr.productivity_score ?? 0), 0);
    const totalEff = rankings.reduce((acc: number, curr: any) => acc + (curr.efficiencyScore ?? curr.efficiency_score ?? 0), 0);
    const totalUtil = rankings.reduce((acc: number, curr: any) => acc + (curr.utilizationPercentage ?? curr.utilization_percentage ?? 0), 0);
    const totalComp = rankings.reduce((acc: number, curr: any) => acc + (curr.timesheetComplianceScore ?? curr.timesheet_compliance_score ?? 0), 0);
    const totalTaskPct = rankings.reduce((acc: number, curr: any) => acc + (curr.taskCompletionPercentage ?? curr.task_completion_percentage ?? 0), 0);

    avgPerfScore = totalScore / rankings.length;
    avgEfficiency = totalEff / rankings.length;
    avgUtilization = totalUtil / rankings.length;
    taskCompletionPct = totalTaskPct / rankings.length;
    timesheetComplianceVal = totalComp / rankings.length;
    avgQualityScore = avgPerfScore; // Use actual performance score — no fabrication

    // Format tasks completed count
    const totalPlanned = rankings.reduce((acc: number, curr: any) => acc + (curr.plannedHours ?? curr.planned_hours ?? 0), 0);
    const totalActual = rankings.reduce((acc: number, curr: any) => acc + (curr.actualHours ?? curr.actual_hours ?? 0), 0);
    tasksCompletedText = `${Math.round(totalActual / 8)} / ${Math.round(totalPlanned / 8 || 1)}`;
  }

  const kpis = [
    { title: 'OVERALL PERFORMANCE SCORE', value: `${avgPerfScore.toFixed(1)} / 100`, desc: avgPerfScore >= 80 ? 'Very Good' : 'Average', color: '#206bc4', icon: <EmojiEventsIcon sx={{ color: '#ffffff' }} /> },
    { title: 'AVG. EFFICIENCY %', value: `${avgEfficiency.toFixed(1)}%`, desc: 'This Month', color: '#2fb344', icon: <AccessTimeIcon sx={{ color: '#ffffff' }} /> },
    { title: 'AVG. UTILIZATION %', value: `${avgUtilization.toFixed(1)}%`, desc: 'This Month', color: '#00bcd4', icon: <AccessTimeIcon sx={{ color: '#ffffff' }} /> },
    { title: 'TASKS COMPLETED', value: tasksCompletedText, desc: `${taskCompletionPct.toFixed(1)}%`, color: '#16a34a', icon: <ChecklistIcon sx={{ color: '#ffffff' }} /> },
    { title: 'TIMESHEET COMPLIANCE', value: `${timesheetComplianceVal.toFixed(1)}%`, desc: 'This Month', color: '#f59f00', icon: <ChecklistIcon sx={{ color: '#ffffff' }} /> },
    { title: 'PRODUCTIVITY SCORE (AVG.)', value: `${Math.min(100, avgQualityScore).toFixed(1)} / 100`, desc: avgQualityScore >= 80 ? 'Good' : 'Fair', color: '#ae3ec9', icon: <EmojiEventsIcon sx={{ color: '#ffffff' }} /> },
  ];

  // 2. Score Distribution calculation
  let excellentCount = 0;
  let goodCount = 0;
  let averageCount = 0;
  let needsImprovementCount = 0;

  if (hasRealData) {
    rankings.forEach((r: any) => {
      const score = r.productivityScore ?? r.productivity_score ?? 0;
      if (score >= 90) excellentCount++;
      else if (score >= 75) goodCount++;
      else if (score >= 60) averageCount++;
      else needsImprovementCount++;
    });
  }

  const scoreDistribution = [
    { name: 'Excellent (90-100)', value: excellentCount, color: '#2fb344' },
    { name: 'Good (75-89)', value: goodCount, color: '#206bc4' },
    { name: 'Average (60-74)', value: averageCount, color: '#f59f00' },
    { name: 'Needs Improvement (<60)', value: needsImprovementCount, color: '#d63939' }
  ];

  // 3. Performance by Department calculation
  let departmentPerformance: any[] = [];
  if (hasRealData) {
    const deptsMap: Record<string, { totalScore: number, totalEff: number, totalUtil: number, count: number }> = {};
    rankings.forEach((r: any) => {
      const dName = r.departmentName ?? r.department_name ?? 'General';
      if (!deptsMap[dName]) {
        deptsMap[dName] = { totalScore: 0, totalEff: 0, totalUtil: 0, count: 0 };
      }
      deptsMap[dName].totalScore += r.productivityScore ?? r.productivity_score ?? 0;
      deptsMap[dName].totalEff += r.efficiencyScore ?? r.efficiency_score ?? 0;
      deptsMap[dName].totalUtil += r.utilizationPercentage ?? r.utilization_percentage ?? 0;
      deptsMap[dName].count++;
    });

    departmentPerformance = Object.entries(deptsMap).map(([name, val]) => ({
      name,
      score: Number((val.totalScore / val.count).toFixed(1)),
      efficiency: Number((val.totalEff / val.count).toFixed(1)),
      utilization: Number((val.totalUtil / val.count).toFixed(1))
    }));
    // Append Overall Average row
    departmentPerformance.push({
      name: 'Overall Average',
      score: Number(avgPerfScore.toFixed(1)),
      efficiency: Number(avgEfficiency.toFixed(1)),
      utilization: Number(avgUtilization.toFixed(1))
    });
  }

  // 4. Employee Rankings summary table mapping
  const employeeRankingsList = hasRealData
    ? rankings.map((r: any) => ({
        rank: r.performanceRank ?? r.performance_rank,
        name: r.employeeName ?? r.employee_name,
        role: r.teamName ?? r.team_name ?? 'Team Member',
        score: r.productivityScore ?? r.productivity_score,
        efficiency: `${(r.efficiencyScore ?? r.efficiency_score).toFixed(1)}%`,
        utilization: `${(r.utilizationPercentage ?? r.utilization_percentage).toFixed(1)}%`,
        tasks: `${Math.round((r.actualHours ?? r.actual_hours)/8)}/${Math.round((r.plannedHours ?? r.planned_hours)/8 || 1)}`,
        quality: `${Math.round(r.productivityScore ?? r.productivity_score ?? 0)}/100`,
        compliance: `${(r.timesheetComplianceScore ?? r.timesheet_compliance_score).toFixed(0)}%`
      }))
    : [];

  // 5. Planned vs Actual Top 5 Hours Variance mapping
  const plannedVsActualTop5 = hasRealData
    ? rankings.slice(0, 5).map((r: any) => ({
        name: r.employeeName ?? r.employee_name,
        planned: r.plannedHours ?? r.planned_hours,
        actual: r.actualHours ?? r.actual_hours,
        variance: r.varianceHours ?? r.variance_hours,
        efficiency: `${(r.efficiencyScore ?? r.efficiency_score).toFixed(1)}%`
      }))
    : [];

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const monthlyTrend = hasRealData ? [
    { name: currentMonth, score: avgPerfScore, efficiency: avgEfficiency }
  ] : [];

  const parameters = hasRealData ? [
    { name: 'Avg. Efficiency', weightage: '30%', score: `${avgEfficiency.toFixed(1)} / 100`, val: Math.min(100, avgEfficiency) },
    { name: 'Task Completion', weightage: '20%', score: `${taskCompletionPct.toFixed(1)} / 100`, val: Math.min(100, taskCompletionPct) },
    { name: 'Productivity Score', weightage: '20%', score: `${avgPerfScore.toFixed(1)} / 100`, val: Math.min(100, avgPerfScore) },
    { name: 'Timesheet Compliance', weightage: '10%', score: `${timesheetComplianceVal.toFixed(1)} / 100`, val: timesheetComplianceVal }
  ] : [];

  const totalEmployeesCount = rankings.length;

  if (!canViewPerformance) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">You don't have permission to view performance data.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#090d16', color: '#ffffff', minHeight: '100vh', p: 3 }}>
      {/* Top filter bar */}
      <Card sx={{ mb: 3, p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>PERFORMANCE DASHBOARD</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Track, Analyze and Improve Employee Performance</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Month Filter */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
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
                  <MenuItem key={opt.value || 'all'} value={opt.value} sx={{ fontSize: '0.875rem' }}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Department Filter */}
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

            {/* Team Filter (cascades from department) */}
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

            <Button variant="outlined" startIcon={<DownloadIcon />} size="small" sx={{ borderColor: '#1d243a', color: '#ffffff' }} onClick={() => refetch()}>
              Refresh Data
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* KPI metric summary row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi: any, idx: number) => (
          <Grid size={{ xs: 12, sm: 6, md: 2 }} key={idx}>
            <Card sx={{ height: '100%', bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff' }}>
              <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
        ))}
      </Grid>

      {/* Row 1 Content */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Performance Score Trend */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PERFORMANCE SCORE TREND</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
            <ResponsiveContainer width="99%" height={300} minHeight={0}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d243a" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="score" stroke="#206bc4" strokeWidth={2.5} name="Performance Score" />
                <Line type="monotone" dataKey="efficiency" stroke="#2fb344" strokeWidth={2.5} name="Efficiency %" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Performance Score Distribution */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PERFORMANCE SCORE DISTRIBUTION</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
            <Box sx={{ position: 'relative', height: 185, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="99%" height={185} minHeight={160}>
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {scoreDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{totalEmployeesCount}</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6875rem' }}>Employees</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
              {scoreDistribution.map((d: any, i: number) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                    <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>{d.name}</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6875rem' }}>{d.value}</Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Performance by Department */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PERFORMANCE BY DEPARTMENT</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Department</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Avg. Score</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Avg. Efficiency %</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Avg. Utilization %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departmentPerformance.map((dept: any, idx: number) => (
                    <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' }, fontWeight: dept.name === 'Overall Average' ? 700 : 500 }}>
                      <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: dept.name === 'Overall Average' ? 700 : 600 }}>{dept.name}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{dept.score}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{dept.efficiency}%</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{dept.utilization}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2 Content */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Employee Performance Leaderboard */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 330 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>EMPLOYEE PERFORMANCE SUMMARY</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Rank</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Employee</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Role / Team</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Score</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Efficiency</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Utilization</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Tasks Done</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Quality Score</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Compliance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeRankingsList.map((emp: any, idx: number) => (
                    <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                      <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>{emp.rank}</TableCell>
                      <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>{emp.name}</TableCell>
                      <TableCell sx={{ color: '#94a3b8', p: 0.5, fontSize: '0.75rem' }}>{emp.role}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>{emp.score.toFixed(1)}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{emp.efficiency}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{emp.utilization}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{emp.tasks}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{emp.quality}</TableCell>
                      <TableCell align="right" sx={{ color: '#10b981', p: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>{emp.compliance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Performance by parameters */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 330 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PERFORMANCE BY PARAMETERS (Average)</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Parameter</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Weightage</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Score</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Achieved</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parameters.map((p: any, idx: number) => (
                    <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                      <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{p.name}</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', p: 0.5, fontSize: '0.75rem' }}>{p.weightage}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>{p.score}</TableCell>
                      <TableCell sx={{ p: 0.5, width: 80 }}>
                        <LinearProgress
                          variant="determinate"
                          value={p.val}
                          sx={{
                            height: 6,
                            borderRadius: 1,
                            bgcolor: '#1d243a',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: p.val >= 90 ? '#2fb344' : p.val >= 80 ? '#f59f00' : '#d63939'
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3 Content */}
      <Grid container spacing={3}>
        {/* Planned vs Actual hours */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 300 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PLANNED VS ACTUAL HOURS (Top 5)</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Employee</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Planned</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Actual</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Variance</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Efficiency</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plannedVsActualTop5.map((p: any, idx: number) => (
                    <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                      <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>{p.name}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{p.planned.toFixed(0)}</TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{p.actual.toFixed(0)}</TableCell>
                      <TableCell align="right" sx={{ color: p.variance < 0 ? '#10b981' : '#ef4444', p: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>
                        {p.variance > 0 ? `+${p.variance.toFixed(0)}` : p.variance.toFixed(0)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>{p.efficiency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Task Completion Gauge */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 300, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TASK COMPLETION RATE</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
            <Box sx={{ position: 'relative', height: 175, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="99%" height={175} minHeight={150}>
                <PieChart>
                  <Pie
                    data={[{ value: taskCompletionPct }, { value: Math.max(0, 100 - taskCompletionPct) }]}
                    dataKey="value"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={55}
                    outerRadius={75}
                    cx="50%"
                    cy="85%"
                  >
                    <Cell fill="#2fb344" />
                    <Cell fill="#1d243a" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ position: 'absolute', bottom: '15%', textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 850 }}>{taskCompletionPct.toFixed(1)}%</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6875rem' }}>{tasksCompletedText} Tasks</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Utilization Rate Gauge */}
        <Grid size={{ xs: 12, md: 2 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 300, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>UTILIZATION RATE</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
            <Box sx={{ position: 'relative', height: 175, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="99%" height={175} minHeight={150}>
                <PieChart>
                  <Pie
                    data={[{ value: avgUtilization }, { value: Math.max(0, 100 - avgUtilization) }]}
                    dataKey="value"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={55}
                    outerRadius={75}
                    cx="50%"
                    cy="85%"
                  >
                    <Cell fill="#4299e1" />
                    <Cell fill="#1d243a" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ position: 'absolute', bottom: '15%', textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 850 }}>{avgUtilization.toFixed(1)}%</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6875rem' }}>Avg. Utilization</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Performance Insights */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 300, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PERFORMANCE INSIGHTS</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
              {[
                { txt: `Overall performance score is currently at ${avgPerfScore.toFixed(1)}%.`, color: '#2fb344', icon: <ArrowDropUpIcon sx={{ color: '#2fb344' }} /> },
                { txt: `Average efficiency is at ${avgEfficiency.toFixed(1)}%. Keep up the good work!`, color: '#2fb344', icon: <CheckCircleIcon sx={{ fontSize: 14, color: '#2fb344', mt: 0.2 }} /> },
                { txt: `${rankings.filter((r: any) => (r.utilizationPercentage ?? r.utilization_percentage) < 50).length} employees have low utilization (<50%). Review workload.`, color: '#f59f00', icon: <WarningIcon sx={{ fontSize: 14, color: '#f59f00', mt: 0.2 }} /> },
                { txt: `${rankings.filter((r: any) => (r.timesheetComplianceScore ?? r.timesheet_compliance_score) < 90).length} employees need improvement in timesheet compliance.`, color: '#d63939', icon: <WarningIcon sx={{ fontSize: 14, color: '#d63939', mt: 0.2 }} /> }
              ].map((insight: any, idx: number) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', bgcolor: '#161f30', p: 1, borderRadius: 1.5 }}>
                  {insight.icon}
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#e2e8f0' }}>{insight.txt}</Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeePerformanceDashboard;
