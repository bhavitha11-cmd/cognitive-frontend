import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import SearchIcon from '@mui/icons-material/Search';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import FolderSharedOutlinedIcon from '@mui/icons-material/FolderSharedOutlined';

import {
  useGetEmployees,
  useGetOffboardImpact,
  useExecuteOffboard,
  type OffboardExecutePayload,
} from '../services/hrService';

const STEPS = [
  'Select Employee',
  'Impact Analysis',
  'Transfer People',
  'Projects & Tasks',
  'Leaves & Timesheets',
  'Review & Confirm',
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22c55e',
  PROBATION: '#f59e0b',
  NOTICE_PERIOD: '#f97316',
  ON_LEAVE: '#3b82f6',
  SUSPENDED: '#ef4444',
  RESIGNED: '#6b7280',
  TERMINATED: '#374151',
};

// ─── Impact card ─────────────────────────────────────────────────────────────

interface ImpactCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  critical?: boolean;
}

const ImpactCard: React.FC<ImpactCardProps> = ({ icon, label, count, critical }) => {
  const hasItems = count > 0;
  const bg = hasItems ? (critical ? 'rgba(245,158,11,0.07)' : 'rgba(59,130,246,0.06)') : 'rgba(34,197,94,0.06)';
  const borderColor = hasItems ? (critical ? '#f59e0b' : '#93c5fd') : '#86efac';
  const countColor = hasItems ? (critical ? 'warning.main' : 'primary.main') : 'success.main';

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        bgcolor: bg,
        borderColor,
        borderRadius: 2.5,
        height: '100%',
        minHeight: 110,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: hasItems ? (critical ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.12)') : 'rgba(34,197,94,0.12)',
            color: hasItems ? (critical ? 'warning.main' : 'primary.main') : 'success.main',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography variant="body2" fontWeight={600} color="text.primary" lineHeight={1.3}>
          {label}
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
        <Typography variant="h4" fontWeight={800} color={countColor} lineHeight={1}>
          {count}
        </Typography>
        {hasItems ? (
          <Chip
            label="Needs action"
            size="small"
            color={critical ? 'warning' : 'primary'}
            variant="outlined"
            sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600 }}
          />
        ) : (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
            <Typography variant="caption" color="success.main" fontWeight={600}>Clear</Typography>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};

// ─── Employee autocomplete ───────────────────────────────────────────────────

const EmployeeAutocomplete: React.FC<{
  label: string;
  employees: any[];
  value: string;
  onChange: (id: string) => void;
  excludeId?: string;
}> = ({ label, employees, value, onChange, excludeId }) => {
  const opts = employees.filter(
    (e) => e.id !== excludeId && e.status === 'ACTIVE'
  );
  const selected = opts.find((e) => e.id === value) ?? null;
  return (
    <Autocomplete
      size="small"
      options={opts}
      value={selected}
      getOptionLabel={(e) => `${e.firstName} ${e.lastName}${e.employeeCode ? ` (${e.employeeCode})` : ''}`}
      onChange={(_, v) => onChange(v?.id ?? '')}
      renderInput={(params) => <TextField {...params} label={label} />}
      renderOption={(props, option) => (
        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, fontSize: '0.75rem', bgcolor: 'primary.main', fontWeight: 700 }}>
            {option.firstName?.[0]}{option.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {option.firstName} {option.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {option.employeeCode}{option.departmentName ? ` · ${option.departmentName}` : ''}
            </Typography>
          </Box>
        </Box>
      )}
      fullWidth
    />
  );
};

// ─── Main Wizard ─────────────────────────────────────────────────────────────

export const OffboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState('');

  // Step 0 state
  const [selectedId, setSelectedId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [finalStatus, setFinalStatus] = useState<'RESIGNED' | 'TERMINATED'>('RESIGNED');
  const [reason, setReason] = useState('');

  // Step 2 state – people
  const [newManagerId, setNewManagerId] = useState('');
  const [newTeamLeadId, setNewTeamLeadId] = useState('');
  const [newDeptHeadId, setNewDeptHeadId] = useState('');

  // Step 3 state – projects & tasks
  const [pmReassignments, setPmReassignments] = useState<Record<string, string>>({});
  const [bulkTaskTo, setBulkTaskTo] = useState('');

  // Step 4 state – leaves & timesheets
  const [leaveDisp, setLeaveDisp] = useState<'CANCEL_ALL' | 'KEEP'>('CANCEL_ALL');
  const [timeDisp, setTimeDisp] = useState<'AUTO_APPROVE' | 'AUTO_REJECT' | 'KEEP'>('KEEP');

  const { data: employeesData, isLoading: loadingEmployees } = useGetEmployees({ limit: 200 });
  const allEmployees = employeesData?.employees ?? [];
  const activeEmployees = allEmployees.filter((e) =>
    ['ACTIVE', 'PROBATION', 'NOTICE_PERIOD'].includes(e.status ?? '')
  );
  const filteredForSelect = search
    ? activeEmployees.filter(
        (e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          (e.employeeCode ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (e.departmentName ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : activeEmployees;

  const { data: impact, isLoading: loadingImpact } = useGetOffboardImpact(
    step >= 1 && selectedId ? selectedId : null
  );

  const { mutate: executeOffboard, isPending: executing } = useExecuteOffboard();

  const selectedEmployee = allEmployees.find((e) => e.id === selectedId);

  const canGoNext = (): boolean => {
    if (step === 0) return !!selectedId && !!effectiveDate;
    if (step === 1) return !!impact && !loadingImpact;
    if (step === 2) {
      if ((impact?.directReports.count ?? 0) > 0 && !newManagerId) return false;
      if ((impact?.teamsLed.count ?? 0) > 0 && !newTeamLeadId) return false;
      if ((impact?.departmentsHeaded.count ?? 0) > 0 && !newDeptHeadId) return false;
      return true;
    }
    return true;
  };

  const handleConfirm = () => {
    if (!selectedId || !impact) return;
    const payload: OffboardExecutePayload = {
      effectiveDate,
      finalStatus,
      reason: reason || undefined,
      newManagerId: newManagerId || undefined,
      directReportIds: impact.directReports.items.map((i) => i.id),
      newTeamLeadId: newTeamLeadId || undefined,
      teamIds: impact.teamsLed.items.map((i) => i.id),
      newDeptHeadId: newDeptHeadId || undefined,
      departmentIds: impact.departmentsHeaded.items.map((i) => i.id),
      projectPmReassignments: Object.entries(pmReassignments)
        .filter(([, newPm]) => !!newPm)
        .map(([projectId, newPmId]) => ({ projectId, newPmId })),
      taskReassignments: [],
      bulkTaskReassignTo: bulkTaskTo || undefined,
      leaveDisposition: leaveDisp,
      timeEntryDisposition: timeDisp,
    };
    executeOffboard({ employeeId: selectedId, payload }, {
      onSuccess: () => setStep(6),
    });
  };

  // ── Step 0: Select Employee ──────────────────────────────────────────────

  const renderStep0 = () => (
    <Stack spacing={3}>
      {/* Employee picker card */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700} mb={0.5}>
            Choose Employee to Offboard
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3} lineHeight={1.7}>
            Only active employees are shown. Click a card to select the employee you wish to offboard.
          </Typography>

          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, employee code or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          {loadingEmployees ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : filteredForSelect.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">No active employees found.</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredForSelect.map((emp) => {
                const isSelected = selectedId === emp.id;
                return (
                  <Grid item xs={12} sm={6} md={4} key={emp.id}>
                    <Paper
                      variant="outlined"
                      onClick={() => setSelectedId(emp.id)}
                      sx={{
                        p: 2.5,
                        cursor: 'pointer',
                        borderRadius: 2.5,
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        borderWidth: isSelected ? 2 : 1,
                        bgcolor: isSelected ? 'primary.50' : 'background.paper',
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                        position: 'relative',
                        height: '100%',
                      }}
                    >
                      {isSelected && (
                        <CheckCircleIcon
                          sx={{ position: 'absolute', top: 10, right: 10, color: 'primary.main', fontSize: 20 }}
                        />
                      )}
                      <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
                        <Avatar
                          sx={{
                            width: 46,
                            height: 46,
                            bgcolor: isSelected ? 'primary.main' : 'grey.200',
                            color: isSelected ? 'white' : 'grey.700',
                            fontWeight: 800,
                            fontSize: '1rem',
                            flexShrink: 0,
                          }}
                        >
                          {emp.firstName?.[0]}{emp.lastName?.[0]}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body1" fontWeight={700} noWrap>
                            {emp.firstName} {emp.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {emp.employeeCode || emp.id.slice(0, 8)}
                          </Typography>
                        </Box>
                      </Stack>

                      {emp.departmentName && (
                        <Typography variant="caption" color="text.disabled" display="block" mb={1} noWrap>
                          {emp.departmentName}
                        </Typography>
                      )}

                      <Chip
                        label={emp.status}
                        size="small"
                        sx={{
                          fontSize: '0.65rem',
                          height: 20,
                          bgcolor: `${STATUS_COLORS[emp.status] ?? '#94a3b8'}18`,
                          color: STATUS_COLORS[emp.status] ?? '#94a3b8',
                          fontWeight: 700,
                          letterSpacing: '0.03em',
                        }}
                      />
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Offboarding details panel — only shown once employee selected */}
      {selectedEmployee && (
        <Card variant="outlined" sx={{ borderColor: 'primary.main', borderRadius: 3, borderWidth: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontWeight: 800, fontSize: '1rem' }}>
                {selectedEmployee.firstName?.[0]}{selectedEmployee.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Offboarding Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedEmployee.firstName} {selectedEmployee.lastName} · {selectedEmployee.employeeCode}
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Working Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Final Status</InputLabel>
                  <Select
                    label="Final Status"
                    value={finalStatus}
                    onChange={(e) => setFinalStatus(e.target.value as any)}
                  >
                    <MenuItem value="RESIGNED">Resigned (voluntary)</MenuItem>
                    <MenuItem value="TERMINATED">Terminated (involuntary)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Reason / Notes (optional)"
                  size="small"
                  fullWidth
                  multiline
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Personal reasons, better opportunity, performance issue…"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  // ── Step 1: Impact Analysis ──────────────────────────────────────────────

  const renderStep1 = () => (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontWeight: 800, fontSize: '1rem' }}>
            {selectedEmployee?.firstName?.[0]}{selectedEmployee?.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Impact Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedEmployee?.firstName} {selectedEmployee?.lastName} · {selectedEmployee?.employeeCode}
            </Typography>
          </Box>
        </Stack>

        {loadingImpact && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
            <CircularProgress size={24} />
            <Typography color="text.secondary">Analysing dependencies…</Typography>
          </Box>
        )}

        {impact && (
          <>
            {/* Warnings */}
            {impact.warnings.length > 0 && (
              <Stack spacing={1.5} mb={4}>
                {impact.warnings.map((w, i) => (
                  <Alert
                    key={i}
                    severity={w.severity}
                    icon={
                      w.severity === 'warning' ? <WarningAmberIcon fontSize="small" /> :
                      w.severity === 'error' ? <ErrorOutlinedIcon fontSize="small" /> :
                      <InfoOutlinedIcon fontSize="small" />
                    }
                    sx={{ borderRadius: 2, '& .MuiAlert-message': { lineHeight: 1.6 } }}
                  >
                    {w.message}
                  </Alert>
                ))}
              </Stack>
            )}
            {impact.warnings.length === 0 && (
              <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
                No critical dependencies detected. This employee can be offboarded without blockers.
              </Alert>
            )}

            <Divider sx={{ mb: 3 }} />

            <Typography variant="overline" color="text.secondary" display="block" letterSpacing={1.2} mb={2}>
              Dependency Overview
            </Typography>

            <Grid container spacing={2}>
              {[
                { icon: <PeopleAltOutlinedIcon />, label: 'Direct Reports', count: impact.directReports.count, critical: true },
                { icon: <GroupsOutlinedIcon />, label: 'Teams Led', count: impact.teamsLed.count, critical: true },
                { icon: <ApartmentOutlinedIcon />, label: 'Departments Headed', count: impact.departmentsHeaded.count, critical: true },
                { icon: <AccountTreeOutlinedIcon />, label: 'Projects as PM', count: impact.projectsAsPm.count, critical: true },
                { icon: <AssignmentOutlinedIcon />, label: 'Active Tasks', count: impact.activeTasks.count, critical: false },
                { icon: <EventBusyOutlinedIcon />, label: 'Pending Leaves', count: impact.pendingLeaves.count, critical: false },
                { icon: <AccessTimeOutlinedIcon />, label: 'Pending Time Entries', count: impact.pendingTimeEntries.count, critical: false },
                { icon: <FolderSharedOutlinedIcon />, label: 'Project Memberships', count: impact.projectMemberships.count, critical: false },
              ].map((card) => (
                <Grid item xs={12} sm={6} md={3} key={card.label}>
                  <ImpactCard {...card} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );

  // ── Step 2: Transfer People ──────────────────────────────────────────────

  const renderStep2 = () => (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" fontWeight={700} mb={0.5}>Transfer People</Typography>
        <Typography variant="body2" color="text.secondary" mb={4} lineHeight={1.7}>
          Assign a replacement for each leadership role this employee currently holds.
          Fields marked * are mandatory.
        </Typography>

        <Stack spacing={4}>
          {(impact?.directReports.count ?? 0) > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <PeopleAltOutlinedIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Direct Reports ({impact!.directReports.count})
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2} lineHeight={1.6}>
                {impact!.directReports.items.map((i) => i.name).join(' · ')}
              </Typography>
              <EmployeeAutocomplete
                label="New Reporting Manager *"
                employees={allEmployees}
                value={newManagerId}
                onChange={setNewManagerId}
                excludeId={selectedId}
              />
            </Box>
          )}

          {(impact?.teamsLed.count ?? 0) > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <GroupsOutlinedIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Teams Led ({impact!.teamsLed.count})
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2} lineHeight={1.6}>
                {impact!.teamsLed.items.map((i) => i.name).join(' · ')}
              </Typography>
              <EmployeeAutocomplete
                label="New Team Lead *"
                employees={allEmployees}
                value={newTeamLeadId}
                onChange={setNewTeamLeadId}
                excludeId={selectedId}
              />
            </Box>
          )}

          {(impact?.departmentsHeaded.count ?? 0) > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <ApartmentOutlinedIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Departments Headed ({impact!.departmentsHeaded.count})
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2} lineHeight={1.6}>
                {impact!.departmentsHeaded.items.map((i) => i.name).join(' · ')}
              </Typography>
              <EmployeeAutocomplete
                label="New Department Head *"
                employees={allEmployees}
                value={newDeptHeadId}
                onChange={setNewDeptHeadId}
                excludeId={selectedId}
              />
            </Box>
          )}

          {(impact?.directReports.count ?? 0) === 0 &&
            (impact?.teamsLed.count ?? 0) === 0 &&
            (impact?.departmentsHeaded.count ?? 0) === 0 && (
              <Alert severity="success" sx={{ borderRadius: 2, py: 1.5 }}>
                No people transfers required — this employee has no direct reports, team leads or department head roles.
              </Alert>
            )}
        </Stack>
      </CardContent>
    </Card>
  );

  // ── Step 3: Projects & Tasks ─────────────────────────────────────────────

  const renderStep3 = () => (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" fontWeight={700} mb={0.5}>Projects & Tasks</Typography>
        <Typography variant="body2" color="text.secondary" mb={4} lineHeight={1.7}>
          Assign a new project manager for each project this employee owns, and optionally
          bulk-reassign their open tasks.
        </Typography>

        <Stack spacing={4}>
          {(impact?.projectsAsPm.count ?? 0) > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <AccountTreeOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Projects as PM ({impact!.projectsAsPm.count})
                </Typography>
              </Stack>
              <Stack spacing={2}>
                {impact!.projectsAsPm.items.map((proj) => (
                  <Paper key={proj.id} variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={700} mb={0.25}>{proj.name}</Typography>
                        {proj.detail && (
                          <Typography variant="caption" color="text.secondary">{proj.detail}</Typography>
                        )}
                      </Box>
                      <Box sx={{ minWidth: 280 }}>
                        <EmployeeAutocomplete
                          label="New PM"
                          employees={allEmployees}
                          value={pmReassignments[proj.id] ?? ''}
                          onChange={(id) => setPmReassignments((prev) => ({ ...prev, [proj.id]: id }))}
                          excludeId={selectedId}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {(impact?.activeTasks.count ?? 0) > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <AssignmentOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Active Tasks ({impact!.activeTasks.count})
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2} lineHeight={1.6}>
                Bulk-reassign all open tasks to a single person. Leave blank to keep tasks unassigned for manual review.
              </Typography>
              <EmployeeAutocomplete
                label="Reassign All Tasks To (optional)"
                employees={allEmployees}
                value={bulkTaskTo}
                onChange={setBulkTaskTo}
                excludeId={selectedId}
              />
            </Box>
          )}

          {(impact?.projectsAsPm.count ?? 0) === 0 && (impact?.activeTasks.count ?? 0) === 0 && (
            <Alert severity="success" sx={{ borderRadius: 2, py: 1.5 }}>
              No project or task transfers required.
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  // ── Step 4: Leaves & Timesheets ──────────────────────────────────────────

  const renderStep4 = () => (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" fontWeight={700} mb={0.5}>Leaves & Timesheets</Typography>
        <Typography variant="body2" color="text.secondary" mb={4} lineHeight={1.7}>
          Choose how to handle open leave requests and draft time entries before the account is closed.
        </Typography>

        <Stack spacing={3}>
          {/* Leaves */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
              <EventBusyOutlinedIcon sx={{ color: 'warning.main', fontSize: 22 }} />
              <Typography variant="subtitle2" fontWeight={700}>Pending Leave Requests</Typography>
              <Chip
                label={impact?.pendingLeaves.count ?? 0}
                size="small"
                color={impact?.pendingLeaves.count ? 'warning' : 'default'}
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
              />
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <FormControl>
              <RadioGroup value={leaveDisp} onChange={(e) => setLeaveDisp(e.target.value as any)}>
                <FormControlLabel
                  value="CANCEL_ALL"
                  control={<Radio size="small" />}
                  label={
                    <Box py={0.5}>
                      <Typography variant="body2" fontWeight={600}>Cancel all pending requests</Typography>
                      <Typography variant="caption" color="text.secondary">
                        All PENDING leave requests will be set to CANCELLED.
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1, alignItems: 'flex-start' }}
                />
                <FormControlLabel
                  value="KEEP"
                  control={<Radio size="small" />}
                  label={
                    <Box py={0.5}>
                      <Typography variant="body2" fontWeight={600}>Keep as-is</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Leave requests remain unchanged for manual review.
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start' }}
                />
              </RadioGroup>
            </FormControl>
          </Paper>

          {/* Timesheets */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
              <AccessTimeOutlinedIcon sx={{ color: 'info.main', fontSize: 22 }} />
              <Typography variant="subtitle2" fontWeight={700}>Pending Time Entries</Typography>
              <Chip
                label={impact?.pendingTimeEntries.count ?? 0}
                size="small"
                color={impact?.pendingTimeEntries.count ? 'info' : 'default'}
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
              />
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <FormControl>
              <RadioGroup value={timeDisp} onChange={(e) => setTimeDisp(e.target.value as any)}>
                <FormControlLabel
                  value="AUTO_APPROVE"
                  control={<Radio size="small" />}
                  label={
                    <Box py={0.5}>
                      <Typography variant="body2" fontWeight={600}>Auto-approve all</Typography>
                      <Typography variant="caption" color="text.secondary">
                        All DRAFT and SUBMITTED entries will be marked APPROVED.
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1, alignItems: 'flex-start' }}
                />
                <FormControlLabel
                  value="AUTO_REJECT"
                  control={<Radio size="small" />}
                  label={
                    <Box py={0.5}>
                      <Typography variant="body2" fontWeight={600}>Auto-reject all</Typography>
                      <Typography variant="caption" color="text.secondary">
                        All DRAFT and SUBMITTED entries will be marked REJECTED.
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1, alignItems: 'flex-start' }}
                />
                <FormControlLabel
                  value="KEEP"
                  control={<Radio size="small" />}
                  label={
                    <Box py={0.5}>
                      <Typography variant="body2" fontWeight={600}>Keep as-is</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Time entries remain unchanged for manual review.
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start' }}
                />
              </RadioGroup>
            </FormControl>
          </Paper>
        </Stack>
      </CardContent>
    </Card>
  );

  // ── Step 5: Review & Confirm ─────────────────────────────────────────────

  const renderStep5 = () => (
    <Stack spacing={3}>
      <Alert severity="error" sx={{ borderRadius: 2.5, '& .MuiAlert-message': { lineHeight: 1.7 } }}>
        <strong>This action is irreversible.</strong> The employee will be permanently marked as{' '}
        <strong>{finalStatus}</strong> and all transfers below will be executed as a single atomic transaction.
        If any step fails, the entire offboarding will be rolled back.
      </Alert>

      {/* Employee summary */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="overline" color="text.secondary" display="block" letterSpacing={1.2} mb={2}>
            Employee
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" mb={3}>
            <Avatar sx={{ bgcolor: 'error.main', width: 50, height: 50, fontWeight: 800, fontSize: '1.1rem' }}>
              {selectedEmployee?.firstName?.[0]}{selectedEmployee?.lastName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700} lineHeight={1.3}>
                {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedEmployee?.employeeCode}
                {selectedEmployee?.departmentName ? ` · ${selectedEmployee.departmentName}` : ''}
              </Typography>
            </Box>
            <Chip
              label={finalStatus}
              color={finalStatus === 'TERMINATED' ? 'error' : 'warning'}
              sx={{ fontWeight: 700, px: 1 }}
            />
          </Stack>
          <Divider sx={{ mb: 2.5 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Last Working Date</Typography>
              <Typography variant="body1" fontWeight={700}>{effectiveDate}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Final Status</Typography>
              <Typography variant="body1" fontWeight={700}>{finalStatus}</Typography>
            </Grid>
            {reason && (
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Reason</Typography>
                <Typography variant="body1" fontWeight={600}>{reason}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Transfer summary */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="overline" color="text.secondary" display="block" letterSpacing={1.2} mb={3}>
            What Will Be Transferred
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Direct Reports', count: impact?.directReports.count ?? 0 },
              { label: 'Teams', count: impact?.teamsLed.count ?? 0 },
              { label: 'Departments', count: impact?.departmentsHeaded.count ?? 0 },
              { label: 'Projects (new PM)', count: Object.values(pmReassignments).filter(Boolean).length },
              { label: 'Tasks (bulk)', count: bulkTaskTo ? (impact?.activeTasks.count ?? 0) : 0 },
              { label: 'Memberships closed', count: impact?.projectMemberships.count ?? 0 },
            ].map(({ label, count }) => (
              <Grid item xs={6} sm={4} key={label}>
                <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'action.hover', textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={800} lineHeight={1.1}>{count}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Box>
        <Button
          variant="contained"
          color="error"
          size="large"
          disabled={executing}
          onClick={handleConfirm}
          startIcon={executing ? <CircularProgress size={20} color="inherit" /> : undefined}
          sx={{ minWidth: 280, py: 1.8, fontWeight: 800, fontSize: '1rem', borderRadius: 2.5 }}
        >
          {executing ? 'Processing…' : `Confirm & Offboard as ${finalStatus}`}
        </Button>
      </Box>
    </Stack>
  );

  // ── Done ─────────────────────────────────────────────────────────────────

  const renderDone = () => (
    <Card variant="outlined" sx={{ textAlign: 'center', borderRadius: 3 }}>
      <CardContent sx={{ p: 8 }}>
        <CheckCircleIcon sx={{ fontSize: 88, color: 'success.main', mb: 3 }} />
        <Typography variant="h4" fontWeight={800} mb={1.5}>Offboarding Complete</Typography>
        <Typography color="text.secondary" mb={1} fontSize="1.05rem">
          <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong> has been successfully offboarded.
        </Typography>
        <Typography variant="body2" color="text.disabled" mb={5} lineHeight={1.7}>
          All ownership transfers were committed atomically. The offboarding event has been
          recorded in the audit trail with a full transfer summary.
        </Typography>
        <Button variant="contained" size="large" sx={{ px: 4, py: 1.5, fontWeight: 700 }} onClick={() => navigate('/hr/employees')}>
          Return to Employees
        </Button>
      </CardContent>
    </Card>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/hr/employees')}
          size="small"
          sx={{ mt: 0.5 }}
        >
          Back
        </Button>
        <Box>
          <Typography variant="h4" fontWeight={800} lineHeight={1.2}>
            Enterprise Offboarding Wizard
          </Typography>
          {selectedEmployee && step > 0 && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Processing offboarding for{' '}
              <strong>{selectedEmployee.firstName} {selectedEmployee.lastName}</strong>
              {selectedEmployee.employeeCode ? ` (${selectedEmployee.employeeCode})` : ''}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Stepper */}
      {step < 6 && (
        <Stepper activeStep={step} sx={{ mb: 5 }} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* Step content */}
      {step === 6 ? renderDone() : stepContent[step]?.()}

      {/* Navigation buttons */}
      {step < 6 && (
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={4}>
          {step > 0 && (
            <Button variant="outlined" size="large" onClick={() => setStep((s) => s - 1)} sx={{ px: 3 }}>
              Back
            </Button>
          )}
          {step < 5 && (
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              disabled={!canGoNext()}
              onClick={() => setStep((s) => s + 1)}
              sx={{ px: 4 }}
            >
              Next
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default OffboardingWizard;
