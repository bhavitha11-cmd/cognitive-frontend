import React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Grid, Card, CardContent, Typography, Box, Divider, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, LinearProgress
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

import { useGetProjectSummary, useGetProjectCharts } from '../services/dashboardService';

import WidgetErrorBoundary from '../components/WidgetErrorBoundary';
import { CardSkeleton } from '../components/DashboardSkeletons';

export const ProjectDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetProjectSummary(id);
  const { data: charts, refetch: refetchCharts } = useGetProjectCharts(id);

  // 1. KPI mapping
  const plannedHoursVal = summary?.plannedHours ?? 0.00;
  const actualHoursVal = summary?.actualHours ?? 0.00;
  const remainingHoursVal = summary?.remainingHours ?? 0.00;
  const completionPctVal = summary?.completionPercentage ?? 0.00;
  const plannedVsActualPct = plannedHoursVal > 0
    ? Math.round(((actualHoursVal / plannedHoursVal) * 100) * 10) / 10
    : 0;

  const kpis = [
    { title: 'PLANNED HOURS', value: plannedHoursVal.toFixed(2), desc: 'Hours', color: '#206bc4', icon: <FolderIcon sx={{ color: '#ffffff' }} /> },
    { title: 'ACTUAL HOURS', value: actualHoursVal.toFixed(2), desc: 'Hours', color: '#2fb344', icon: <QueryBuilderIcon sx={{ color: '#ffffff' }} /> },
    { title: 'REMAINING HOURS', value: remainingHoursVal.toFixed(2), desc: 'Hours', color: '#f59f00', icon: <QueryBuilderIcon sx={{ color: '#ffffff' }} /> },
    { title: 'COMPLETION %', value: `${completionPctVal.toFixed(2)}%`, desc: 'On Track', color: '#16a34a', icon: <FolderIcon sx={{ color: '#ffffff' }} /> },
    { title: 'PLANNED VS ACTUAL', value: `${plannedVsActualPct > 0 ? '+' : ''}${plannedVsActualPct.toFixed(2)}%`, desc: plannedVsActualPct < 0 ? 'Under Planned' : 'Over Planned', color: '#00bcd4', icon: <QueryBuilderIcon sx={{ color: '#ffffff' }} /> },
    { title: 'ESTIMATED END DATE', value: summary?.deliveryDate || 'N/A', desc: `Delivery Date`, color: '#d63939', icon: <CalendarMonthIcon sx={{ color: '#ffffff' }} /> },
  ];

  // 2. S-Curve Cumulative Hours mapping
  const cumulativeHoursData = (charts?.burnCurve ?? []).map((b) => ({
    date: b.date,
    plannedCumulativeHours: b.plannedCumulativeHours,
    actualCumulativeHours: b.actualCumulativeHours
  }));

  // 3. Task Status Donut mapping
  const taskStatusData = (charts?.taskStatuses ?? []).map((s: any) => ({
    name: s.status,
    value: s.count,
    color: s.status === 'COMPLETED' ? '#2fb344' : s.status === 'IN_PROGRESS' ? '#206bc4' : s.status === 'NOT_STARTED' ? '#f59f00' : '#d63939'
  }));

  const totalTasksSum = taskStatusData.reduce((acc, curr) => acc + curr.value, 0);

  // 4. Top Time Consuming Tasks mapping (replaces categoryHours which backend does not provide)
  const topTasksData = (charts?.topTimeConsumingTasks ?? []).map((t, idx) => ({
    name: t.title,
    value: t.actualHours,
    color: ['#206bc4', '#2fb344', '#f59f00', '#ae3ec9', '#00bcd4'][idx % 5]
  }));

  // 5. Task Wise Progress mapping — backend provides topTimeConsumingTasks (not tasksProgress)
  const taskWiseProgress = (charts?.topTimeConsumingTasks ?? []).map((t, idx) => ({
    id: t.taskCode || `T-0${idx + 1}`,
    name: t.title,
    planned: t.estimatedHours,
    actual: t.actualHours,
    remaining: Math.max(0, t.estimatedHours - t.actualHours),
    progress: t.estimatedHours > 0 ? Math.min(100, Math.round((t.actualHours / t.estimatedHours) * 100)) : 0,
    status: t.actualHours >= t.estimatedHours ? 'COMPLETED' : 'IN_PROGRESS',
    color: t.actualHours >= t.estimatedHours ? '#2fb344' : '#206bc4',
    assignee: 'N/A'
  }));

  // 6. Ideal vs Actual Remaining Burn Down mapping
  const burnDownData = (charts?.burnCurve ?? []).map((b) => ({
    date: b.date,
    ideal: Math.max(0, plannedHoursVal - b.plannedCumulativeHours),
    actual: Math.max(0, plannedHoursVal - b.actualCumulativeHours)
  }));

  // 7. Top Contributors — not returned by backend; section shows empty state
  const contributors: Array<{ name: string; hours: number; pct: string }> = [];

  // 8. Milestones — not returned by backend; section shows empty state
  const milestones: Array<{ name: string; planned: string; actual: string; status: string; color: string }> = [];

  // 9. Issues — not returned by backend; section shows empty state
  const issues: Array<{ desc: string; impact: string; status: string; color: string; owner: string }> = [];

  const handleRefreshData = () => {
    refetchSummary();
    refetchCharts();
  };

  return (
    <Box sx={{ bgcolor: '#090d16', color: '#ffffff', minHeight: '100vh', p: 3 }}>
      
      {/* Header and Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard/advanced')} sx={{ color: '#4299e1' }}>
            Back to Dashboard
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {summaryLoading ? 'Loading Project Details...' : `${summary?.projectCode || 'Code'} — ${summary?.name || 'Name'}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button variant="outlined" size="small" sx={{ borderColor: '#1d243a', color: '#ffffff' }} onClick={handleRefreshData}>
            Refresh Project
          </Button>
        </Box>
      </Box>

      {/* Project Metadata Card */}
      <WidgetErrorBoundary title="Project details metadata" onRetry={refetchSummary}>
        {summaryLoading ? (
          <Card sx={{ mb: 3, p: 2, bgcolor: '#121824', borderColor: '#1d243a' }}><LinearProgress /></Card>
        ) : (
          <Card sx={{ mb: 3, p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff' }}>
            <Grid container spacing={3}>
              {[
                { label: 'Project Code', val: summary?.projectCode || 'N/A' },
                { label: 'Customer', val: summary?.customerName || 'N/A' },
                { label: 'Project Manager', val: summary?.projectManagerName || 'N/A' },
                { label: 'Delivery Date', val: summary?.deliveryDate || 'N/A' },
                { label: 'Completion', val: <Chip label={`${summary?.completionPercentage?.toFixed(0) ?? 0}%`} size="small" sx={{ fontSize: '0.6875rem', fontWeight: 800 }} /> }
              ].map((item, idx) => (
                <Grid size={{ xs: 6, sm: 3, md: 2.4 }} key={idx} sx={{ borderRight: idx < 4 ? '1px solid #1d243a' : 'none' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>{item.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: '#ffffff' }}>{item.val}</Typography>
                </Grid>
              ))}
            </Grid>
          </Card>
        )}
      </WidgetErrorBoundary>

      {/* KPI Cards Grid */}
      <WidgetErrorBoundary title="Project KPI hours summary" onRetry={refetchSummary}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {summaryLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 2 }} key={idx}>
                <CardSkeleton />
              </Grid>
            ))
          ) : (
            kpis.map((kpi, idx) => (
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
            ))
          )}
        </Grid>
      </WidgetErrorBoundary>

      {/* Row 1 Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Cumulative planned vs actual hours */}
        <Grid size={{ xs: 12, md: 5 }}>
          <WidgetErrorBoundary title="Burn Curve Chart" onRetry={refetchSummary}>
            <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PLANNED VS ACTUAL HOURS (Cumulative)</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
              {cumulativeHoursData.length === 0 ? (
                <Box sx={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No burn curve recorded</Box>
              ) : (
                <ResponsiveContainer width="99%" height="82%" minHeight={220}>
                  <LineChart data={cumulativeHoursData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d243a" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="plannedCumulativeHours" stroke="#206bc4" strokeWidth={2.5} name="Planned Cumulative" dot={{ fill: '#206bc4', r: 3 }} />
                    <Line type="monotone" dataKey="actualCumulativeHours" stroke="#2fb344" strokeWidth={3} name="Actual Cumulative" dot={{ fill: '#2fb344', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </WidgetErrorBoundary>
        </Grid>

        {/* Task Status pie */}
        <Grid size={{ xs: 12, md: 3 }}>
          <WidgetErrorBoundary title="Task Status Chart" onRetry={refetchCharts}>
            <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TASK STATUS</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
              {taskStatusData.length === 0 ? (
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No tasks linked to project</Box>
              ) : (
                <>
                  <Box sx={{ position: 'relative', height: 185, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="99%" height={185} minHeight={160}>
                      <PieChart>
                        <Pie
                          data={taskStatusData}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {taskStatusData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>{totalTasksSum}</Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6875rem' }}>Total Tasks</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
                    {taskStatusData.map((d: any, i: number) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                        <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>{d.name.slice(0, 12)}: <b>{d.value}</b></Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Card>
          </WidgetErrorBoundary>
        </Grid>

        {/* Hours By Task Category */}
        <Grid size={{ xs: 12, md: 4 }}>
          <WidgetErrorBoundary title="Category Hours Chart" onRetry={refetchCharts}>
            <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TOP TASKS BY HOURS</Typography>
              <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
              {topTasksData.length === 0 ? (
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No task hours recorded</Box>
              ) : (
                <>
                  <Box sx={{ position: 'relative', height: 185, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="99%" height={185} minHeight={160}>
                      <PieChart>
                        <Pie
                          data={topTasksData}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {topTasksData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{actualHoursVal.toFixed(0)}</Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6875rem' }}>Actual Hours</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                    {topTasksData.map((d, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                          <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>{d.name.slice(0, 18)}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6875rem' }}>{d.value.toFixed(1)}h</Typography>
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
        {/* Task Wise Progress Table */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 330 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TASK WISE PROGRESS</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            {taskWiseProgress.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>No task progress logs</Box>
            ) : (
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Task ID</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Task Name</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Planned</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Actual</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Progress</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Assignee</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {taskWiseProgress.map((p: any, idx: number) => (
                      <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                        <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>{p.id}</TableCell>
                        <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{p.name}</TableCell>
                        <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{p.planned.toFixed(1)}</TableCell>
                        <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{p.actual.toFixed(1)}</TableCell>
                        <TableCell align="right" sx={{ color: '#10b981', p: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>{p.progress.toFixed(0)}%</TableCell>
                        <TableCell sx={{ color: '#94a3b8', p: 0.5, fontSize: '0.75rem' }}>{p.assignee}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Burn Down Area Chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', height: 350 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>HOURS BURN DOWN (Remaining Hours)</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 2 }} />
            {burnDownData.length === 0 ? (
              <Box sx={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No burn down data</Box>
            ) : (
              <ResponsiveContainer width="99%" height="82%" minHeight={220}>
                <AreaChart data={burnDownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d243a" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" fill="none" name="Ideal Remaining" />
                  <Area type="monotone" dataKey="actual" stroke="#2fb344" fill="#2fb344" fillOpacity={0.15} name="Actual Remaining" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>

        {/* Top Contributors Table */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 330 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>TOP CONTRIBUTORS (By Actual Hours)</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            {contributors.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>No contributors logged hours</Box>
            ) : (
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Employee</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Actual Hours</TableCell>
                      <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>% Contrib</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contributors.map((c: any, idx: number) => (
                      <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                        <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>{c.name}</TableCell>
                        <TableCell align="right" sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{c.hours.toFixed(1)}h</TableCell>
                        <TableCell align="right" sx={{ color: '#2fb344', p: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>{c.pct}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Row 3 Content */}
      <Grid container spacing={3}>
        {/* Milestone Tracker */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 300 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>MILESTONE TRACKER</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            {milestones.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>No milestones logged in DB</Box>
            ) : (
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Milestone</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Planned Date</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Actual Date</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {milestones.map((m: any, idx: number) => (
                      <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                        <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>{m.name}</TableCell>
                        <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{m.planned}</TableCell>
                        <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{m.actual}</TableCell>
                        <TableCell sx={{ p: 0.5 }}>
                          <Chip label={m.status} size="small" color={m.color as any} sx={{ fontSize: '0.625rem', fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Issues & Risks */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 300 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>ISSUES / RISKS</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            {issues.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>No active project issues or risks</Box>
            ) : (
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ borderBottom: '2px solid #1d243a' }}>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Issue / Risk</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Impact</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Status</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 700, p: 0.5, fontSize: '0.75rem' }}>Owner</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {issues.map((i: any, idx: number) => (
                      <TableRow key={idx} sx={{ borderBottom: '1px solid #1d243a', '&:hover': { bgcolor: '#172033' } }}>
                        <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>{i.desc}</TableCell>
                        <TableCell sx={{ p: 0.5 }}>
                          <Chip label={i.impact} size="small" color={i.color as any} sx={{ fontSize: '0.625rem', fontWeight: 700 }} />
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', p: 0.5, fontSize: '0.75rem' }}>{i.status}</TableCell>
                        <TableCell sx={{ color: '#94a3b8', p: 0.5, fontSize: '0.75rem' }}>{i.owner}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Project Notes */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 2.5, bgcolor: '#121824', borderColor: '#1d243a', border: '1px solid', color: '#ffffff', minHeight: 300, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#94a3b8' }}>PROJECT NOTES</Typography>
            <Divider sx={{ borderColor: '#1d243a', mb: 1.5 }} />
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              No comments logged for project
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectDashboard;
