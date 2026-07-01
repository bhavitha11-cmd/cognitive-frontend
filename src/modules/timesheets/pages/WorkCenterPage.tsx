import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimerIcon from '@mui/icons-material/Timer';
import StarIcon from '@mui/icons-material/Star';
import WarningIcon from '@mui/icons-material/Warning';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import RefreshIcon from '@mui/icons-material/Refresh';

import { api, parseError } from '../../../utils/api';
import {
  useGetActiveSession,
  useStartSession,
  usePauseSession,
  useResumeSession,
  useCompleteSession,
  useCancelSession,
  useGetMySessions,
  useGetDailySummary,
  useGetActiveBreak,
} from '../services/workSessionService';
import { useGetLeaveRequests } from '../services/leaveService';
import { useGetHolidays } from '../../projects/services/projectService';
import { useGetTasks } from '../../tasks/services/taskService';
import { useAuthStore } from '../../../store/useAuthStore';
import { ConfirmationDialog } from '../../../components/ConfirmationDialog';
import {
  useGetTodayProductivity,
  useGetProductivityTimeline,
  useGetIdleReasons,
  useClassifyIdleSegment,
  type KPIDetail,
  type TimelineEvent,
} from '../services/productivityService';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TimelineIcon from '@mui/icons-material/Timeline';
import LabelIcon from '@mui/icons-material/Label';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

// ==========================================
// HELPERS
// ==========================================
const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dateStr = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dateStr}`;
};

const fmtDuration = (totalSeconds: number) => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const WorkCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  
  const todayStr = useMemo(() => toISODate(new Date()), []);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // States
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completingSessionId, setCompletingSessionId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [issuesFaced, setIssuesFaced] = useState('');
  const [markTaskComplete, setMarkTaskComplete] = useState(false);
  
  // Modals for UX validation rules
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [pendingSwitchTask, setPendingSwitchTask] = useState<{ taskId: string; projectId: string; sessionType?: 'REGULAR' | 'REWORK' } | null>(null);
  const [overtimeModalOpen, setOvertimeModalOpen] = useState(false);
  const [pendingOvertimeTask, setPendingOvertimeTask] = useState<{ taskId: string; projectId: string; sessionType?: 'REGULAR' | 'REWORK' } | null>(null);
  const [staleModalOpen, setStaleModalOpen] = useState(false);
  const [staleSession, setStaleSession] = useState<any>(null);

  // Group collapses
  const [priorityCollapses, setPriorityCollapses] = useState<Record<string, boolean>>({
    CRITICAL: true,
    HIGH: true,
    MEDIUM: true,
    LOW: false,
  });

  // Setup BroadcastChannel for Multi-tab synchronization
  useEffect(() => {
    const channel = new BroadcastChannel('cognitive-timesheets');
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data?.type === 'SESSION_SYNC') {
        queryClient.invalidateQueries({ queryKey: ['work-sessions', 'active'] });
        queryClient.invalidateQueries({ queryKey: ['work-sessions', 'my'] });
        queryClient.invalidateQueries({ queryKey: ['work-sessions', 'daily-summary'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    };

    return () => {
      channel.close();
    };
  }, [queryClient]);

  const broadcastChange = () => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'SESSION_SYNC' });
    }
  };

  // Queries
  const { data: activeSession, isLoading: activeLoading } = useGetActiveSession();
  const { data: activeBreak } = useGetActiveBreak();
  
  const { data: attendanceData } = useQuery<any>({
    queryKey: ['attendance-my', todayStr],
    queryFn: async () => {
      try {
        const res = await api.get('/attendance/me', { params: { date: todayStr } });
        return res.data?.data?.attendance || null;
      } catch {
        return null;
      }
    },
  });

  const { data: mySessionsData } = useGetMySessions({ dateFrom: todayStr, dateTo: todayStr, limit: 100 });
  const { data: _myBreaksData } = useQuery<{ breaks: any[] }>({
    queryKey: ['breaks', 'my', todayStr],
    queryFn: async () => {
      const res = await api.get('/breaks/my', { params: { date_from: todayStr, date_to: todayStr, limit: 100 } });
      return { breaks: res.data?.data?.break_records || [] };
    },
  });

  const { data: _dailySummary } = useGetDailySummary(authUser?.employeeId, todayStr);
  const { data: leaveRequests = [] } = useGetLeaveRequests({ status: 'APPROVED' });
  const { data: holidays = [] } = useGetHolidays();
  
  // Fetch tasks assigned to the employee
  const { data: tasksData, isLoading: tasksLoading } = useGetTasks({ limit: 300 });
  const assignedTasks = useMemo(() => {
    if (!tasksData?.tasks || !authUser?.employeeId) return [];
    return tasksData.tasks.filter((t) =>
      t.assignments?.some((a) => a.employeeId === authUser.employeeId)
    );
  }, [tasksData, authUser]);

  // Mutations
  const startSessionMutation = useStartSession();
  const pauseSessionMutation = usePauseSession();
  const resumeSessionMutation = useResumeSession();
  const completeSessionMutation = useCompleteSession();
  const cancelSessionMutation = useCancelSession();

  // Ticking Timer Effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (activeSession && activeSession.startTime) {
      const startMs = new Date(activeSession.startTime).getTime();
      const tick = () => {
        const diffSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        setSessionSeconds(diffSecs);
      };
      tick();
      timer = setInterval(tick, 1000);
    } else {
      setSessionSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeSession]);

  // Stale Session Recovery Validation
  useEffect(() => {
    if (activeSession && !activeLoading) {
      const startTime = new Date(activeSession.startTime);
      const isDifferentDay = startTime.getDate() !== new Date().getDate();
      const isOver12Hours = (Date.now() - startTime.getTime()) > 12 * 60 * 60 * 1000;
      
      if (isDifferentDay || isOver12Hours) {
        setStaleSession(activeSession);
        setStaleModalOpen(true);
      }
    }
  }, [activeSession, activeLoading]);

  // Attendance Statuses
  const isClockedIn = !!attendanceData?.clock_in || !!attendanceData?.clockIn;
  const isClockedOut = !!attendanceData?.clock_out || !!attendanceData?.clockOut;
  const isOnBreak = !!activeBreak;
  const attendanceStatus = useMemo(() => {
    if (isOnBreak) return 'ON_BREAK';
    if (isClockedIn && !isClockedOut) return 'CLOCKED_IN';
    if (isClockedOut) return 'CLOCKED_OUT';
    return 'NOT_CLOCKED_IN';
  }, [isClockedIn, isClockedOut, isOnBreak]);

  // Leaves & Holidays Validations
  const isOnLeaveToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return leaveRequests.some((lr) => {
      if (!lr.fromDate || !lr.toDate) return false;
      const from = new Date(lr.fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(lr.toDate);
      to.setHours(0, 0, 0, 0);
      return today >= from && today <= to;
    });
  }, [leaveRequests]);

  // Dynamic Check Working Day Query
  const { data: workingDayData } = useQuery<any>({
    queryKey: ['calendar-check-working-day', todayStr],
    queryFn: async () => {
      try {
        const res = await api.get('/calendar/check-working-day', { params: { date: todayStr } });
        return res.data?.data || null;
      } catch {
        return null;
      }
    },
  });

  const isHolidayToday = useMemo(() => {
    if (workingDayData && workingDayData.is_working_day !== undefined) {
      return !workingDayData.is_working_day;
    }
    const today = new Date();
    const day = today.getDay();
    const isSunday = day === 0;
    const inHolidaysList = holidays.some((h) => h === todayStr);
    return isSunday || inHolidaysList;
  }, [workingDayData, holidays, todayStr]);

  // ── Productivity Engine API ────────────────────────────────────────────────
  const { data: productivityData, isLoading: productivityLoading } = useGetTodayProductivity();
  const { data: timelineEvents = [], isLoading: timelineLoading } = useGetProductivityTimeline(
    authUser?.employeeId,
    todayStr
  );
  const { data: idleReasons = [] } = useGetIdleReasons();
  const classifyMutation = useClassifyIdleSegment();

  // Active timer for the cockpit display (live elapsed time)
  const activeTime = activeSession ? fmtDuration(sessionSeconds) : '00:00:00';


  // ── Idle Classification State ──────────────────────────────────────────────
  const [classifyingSegmentId, setClassifyingSegmentId] = useState<string | null>(null);
  const [classifyReasonId, setClassifyReasonId] = useState('');
  const [classifyRemarks, setClassifyRemarks] = useState('');

  const handleClassifyIdle = (segmentIdentifier: string) => {
    setClassifyingSegmentId(segmentIdentifier);
    setClassifyReasonId('');
    setClassifyRemarks('');
  };

  const handleSubmitClassification = () => {
    if (!classifyingSegmentId || !classifyReasonId) return;
    classifyMutation.mutate(
      {
        date: todayStr,
        idle_segment_identifier: classifyingSegmentId,
        reason_id: classifyReasonId,
        remarks: classifyRemarks || undefined,
      },
      {
        onSuccess: () => {
          setClassifyingSegmentId(null);
          setClassifyReasonId('');
          setClassifyRemarks('');
          queryClient.invalidateQueries({ queryKey: ['productivity'] });
        },
        onError: (err) => {
          alert('Failed to classify: ' + parseError(err));
        },
      }
    );
  };

  // Group Assigned Tasks by Priority
  const groupedTasks = useMemo(() => {
    const groups: Record<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', typeof assignedTasks> = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    };
    assignedTasks.forEach((task) => {
      const prio = (task.priority || 'MEDIUM').toUpperCase() as keyof typeof groups;
      if (groups[prio]) {
        groups[prio].push(task);
      } else {
        groups.MEDIUM.push(task);
      }
    });
    return groups;
  }, [assignedTasks]);

  // Current Running Task Object Lookup
  const runningTask = useMemo(() => {
    if (!activeSession) return null;
    return assignedTasks.find((t) => t.id === activeSession.taskId) || null;
  }, [activeSession, assignedTasks]);

  // Actions Trigger Handlers
  const handleStartTask = (taskId: string, projectId: string, sessionType: 'REGULAR' | 'REWORK' = 'REGULAR') => {
    // 1. Leave validation
    if (isOnLeaveToday) {
      alert("Validation Error: Cannot start task. You have an approved leave today.");
      return;
    }

    // 2. Attendance Validation (Must be clocked in)
    if (!isClockedIn || isClockedOut) {
      alert("Validation Error: You must clock in before starting a task.");
      return;
    }

    // 3. Break Validation
    if (isOnBreak) {
      alert("Validation Error: You are currently on break. Please end your break before starting a task.");
      return;
    }

    // 4. Task switching validation
    if (activeSession && activeSession.taskId !== taskId) {
      setPendingSwitchTask({ taskId, projectId, sessionType });
      setSwitchModalOpen(true);
      return;
    }

    // 5. Holiday Validation
    if (isHolidayToday && !pendingOvertimeTask) {
      setPendingOvertimeTask({ taskId, projectId, sessionType });
      setOvertimeModalOpen(true);
      return;
    }

    // Execute Start Session
    startSessionMutation.mutate(
      { taskId, projectId, sessionType },
      {
        onSuccess: () => {
          setSwitchModalOpen(false);
          setOvertimeModalOpen(false);
          setPendingSwitchTask(null);
          setPendingOvertimeTask(null);
          broadcastChange();
          queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
        },
        onError: (err) => {
          alert("Failed to start session: " + parseError(err));
        },
      }
    );
  };

  const handlePauseSession = (sessionId: string) => {
    pauseSessionMutation.mutate(
      { sessionId },
      {
        onSuccess: () => {
          broadcastChange();
          queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
        },
        onError: (err) => {
          alert("Failed to pause: " + parseError(err));
        },
      }
    );
  };

  const handleResumeSession = (sessionId: string) => {
    if (!isClockedIn || isClockedOut) {
      alert("Validation Error: You must clock in before starting/resuming a task.");
      return;
    }
    if (isOnBreak) {
      alert("Validation Error: You are on break. End break before resuming.");
      return;
    }
    
    // Check if another task is running
    if (activeSession && activeSession.id !== sessionId) {
      // Find the project ID and task ID for this session
      const targetSvc = mySessionsData?.sessions?.find((s) => s.id === sessionId);
      if (targetSvc) {
        setPendingSwitchTask({ taskId: targetSvc.taskId, projectId: targetSvc.projectId, sessionType: targetSvc.sessionType });
        setSwitchModalOpen(true);
        return;
      }
    }

    resumeSessionMutation.mutate(sessionId, {
      onSuccess: () => {
        broadcastChange();
        queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      },
      onError: (err) => {
        alert("Failed to resume: " + parseError(err));
      },
    });
  };

  const handleCompleteSessionTrigger = (sessionId: string) => {
    setCompletingSessionId(sessionId);
    setRemarks('');
    setIssuesFaced('');
    setMarkTaskComplete(false);
    setCompleteDialogOpen(true);
  };

  const handleCompleteSessionSubmit = () => {
    if (!completingSessionId) return;
    if (!remarks.trim()) {
      alert("Remarks / Work Summary is required for task completion.");
      return;
    }

    const mergedRemarks = `Work Summary: ${remarks.trim()}${issuesFaced.trim() ? ` | Issues Faced: ${issuesFaced.trim()}` : ''}`;

    completeSessionMutation.mutate(
      { sessionId: completingSessionId, remarks: mergedRemarks, markTaskComplete },
      {
        onSuccess: () => {
          setCompleteDialogOpen(false);
          setCompletingSessionId(null);
          setRemarks('');
          setIssuesFaced('');
          setMarkTaskComplete(false);
          broadcastChange();
          queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
        onError: (err) => {
          alert("Failed to complete task session: " + parseError(err));
        },
      }
    );
  };

  const handleCancelStaleSession = () => {
    if (!staleSession) return;
    cancelSessionMutation.mutate(staleSession.id, {
      onSuccess: () => {
        setStaleModalOpen(false);
        setStaleSession(null);
        broadcastChange();
        queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      },
    });
  };

  const handleConfirmSwitch = () => {
    if (pendingSwitchTask) {
      const task = pendingSwitchTask;
      setPendingSwitchTask(null); // Clear BEFORE starting to prevent re-trigger
      handleStartTask(task.taskId, task.projectId, task.sessionType);
    }
  };

  const handleConfirmOvertime = () => {
    if (pendingOvertimeTask) {
      // Bypass holiday validation
      startSessionMutation.mutate(
        { taskId: pendingOvertimeTask.taskId, projectId: pendingOvertimeTask.projectId, sessionType: pendingOvertimeTask.sessionType },
        {
          onSuccess: () => {
            setOvertimeModalOpen(false);
            setPendingOvertimeTask(null);
            broadcastChange();
            queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
          },
          onError: (err) => {
            alert("Failed to start session: " + parseError(err));
          },
        }
      );
    }
  };

  const togglePriorityCollapse = (prio: string) => {
    setPriorityCollapses((prev) => ({ ...prev, [prio]: !prev[prio] }));
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Work Center
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Your real-time engineering cockpit for tasks, sessions, and daily capacity.
          </Typography>
        </Box>
        <IconButton size="small" onClick={() => queryClient.invalidateQueries({ queryKey: ['work-sessions'] })}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* ── Enterprise KPI Dashboard (Section 0) ── */}
      {productivityLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, mb: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : productivityData ? (
        <Box sx={{ mb: 4 }}>
          {/* Primary KPI Row */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {([
              { key: 'presence_time', label: 'Presence Time' },
              { key: 'organization_time', label: 'Org Time' },
              { key: 'productive_time', label: 'Productive Time' },
              { key: 'break_time', label: 'Break Time' },
              { key: 'idle_time', label: 'Idle Time' },
              { key: 'remaining_productive_time', label: 'Remaining' },
            ] as { key: keyof typeof productivityData.kpis; label: string }[]).map(({ key, label }) => {
              const kpi: KPIDetail = productivityData.kpis[key];
              return (
                <Grid size={{ xs: 6, sm: 4, md: 2 }} key={key}>
                  <Tooltip title={kpi.tooltip} arrow>
                    <Card
                      sx={{
                        border: '1.5px solid',
                        borderColor: kpi.color,
                        borderRadius: 2,
                        cursor: 'default',
                        transition: 'box-shadow 0.2s',
                        '&:hover': { boxShadow: 4 },
                      }}
                    >
                      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}
                        >
                          {label}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 800, color: kpi.color, mt: 0.25, fontFamily: 'monospace', fontSize: '1.05rem' }}
                        >
                          {kpi.formatted}
                        </Typography>
                        {kpi.trend && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                            {kpi.trend.direction === 'up' ? (
                              <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} />
                            ) : kpi.trend.direction === 'down' ? (
                              <TrendingDownIcon sx={{ fontSize: 14, color: 'error.main' }} />
                            ) : (
                              <TrendingFlatIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                            )}
                            <Typography variant="caption" sx={{ color: kpi.trend.direction === 'up' ? 'success.main' : kpi.trend.direction === 'down' ? 'error.main' : 'text.disabled', fontWeight: 600 }}>
                              {kpi.trend.change_percentage}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>

          {/* Ratio KPI Row */}
          <Grid container spacing={2}>
            {([
              { key: 'productivity_percentage', label: 'Productivity %' },
              { key: 'organization_utilization', label: 'Org Utilization %' },
              { key: 'attendance_utilization', label: 'Attendance Util %' },
              { key: 'break_percentage', label: 'Break %' },
              { key: 'idle_percentage', label: 'Idle %' },
            ] as { key: keyof typeof productivityData.kpis; label: string }[]).map(({ key, label }) => {
              const kpi: KPIDetail = productivityData.kpis[key];
              return (
                <Grid size={{ xs: 6, sm: 4, md: 'auto' }} sx={{ flexGrow: 1 }} key={key}>
                  <Tooltip title={kpi.tooltip} arrow>
                    <Card
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        cursor: 'default',
                        '&:hover': { boxShadow: 2 },
                      }}
                    >
                      <CardContent sx={{ py: 1.25, px: 2, '&:last-child': { pb: 1.25 } }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          {label}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: kpi.color }}>
                          {kpi.formatted}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ) : null}

      {/* Main Grid: Section 1 & Section 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Section 1: Current Working Status */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Working Status cockpit
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    Clock In Status
                  </Typography>
                  {isClockedIn ? (
                    <Chip label="Clocked In" color="success" size="small" sx={{ fontWeight: 600 }} />
                  ) : (
                    <Chip label="Not Clocked In" color="error" size="small" sx={{ fontWeight: 600 }} />
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    Attendance Status
                  </Typography>
                  {attendanceStatus === 'ON_BREAK' && (
                    <Chip label="On Break" color="warning" size="small" sx={{ fontWeight: 600 }} />
                  )}
                  {attendanceStatus === 'CLOCKED_IN' && (
                    <Chip label="✓ Clocked In" color="success" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                  )}
                  {attendanceStatus === 'CLOCKED_OUT' && (
                    <Chip label="Clocked Out" color="default" size="small" sx={{ fontWeight: 600 }} />
                  )}
                  {attendanceStatus === 'NOT_CLOCKED_IN' && (
                    <Chip label="✗ Not Clocked In" color="error" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    Current Running Task
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {runningTask ? `${runningTask.taskCode} - ${runningTask.title}` : 'None'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    Elapsed Session Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: activeSession ? 'success.main' : 'text.secondary' }}>
                    {activeTime}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    Session Start Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {activeSession ? new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </Typography>
                </Box>
              </Stack>

              {!isClockedIn && (
                <Alert severity="error" sx={{ mt: 3, fontWeight: 500 }}>
                  Please clock in before starting a task. Use the <Link to="/timesheets/attendance" style={{ fontWeight: 700, textDecoration: 'underline', color: 'inherit' }}>Attendance Page</Link>.
                </Alert>
              )}

              {isOnBreak && (
                <Alert severity="warning" sx={{ mt: 3, fontWeight: 500 }}>
                  You are currently on break. Your session has been paused automatically.
                </Alert>
              )}

              {isOnLeaveToday && (
                <Alert severity="error" sx={{ mt: 3, fontWeight: 500 }}>
                  Blocked: You are registered as on leave today.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Section 2: Running Task Card */}
        <Grid size={{ xs: 12, md: 7 }}>
          {activeSession && runningTask ? (
            <Card sx={{ height: '100%', borderLeft: '5px solid', borderColor: activeSession.sessionType === 'REWORK' ? 'warning.main' : 'success.main' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {runningTask.taskCode}
                      </Typography>
                      {activeSession.sessionType === 'REWORK' && (
                        <Chip label="Rework Session" color="warning" size="small" sx={{ fontWeight: 600, height: 20 }} />
                      )}
                    </Stack>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {runningTask.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Project: {runningTask.projectName || '—'}
                    </Typography>
                  </Box>
                  <Chip
                    label={runningTask.priority}
                    color={
                      runningTask.priority === 'CRITICAL' ? 'error' :
                      runningTask.priority === 'HIGH' ? 'warning' :
                      runningTask.priority === 'MEDIUM' ? 'primary' : 'default'
                    }
                    size="small"
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      Planned Hours
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {runningTask.estimatedHours} hrs
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      Consumed Hours
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {runningTask.actualHours} hrs
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      Remaining
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: (runningTask.estimatedHours - runningTask.actualHours) < 0 ? 'error.main' : 'text.primary' }}>
                      {(runningTask.estimatedHours - runningTask.actualHours).toFixed(1)} hrs
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 3 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                    Active Timer
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'success.main' }}>
                    {activeTime}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<PauseIcon />}
                    onClick={() => handlePauseSession(activeSession.id)}
                    fullWidth
                  >
                    Pause Task
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleCompleteSessionTrigger(activeSession.id)}
                    fullWidth
                  >
                    Complete Task
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
              <Box>
                <TimerIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1.5 }} />
                <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>
                  No Active Task Session
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 300, mt: 0.5 }}>
                  Select a task from your list below and click "Start Task" to begin tracking your work in real-time.
                </Typography>
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* ── Section 3: Visual Activity Timeline ── */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <TimelineIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Activity Timeline
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
            — Dynamic daily workday reconstruction. Click 'Tag' on any idle gap to classify it.
          </Typography>
        </Box>

        {timelineLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : timelineEvents.length === 0 ? (
          <Alert severity="info" sx={{ mb: 0 }}>No timeline data yet. Clock in to start your workday.</Alert>
        ) : (
          <Card sx={{ overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
              {timelineEvents.map((event: TimelineEvent, idx: number) => {
                const isIdle = event.event_type === 'IDLE';
                const isClassified = isIdle && event.metadata?.is_classified;
                const segId = event.metadata?.idle_segment_identifier;
                const isTagging = classifyingSegmentId === segId;

                return (
                  <Box
                    key={`${event.time}-${idx}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      px: 3,
                      py: 1.25,
                      borderBottom: idx < timelineEvents.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      bgcolor: isIdle
                        ? isClassified
                          ? 'action.hover'
                          : 'warning.light'
                        : 'background.paper',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    {/* Time column */}
                    <Box sx={{ minWidth: 72, flexShrink: 0 }}>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 600 }}>
                        {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>

                    {/* Dot indicator */}
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        mt: 0.6,
                        mr: 2,
                        flexShrink: 0,
                        bgcolor: isIdle
                          ? event.metadata?.reason_color || '#F59E0B'
                          : event.event_type === 'CLOCK_IN' || event.event_type === 'CLOCK_OUT'
                          ? '#3B82F6'
                          : event.event_type.startsWith('BREAK')
                          ? '#F59E0B'
                          : '#10B981',
                      }}
                    />

                    {/* Event info */}
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {event.title}
                        </Typography>
                        {isIdle && (
                          <Chip
                            label={isClassified ? event.metadata.reason_name : 'Unclassified'}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: event.metadata?.reason_color || '#9CA3AF',
                              color: '#fff',
                            }}
                          />
                        )}
                        {isIdle && event.metadata?.duration_minutes > 0 && (
                          <Typography variant="caption" color="textSecondary">
                            ({event.metadata.duration_minutes} min)
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {event.description}
                      </Typography>

                      {/* Idle classification form */}
                      {isIdle && isTagging && (
                        <Box
                          sx={{
                            mt: 1.5,
                            p: 2,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'primary.main',
                            borderRadius: 1,
                          }}
                        >
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                              <InputLabel>Reason</InputLabel>
                              <Select
                                value={classifyReasonId}
                                label="Reason"
                                onChange={(e) => setClassifyReasonId(e.target.value)}
                              >
                                {idleReasons.map((r) => (
                                  <MenuItem key={r.id} value={r.id}>
                                    {r.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <TextField
                              size="small"
                              label="Remarks (optional)"
                              value={classifyRemarks}
                              onChange={(e) => setClassifyRemarks(e.target.value)}
                              sx={{ minWidth: 200 }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              disabled={!classifyReasonId || classifyMutation.isPending}
                              onClick={handleSubmitClassification}
                            >
                              {classifyMutation.isPending ? 'Saving…' : 'Save'}
                            </Button>
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => setClassifyingSegmentId(null)}
                            >
                              Cancel
                            </Button>
                          </Stack>
                        </Box>
                      )}
                    </Box>

                    {/* Tag action */}
                    {isIdle && !isTagging && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<LabelIcon />}
                        onClick={() => handleClassifyIdle(segId)}
                        sx={{ ml: 2, flexShrink: 0, height: 28, fontSize: '0.7rem' }}
                      >
                        Tag
                      </Button>
                    )}
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Section 4: Assigned Tasks */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        My Assigned Tasks
      </Typography>

      {tasksLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : assignedTasks.length === 0 ? (
        <Alert severity="info">No tasks are currently assigned to you.</Alert>
      ) : (
        <Stack spacing={2.5}>
          {Object.entries(groupedTasks).map(([priority, list]) => {
            if (list.length === 0) return null;
            const isOpen = priorityCollapses[priority];
            return (
              <Box key={priority} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                {/* Group Header */}
                <Box
                  onClick={() => togglePriorityCollapse(priority)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 3,
                    py: 1.5,
                    bgcolor:
                      priority === 'CRITICAL' ? 'error.light' :
                      priority === 'HIGH' ? 'warning.light' :
                      priority === 'MEDIUM' ? 'info.light' : 'background.paper',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <StarIcon
                      sx={{
                        color:
                          priority === 'CRITICAL' ? 'error.main' :
                          priority === 'HIGH' ? 'warning.main' :
                          priority === 'MEDIUM' ? 'primary.main' : 'text.secondary',
                      }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {priority} PRIORITIES ({list.length})
                    </Typography>
                  </Stack>
                  {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </Box>

                {/* Group Tasks List */}
                <Collapse in={isOpen}>
                  <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Grid container spacing={2}>
                      {list.map((task) => {
                        const isTaskActive = activeSession && activeSession.taskId === task.id;
                        const isPaused = mySessionsData?.sessions?.find(
                          (s) => s.taskId === task.id && s.status === 'PAUSED'
                        );

                        return (
                          <Grid size={{ xs: 12, sm: 6 }} key={task.id}>
                            <Card sx={{ border: isTaskActive ? '2px solid' : '1px solid', borderColor: isTaskActive ? 'success.main' : 'divider' }}>
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                    {task.taskCode}
                                  </Typography>
                                  <Stack direction="row" spacing={0.5}>
                                    {task.status === 'REOPENED' && (
                                      <Chip label="Rework Available" color="warning" size="small" sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700 }} />
                                    )}
                                    <Chip label={task.status} color={task.status === 'COMPLETED' ? 'success' : 'default'} size="small" sx={{ height: 18, fontSize: '0.625rem' }} />
                                  </Stack>
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}>
                                  {task.title}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
                                  Project: {task.projectName || '—'}
                                </Typography>

                                <Grid container spacing={1} sx={{ mb: 2, borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
                                  <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                      Planned End Date
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {task.plannedEndDate ? new Date(task.plannedEndDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                    </Typography>
                                  </Grid>
                                  <Grid size={{ xs: 3 }}>
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                      Est Hrs
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {task.estimatedHours}h
                                    </Typography>
                                  </Grid>
                                  <Grid size={{ xs: 3 }}>
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                      Spent
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {task.actualHours}h
                                    </Typography>
                                  </Grid>
                                </Grid>

                                {task.status === 'REOPENED' && (
                                  <Box sx={{ mb: 2, bgcolor: 'warning.light', p: 1, borderRadius: 0.5, border: '1px solid', borderColor: 'warning.main' }}>
                                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                                      Rework Tracker
                                    </Typography>
                                    <Grid container spacing={1}>
                                      <Grid size={{ xs: 4 }}>
                                        <Typography variant="caption" color="textSecondary">Original: {task.originalEstimatedHours ?? task.estimatedHours}h</Typography>
                                      </Grid>
                                      <Grid size={{ xs: 4 }}>
                                        <Typography variant="caption" color="textSecondary">Rework: {task.totalReworkHours ?? 0}h</Typography>
                                      </Grid>
                                      <Grid size={{ xs: 4 }}>
                                        <Typography variant="caption" color="textSecondary">Total: {task.actualHours}h</Typography>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                )}

                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                  {isTaskActive ? (
                                    <Button
                                      variant="contained"
                                      color="warning"
                                      size="small"
                                      startIcon={<PauseIcon />}
                                      onClick={() => handlePauseSession(activeSession.id)}
                                      disabled={!isClockedIn || isClockedOut || isOnBreak}
                                    >
                                      Pause
                                    </Button>
                                  ) : isPaused ? (
                                    <Button
                                      variant="contained"
                                      color="primary"
                                      size="small"
                                      startIcon={<PlayArrowIcon />}
                                      onClick={() => handleResumeSession(isPaused.id)}
                                      disabled={!isClockedIn || isClockedOut || isOnBreak}
                                    >
                                      Resume
                                    </Button>
                                  ) : task.status === 'REOPENED' ? (
                                    <Button
                                      variant="contained"
                                      color="warning"
                                      size="small"
                                      startIcon={<PlayArrowIcon />}
                                      onClick={() => handleStartTask(task.id, task.projectId, 'REWORK')}
                                      disabled={!isClockedIn || isClockedOut || isOnBreak}
                                    >
                                      Start Rework
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      color="primary"
                                      size="small"
                                      startIcon={<PlayArrowIcon />}
                                      onClick={() => handleStartTask(task.id, task.projectId, 'REGULAR')}
                                      disabled={task.status === 'COMPLETED' || !isClockedIn || isClockedOut || isOnBreak}
                                    >
                                      Start Task
                                    </Button>
                                  )}
                                  <Button
                                    variant="text"
                                    color="secondary"
                                    size="small"
                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                  >
                                    Details
                                  </Button>
                                </Stack>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Stack>
      )}

      {/* MODAL 1: Task Switching Confirmation */}
      <ConfirmationDialog
        open={switchModalOpen}
        title="Active Task Session Running"
        description={`You currently have an active task session running. Would you like to pause it and start the new task session?`}
        confirmText="Pause & Start"
        cancelText="Cancel"
        onConfirm={handleConfirmSwitch}
        onClose={() => {
          setSwitchModalOpen(false);
          setPendingSwitchTask(null);
        }}
      />

      {/* MODAL 2: Overtime Permission confirmation */}
      <ConfirmationDialog
        open={overtimeModalOpen}
        title="Holiday / Weekend Work Detected"
        description="Today is a registered company holiday or weekend. Do you have overtime permission to start work today?"
        confirmText="Yes, I have permission"
        cancelText="Cancel"
        onConfirm={handleConfirmOvertime}
        onClose={() => {
          setOvertimeModalOpen(false);
          setPendingOvertimeTask(null);
        }}
        severity="warning"
      />

      {/* MODAL 3: Stale Session Recovery handler */}
      <Dialog open={staleModalOpen} disableRestoreFocus maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" /> Stale Session Recovery
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            We detected that your active task session started on{' '}
            <strong>
              {staleSession ? new Date(staleSession.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
            </strong>{' '}
            at{' '}
            <strong>
              {staleSession ? new Date(staleSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </strong>{' '}
            was left running.
          </DialogContentText>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            To keep your timesheet clean, please choose to close it with remarks or cancel/discard it.
          </Typography>
          <TextField
            autoFocus
            label="Work Summary / Remarks (required to close)"
            multiline
            rows={3}
            fullWidth
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={handleCancelStaleSession}
            color="error"
            variant="outlined"
            disabled={cancelSessionMutation.isPending}
          >
            Discard Session
          </Button>
          <Button
            onClick={() => {
              if (!remarks.trim()) {
                alert('Remarks are required to save session.');
                return;
              }
              handleCompleteSessionTrigger(staleSession.id);
              setStaleModalOpen(false);
            }}
            color="success"
            variant="contained"
            disabled={!remarks.trim()}
          >
            Complete Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 4: Task Completion Details Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Task Completion Summary</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please write a summary of your work and note any difficulties you encountered.
          </DialogContentText>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Work Summary / Remarks"
              placeholder="Describe what was accomplished..."
              required
              multiline
              rows={4}
              fullWidth
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              error={!remarks.trim()}
              helperText={!remarks.trim() ? 'Work summary is required.' : ''}
            />
            <TextField
              label="Issues Faced (Optional)"
              placeholder="Describe any blockers or issues faced..."
              multiline
              rows={2}
              fullWidth
              value={issuesFaced}
              onChange={(e) => setIssuesFaced(e.target.value)}
            />
            <Box
              sx={{
                border: '1.5px solid',
                borderColor: markTaskComplete ? 'success.main' : 'divider',
                borderRadius: 2,
                px: 2,
                py: 1.5,
                bgcolor: markTaskComplete ? 'success.light' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={markTaskComplete}
                    onChange={(e) => setMarkTaskComplete(e.target.checked)}
                    color="success"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Mark this task as Completed
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Tick this if you are fully done with the task. The task status will move to ✅ Completed.
                      Leave unchecked if you plan to log more sessions later.
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCompleteDialogOpen(false)} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleCompleteSessionSubmit}
            color="success"
            variant="contained"
            disabled={!remarks.trim() || completeSessionMutation.isPending}
          >
            {completeSessionMutation.isPending ? 'Completing...' : 'Complete Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkCenterPage;
