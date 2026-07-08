import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Chip, Tooltip, CircularProgress, Alert,
  Avatar, TextField, MenuItem, IconButton, Stack, Divider,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useGetEmployeeLoadChart, type EmployeeLoadRow, type LoadTask } from '../../planning/services/planningService';

// ─── Constants ─────────────────────────────────────────────────────────────

const COLUMN_WIDTH = 56; // px per day column
const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 48;
const LABEL_WIDTH = 300;

// Professional, minimal color palette — 2 accent colors only
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  AVAILABLE:   { bg: '#f0fdf4', text: '#166534', dot: '#16a34a', label: 'Available'   },
  UNDERLOADED: { bg: '#f8fafc', text: '#475569', dot: '#94a3b8', label: 'Light Load'  },
  OPTIMAL:     { bg: '#eff6ff', text: '#1e40af', dot: '#2563eb', label: 'On Track'    },
  OVERLOADED:  { bg: '#fff7ed', text: '#9a3412', dot: '#ea580c', label: 'Overloaded'  },
};

const TASK_STATUS_COLOR: Record<string, string> = {
  NOT_STARTED: '#cbd5e1',
  IN_PROGRESS: '#2563eb',
  COMPLETED:   '#16a34a',
  ON_HOLD:     '#d97706',
  CANCELLED:   '#94a3b8',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function diffDays(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function fmtDateFull(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function isoAfter(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Build list of day headers for the timeline
function buildDays(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// Group weeks from day list for month/week header rendering
function buildWeekHeaders(days: Date[]): { label: string; span: number }[] {
  const groups: { label: string; span: number }[] = [];
  let cur = '';
  let span = 0;
  for (const d of days) {
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    if (label !== cur) {
      if (cur) groups.push({ label: cur, span });
      cur = label;
      span = 1;
    } else {
      span++;
    }
  }
  if (cur) groups.push({ label: cur, span });
  return groups;
}

// ─── Sub-components ────────────────────────────────────────────────────────

interface StatusBadgeProps { status: EmployeeLoadRow['loadStatus'] }
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.UNDERLOADED;
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      px: '8px', py: '2px', borderRadius: '20px',
      bgcolor: s.bg, border: `1px solid ${s.dot}22`,
    }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: s.dot, flexShrink: 0 }} />
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: s.text, lineHeight: 1.2 }}>
        {s.label}
      </Typography>
    </Box>
  );
};

interface GanttBarProps {
  task: LoadTask;
  fromDate: Date;
  days: Date[];
}
const GanttBar: React.FC<GanttBarProps> = ({ task, fromDate, days }) => {
  if (!task.startDate || !task.endDate) return null;
  const startD = new Date(task.startDate);
  const endD   = new Date(task.endDate);
  const chartEnd = days[days.length - 1];
  const chartStart = fromDate;

  // Clamp to visible range
  const clampedStart = startD < chartStart ? chartStart : startD;
  const clampedEnd   = endD   > chartEnd   ? chartEnd   : endD;
  if (clampedStart > clampedEnd) return null;

  const left  = diffDays(chartStart, clampedStart) * COLUMN_WIDTH;
  const width = (diffDays(clampedStart, clampedEnd) + 1) * COLUMN_WIDTH - 2;
  const barColor = TASK_STATUS_COLOR[task.status] ?? '#2563eb';
  const progressW = Math.min(100, task.progress * 100);

  return (
    <Tooltip
      arrow
      placement="top"
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 12 }}>{task.taskCode} — {task.taskTitle}</Typography>
          <Typography sx={{ fontSize: 11, opacity: 0.85 }}>Project: {task.projectName}</Typography>
          <Typography sx={{ fontSize: 11, opacity: 0.85 }}>
            {fmtDate(task.startDate!)} → {fmtDate(task.endDate!)}
          </Typography>
          <Typography sx={{ fontSize: 11, opacity: 0.85 }}>
            Progress: {Math.round(progressW)}% &nbsp;·&nbsp; {task.assignedHours}h assigned
          </Typography>
          <Typography sx={{ fontSize: 11, opacity: 0.85 }}>Status: {task.status.replace(/_/g, ' ')}</Typography>
        </Box>
      }
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          left,
          width: Math.max(width, 4),
          height: 22,
          borderRadius: '4px',
          bgcolor: `${barColor}22`,
          border: `1.5px solid ${barColor}55`,
          overflow: 'hidden',
          cursor: 'default',
        }}
      >
        {/* Progress fill */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0,
          width: `${progressW}%`, height: '100%',
          bgcolor: `${barColor}44`,
        }} />
        {width > 48 && (
          <Typography sx={{
            position: 'absolute', top: '50%', left: 6,
            transform: 'translateY(-50%)',
            fontSize: 9, fontWeight: 600, color: barColor,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: width - 8,
            lineHeight: 1,
          }}>
            {task.taskCode}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
};

// ─── Today line overlay ────────────────────────────────────────────────────
interface TodayLineProps { fromDate: Date; days: Date[]; totalRows: number }
const TodayLine: React.FC<TodayLineProps> = ({ fromDate, days, totalRows }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const idx = diffDays(fromDate, today);
  if (idx < 0 || idx >= days.length) return null;
  return (
    <Box sx={{
      position: 'absolute',
      top: 0,
      left: idx * COLUMN_WIDTH + COLUMN_WIDTH / 2,
      width: 1.5,
      height: HEADER_HEIGHT + totalRows * ROW_HEIGHT,
      bgcolor: '#ef4444',
      zIndex: 10,
      pointerEvents: 'none',
    }}>
      <Box sx={{
        position: 'absolute', top: -4, left: -5,
        width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444',
      }} />
    </Box>
  );
};

// ─── Employee Row ──────────────────────────────────────────────────────────

interface EmployeeRowProps {
  row: EmployeeLoadRow;
  fromDate: Date;
  days: Date[];
  isExpanded: boolean;
  onToggle: () => void;
  depth: number;
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({ row, fromDate, days, isExpanded, onToggle, depth }) => {
  return (
    <>
      {/* Left label */}
      <Box sx={{ display: 'flex', alignItems: 'center', height: ROW_HEIGHT, borderBottom: '1px solid #f1f5f9' }}>
        <Box sx={{ width: depth * 16, flexShrink: 0 }} />
        {/* expand/collapse icon */}
        <IconButton size="small" onClick={onToggle} sx={{ mr: 0.5, color: 'text.secondary', p: 0.25 }}>
          {isExpanded
            ? <ExpandMoreIcon sx={{ fontSize: 14 }} />
            : <ChevronRightIcon sx={{ fontSize: 14 }} />}
        </IconButton>
        <Avatar
          src={row.profilePhotoUrl ?? undefined}
          sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#e2e8f0', color: '#475569', mr: 1, flexShrink: 0 }}
        >
          <PersonIcon sx={{ fontSize: 14 }} />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#1e293b', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {row.displayName}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: '#94a3b8', lineHeight: 1.2 }}>
            {row.designation ?? row.employeeCode}
          </Typography>
        </Box>
        <Box sx={{ pr: 1, flexShrink: 0 }}>
          <StatusBadge status={row.loadStatus} />
        </Box>
      </Box>

      {/* Gantt bar row */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center',
          height: ROW_HEIGHT,
          position: 'relative',
          borderBottom: '1px solid #f1f5f9',
          bgcolor: row.loadStatus === 'OVERLOADED' ? '#fff7ed22' : 'transparent',
        }}
      >
        {/* Day grid cells */}
        {days.map((d, i) => (
          <Box
            key={i}
            sx={{
              width: COLUMN_WIDTH,
              height: '100%',
              flexShrink: 0,
              borderRight: '1px solid #f1f5f9',
              bgcolor: d.getDay() === 0 || d.getDay() === 6 ? '#f8fafc' : 'transparent',
            }}
          />
        ))}
        {/* Loaded-until badge at right edge */}
        {row.loadedUntil && (
          <Tooltip title={`Loaded until: ${fmtDateFull(row.loadedUntil)}`} arrow placement="top">
            <Box sx={{
              position: 'absolute',
              left: (diffDays(fromDate, new Date(row.loadedUntil)) + 1) * COLUMN_WIDTH,
              top: '50%',
              transform: 'translateY(-50%)',
              height: 28,
              width: 2,
              bgcolor: '#64748b44',
              zIndex: 5,
              '&::after': {
                content: `"${fmtDate(row.loadedUntil)}"`,
                position: 'absolute',
                top: -20,
                left: 4,
                fontSize: 9,
                fontWeight: 700,
                color: '#64748b',
                whiteSpace: 'nowrap',
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                px: '4px',
                py: '1px',
                lineHeight: 1.4,
              },
            }} />
          </Tooltip>
        )}
        {/* Task bars */}
        {isExpanded && row.tasks.map((task, i) => (
          <GanttBar key={i} task={task} fromDate={fromDate} days={days} />
        ))}
        {/* Collapsed: show aggregated bar */}
        {!isExpanded && row.loadedUntil && row.tasks.length > 0 && (() => {
          const earliestStart = row.tasks.reduce((min, t) => {
            if (!t.startDate) return min;
            return !min || t.startDate < min ? t.startDate : min;
          }, null as string | null);
          if (!earliestStart) return null;
          const startD = new Date(earliestStart);
          const endD   = new Date(row.loadedUntil);
          const left   = Math.max(0, diffDays(fromDate, startD)) * COLUMN_WIDTH;
          const width  = (diffDays(startD > fromDate ? startD : fromDate, endD) + 1) * COLUMN_WIDTH - 2;
          const ss = STATUS_STYLES[row.loadStatus] ?? STATUS_STYLES.UNDERLOADED;
          return (
            <Tooltip
              arrow
              placement="top"
              title={`${row.activeTaskCount} active task(s) · ${row.totalAssignedHours}h assigned`}
            >
              <Box sx={{
                position: 'absolute',
                top: '50%', transform: 'translateY(-50%)',
                left, width: Math.max(width, 4),
                height: 16, borderRadius: 2,
                bgcolor: ss.bg,
                border: `1.5px solid ${ss.dot}55`,
              }} />
            </Tooltip>
          );
        })()}
      </Box>
    </>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
  { label: '1M',  days: 30  },
  { label: '3M',  days: 90  },
  { label: '6M',  days: 180 },
];

const EmployeeLoadPage: React.FC = () => {
  const today = isoToday();
  const [range, setRange] = useState(90);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const fromDate = today;
  const toDate   = isoAfter(range);

  const { data, isLoading, isError, refetch } = useGetEmployeeLoadChart({
    fromDate,
    toDate,
  });

  const rows = data?.rows ?? [];

  // Filter by search
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      r =>
        r.displayName.toLowerCase().includes(q) ||
        r.employeeCode.toLowerCase().includes(q) ||
        (r.designation ?? '').toLowerCase().includes(q) ||
        (r.department ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  // Build timeline days
  const chartFromDate = useMemo(() => new Date(fromDate), [fromDate]);
  const chartToDate   = useMemo(() => new Date(toDate),   [toDate]);
  const days          = useMemo(() => buildDays(chartFromDate, chartToDate), [chartFromDate, chartToDate]);
  const weekHeaders   = useMemo(() => buildWeekHeaders(days), [days]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Summary stats
  const stats = useMemo(() => ({
    total:      filteredRows.length,
    available:  filteredRows.filter(r => r.loadStatus === 'AVAILABLE').length,
    optimal:    filteredRows.filter(r => r.loadStatus === 'OPTIMAL').length,
    overloaded: filteredRows.filter(r => r.loadStatus === 'OVERLOADED').length,
  }), [filteredRows]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: '100%' }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Employee Load Chart
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.25 }}>
            Team workload distribution across {days.length} days · based on task assignments
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search by name, code or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
          />
          <ToggleButtonGroup
            exclusive
            size="small"
            value={range}
            onChange={(_e, v) => { if (v !== null) setRange(v); }}
            sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}
          >
            {RANGE_OPTIONS.map(o => (
              <ToggleButton
                key={o.days}
                value={o.days}
                sx={{ fontSize: 12, fontWeight: 600, px: 1.5, py: 0.5, border: 'none', color: '#64748b',
                  '&.Mui-selected': { bgcolor: '#1e293b', color: '#fff', '&:hover': { bgcolor: '#334155' } } }}
              >
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => refetch()} sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <RefreshIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Summary stat pills ────────────────────────────────────────── */}
      <Stack direction="row" spacing={1.5} mb={2} flexWrap="wrap">
        {[
          { label: 'Total',       value: stats.total,      color: '#1e293b' },
          { label: 'Available',   value: stats.available,  color: '#16a34a' },
          { label: 'On Track',    value: stats.optimal,    color: '#2563eb' },
          { label: 'Overloaded',  value: stats.overloaded, color: '#ea580c' },
        ].map(s => (
          <Paper key={s.label} variant="outlined" sx={{ px: 2, py: 1, display: 'flex', gap: 1.5, alignItems: 'center', borderRadius: '8px' }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
            <Typography sx={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{s.label}</Typography>
          </Paper>
        ))}
        <Box sx={{ flex: 1 }} />
        <Paper variant="outlined" sx={{ px: 2, py: 1, display: 'flex', gap: 1, alignItems: 'center', borderRadius: '8px' }}>
          <CalendarTodayIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
          <Typography sx={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
            {fmtDateFull(fromDate)} — {fmtDateFull(toDate)}
          </Typography>
        </Paper>
      </Stack>

      {/* ── Loading / Error ────────────────────────────────────────────── */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={32} sx={{ color: '#206bc4' }} />
        </Box>
      )}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>Failed to load employee load data. Please try again.</Alert>
      )}

      {/* ── Gantt Chart ───────────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <Paper
          variant="outlined"
          sx={{ overflow: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}
        >
          {filteredRows.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <EventAvailableIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
              <Typography color="textSecondary" sx={{ fontSize: 14 }}>
                No employee load data found for the selected period.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ minWidth: LABEL_WIDTH * 2 + days.length * COLUMN_WIDTH, display: 'flex', position: 'relative' }}>

              {/* LEFT PANEL — Employee labels */}
              <Box sx={{ width: LABEL_WIDTH, flexShrink: 0, borderRight: '2px solid #e2e8f0', position: 'sticky', left: 0, bgcolor: '#ffffff', zIndex: 20 }}>
                {/* Header cell */}
                <Box sx={{
                  height: HEADER_HEIGHT * 2,
                  display: 'flex', alignItems: 'center', px: 2,
                  borderBottom: '2px solid #e2e8f0',
                  bgcolor: '#f8fafc',
                }}>
                  <FilterListIcon sx={{ fontSize: 14, color: '#94a3b8', mr: 0.75 }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Employee
                  </Typography>
                </Box>
                {/* Employee rows (label side) */}
                {filteredRows.map(row => (
                  <Box key={row.employeeId} sx={{ display: 'flex', alignItems: 'center', height: ROW_HEIGHT, px: 1.5, borderBottom: '1px solid #f1f5f9', gap: 1 }}>
                    <IconButton size="small" onClick={() => toggleExpand(row.employeeId)} sx={{ color: '#cbd5e1', p: 0.25, flexShrink: 0 }}>
                      {expandedIds.has(row.employeeId)
                        ? <ExpandMoreIcon sx={{ fontSize: 14 }} />
                        : <ChevronRightIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                    <Avatar
                      src={row.profilePhotoUrl ?? undefined}
                      sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#e2e8f0', color: '#475569', flexShrink: 0 }}
                    >
                      <PersonIcon sx={{ fontSize: 13 }} />
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                        {row.displayName}
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                        {row.designation ?? row.department ?? row.employeeCode}
                      </Typography>
                    </Box>
                    <StatusBadge status={row.loadStatus} />
                  </Box>
                ))}
              </Box>

              {/* RIGHT PANEL — Gantt chart */}
              <Box sx={{ flex: 1, position: 'relative' }}>

                {/* Month header */}
                <Box sx={{ display: 'flex', height: HEADER_HEIGHT, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                  {weekHeaders.map((wh, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: wh.span * COLUMN_WIDTH,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRight: '1px solid #e2e8f0',
                        flexShrink: 0,
                      }}
                    >
                      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#475569', letterSpacing: 0.3 }}>
                        {wh.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Day header */}
                <Box sx={{ display: 'flex', height: HEADER_HEIGHT, borderBottom: '2px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                  {days.map((d, i) => {
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    const isToday = d.toISOString().slice(0, 10) === today;
                    return (
                      <Box
                        key={i}
                        sx={{
                          width: COLUMN_WIDTH, flexShrink: 0,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          borderRight: '1px solid #f1f5f9',
                          bgcolor: isToday ? '#eff6ff' : isWeekend ? '#f8fafc' : 'transparent',
                        }}
                      >
                        <Typography sx={{ fontSize: 9, fontWeight: isToday ? 700 : 400, color: isToday ? '#2563eb' : isWeekend ? '#cbd5e1' : '#94a3b8', lineHeight: 1 }}>
                          {d.toLocaleDateString('en-GB', { weekday: 'narrow' })}
                        </Typography>
                        <Typography sx={{ fontSize: 9.5, fontWeight: isToday ? 700 : 500, color: isToday ? '#2563eb' : isWeekend ? '#cbd5e1' : '#64748b', lineHeight: 1.4 }}>
                          {d.getDate()}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                {/* Today line */}
                <TodayLine fromDate={chartFromDate} days={days} totalRows={filteredRows.length} />

                {/* Employee Gantt rows */}
                {filteredRows.map(row => {
                  const isExpanded = expandedIds.has(row.employeeId);
                  return (
                    <Box key={row.employeeId} sx={{ position: 'relative', height: ROW_HEIGHT, borderBottom: '1px solid #f1f5f9' }}>
                      {/* Weekend column shading */}
                      {days.map((d, i) => {
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        if (!isWeekend) return null;
                        return (
                          <Box
                            key={i}
                            sx={{
                              position: 'absolute', top: 0, left: i * COLUMN_WIDTH,
                              width: COLUMN_WIDTH, height: '100%',
                              bgcolor: '#f8fafc',
                              pointerEvents: 'none',
                            }}
                          />
                        );
                      })}

                      {/* Loaded-until end marker */}
                      {row.loadedUntil && (() => {
                        const endIdx = diffDays(chartFromDate, new Date(row.loadedUntil));
                        if (endIdx < 0 || endIdx >= days.length) return null;
                        return (
                          <Tooltip
                            title={`Loaded until ${fmtDateFull(row.loadedUntil)}`}
                            placement="top" arrow
                          >
                            <Box sx={{
                              position: 'absolute',
                              left: (endIdx + 1) * COLUMN_WIDTH - 1,
                              top: 6, bottom: 6,
                              width: 2,
                              bgcolor: '#64748b55',
                              borderRadius: 1,
                              zIndex: 4,
                            }} />
                          </Tooltip>
                        );
                      })()}

                      {/* Task bars (when expanded) */}
                      {isExpanded
                        ? row.tasks.map((task, i) => (
                            <GanttBar key={i} task={task} fromDate={chartFromDate} days={days} />
                          ))
                        : (() => {
                            // Collapsed summary bar
                            if (!row.loadedUntil || row.tasks.length === 0) return null;
                            const earliest = row.tasks.reduce((min, t) => {
                              if (!t.startDate) return min;
                              return !min || t.startDate < min ? t.startDate : min;
                            }, null as string | null);
                            if (!earliest) return null;
                            const startD = new Date(earliest);
                            const endD   = new Date(row.loadedUntil);
                            const s0     = startD < chartFromDate ? chartFromDate : startD;
                            const left   = diffDays(chartFromDate, s0) * COLUMN_WIDTH;
                            const width  = (diffDays(s0, endD) + 1) * COLUMN_WIDTH - 4;
                            if (width <= 0) return null;
                            const ss = STATUS_STYLES[row.loadStatus] ?? STATUS_STYLES.UNDERLOADED;
                            return (
                              <Tooltip
                                placement="top" arrow
                                title={`${row.activeTaskCount} task(s) · ${row.totalAssignedHours}h assigned · loaded until ${fmtDateFull(row.loadedUntil)}`}
                              >
                                <Box sx={{
                                  position: 'absolute',
                                  top: '50%', transform: 'translateY(-50%)',
                                  left, width: Math.max(width, 8),
                                  height: 18, borderRadius: '4px',
                                  bgcolor: ss.bg,
                                  border: `1.5px solid ${ss.dot}66`,
                                  display: 'flex', alignItems: 'center',
                                  overflow: 'hidden', pl: 0.75,
                                  cursor: 'pointer',
                                  zIndex: 2,
                                }}
                                onClick={() => toggleExpand(row.employeeId)}
                                >
                                  {width > 60 && (
                                    <Typography sx={{ fontSize: 9.5, fontWeight: 600, color: ss.dot, whiteSpace: 'nowrap' }}>
                                      {row.activeTaskCount}t · {row.totalAssignedHours}h
                                    </Typography>
                                  )}
                                </Box>
                              </Tooltip>
                            );
                          })()
                      }
                    </Box>
                  );
                })}
              </Box>

            </Box>
          )}
        </Paper>
      )}

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Legend:</Typography>
        {Object.entries(STATUS_STYLES).map(([key, s]) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.dot }} />
            <Typography sx={{ fontSize: 11, color: '#64748b' }}>{s.label}</Typography>
          </Box>
        ))}
        <Divider orientation="vertical" flexItem />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 20, height: 2, bgcolor: '#ef4444' }} />
          <Typography sx={{ fontSize: 11, color: '#64748b' }}>Today</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 2, height: 12, bgcolor: '#64748b55' }} />
          <Typography sx={{ fontSize: 11, color: '#64748b' }}>Loaded until date</Typography>
        </Box>
        <Typography sx={{ fontSize: 11, color: '#94a3b8', ml: 'auto' }}>
          Click a row to expand/collapse individual task bars
        </Typography>
      </Box>
    </Box>
  );
};

export default EmployeeLoadPage;
