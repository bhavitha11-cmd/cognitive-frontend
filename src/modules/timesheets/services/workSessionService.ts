import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';

// ==========================================
// TYPES
// ==========================================

export interface WorkSession {
  id: string;
  employeeId: string;
  taskId: string;
  projectId: string;
  sessionType: 'REGULAR' | 'REWORK';
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'ABANDONED';
  pauseReason?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveSession {
  id: string;
  taskId: string;
  projectId: string;
  sessionType: 'REGULAR' | 'REWORK';
  startTime: string;
  elapsedMinutes: number;
  pauseReason?: string;
}

export interface DailySessionSummary {
  date: string;
  totalSessionMinutes: number;
  totalBreakMinutes: number;
  netWorkMinutes: number;
  sessionCount: number;
}

export interface EmployeeBreak {
  id: string;
  employeeId: string;
  date: string;
  breakStart: string;
  breakEnd?: string;
  durationMinutes?: number;
  remarks?: string;
}

export interface TaskRework {
  id: string;
  taskId: string;
  reworkNumber: number;
  openedBy: string;
  openedAt: string;
  closedBy?: string;
  closedAt?: string;
  reason?: string;
  hoursSpent: number;
}

// ==========================================
// MAPPERS
// ==========================================

const mapSession = (s: any): WorkSession => ({
  id: s.id,
  employeeId: s.employee_id,
  taskId: s.task_id,
  projectId: s.project_id,
  sessionType: s.session_type,
  startTime: s.start_time,
  endTime: s.end_time || undefined,
  durationMinutes: s.duration_minutes ?? 0,
  status: s.status,
  pauseReason: s.pause_reason || undefined,
  remarks: s.remarks || undefined,
  createdAt: s.created_at,
  updatedAt: s.updated_at,
});

const mapActiveSession = (s: any): ActiveSession => ({
  id: s.id,
  taskId: s.task_id,
  projectId: s.project_id,
  sessionType: s.session_type,
  startTime: s.start_time,
  elapsedMinutes: s.elapsed_minutes ?? 0,
  pauseReason: s.pause_reason || undefined,
});

const mapDailySummary = (s: any): DailySessionSummary => ({
  date: s.date,
  totalSessionMinutes: s.total_session_minutes ?? 0,
  totalBreakMinutes: s.total_break_minutes ?? 0,
  netWorkMinutes: s.net_work_minutes ?? 0,
  sessionCount: s.session_count ?? 0,
});

const mapBreak = (b: any): EmployeeBreak => ({
  id: b.id,
  employeeId: b.employee_id,
  date: b.date,
  breakStart: b.break_start,
  breakEnd: b.break_end || undefined,
  durationMinutes: b.duration_minutes || undefined,
  remarks: b.remarks || undefined,
});

const mapRework = (r: any): TaskRework => ({
  id: r.id,
  taskId: r.task_id,
  reworkNumber: r.rework_number,
  openedBy: r.opened_by,
  openedAt: r.opened_at,
  closedBy: r.closed_by || undefined,
  closedAt: r.closed_at || undefined,
  reason: r.reason || undefined,
  hoursSpent: r.hours_spent ?? 0,
});

// ==========================================
// WORK SESSIONS HOOKS
// ==========================================

export const useGetActiveSession = () => {
  return useQuery<ActiveSession | null>({
    queryKey: ['work-sessions', 'active'],
    queryFn: async () => {
      const response = await api.get('/work-sessions/active');
      const data = response.data?.data?.active_session || response.data?.active_session || null;
      return data ? mapActiveSession(data) : null;
    },
    refetchOnWindowFocus: true,
  });
};

export const useStartSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { taskId: string; projectId: string; sessionType?: 'REGULAR' | 'REWORK' }) => {
      const response = await api.post('/work-sessions', {
        task_id: data.taskId,
        project_id: data.projectId,
        session_type: data.sessionType || 'REGULAR',
      });
      return mapSession(response.data?.data?.work_session || response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const usePauseSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, reason }: { sessionId: string; reason?: string }) => {
      const response = await api.post(`/work-sessions/${sessionId}/pause`, { reason: reason || null });
      return mapSession(response.data?.data?.work_session || response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useResumeSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.post(`/work-sessions/${sessionId}/resume`);
      return mapSession(response.data?.data?.work_session || response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useCompleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, remarks, markTaskComplete }: { sessionId: string; remarks?: string; markTaskComplete?: boolean }) => {
      const response = await api.post(`/work-sessions/${sessionId}/complete`, {
        remarks: remarks || null,
        mark_task_complete: markTaskComplete ?? false,
      });
      return mapSession(response.data?.data?.work_session || response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};


export const useCancelSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.post(`/work-sessions/${sessionId}/cancel`);
      return mapSession(response.data?.data?.work_session || response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export interface MySessionsParams {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  skip?: number;
  limit?: number;
}

export const useGetMySessions = (params?: MySessionsParams) => {
  return useQuery<{ sessions: WorkSession[]; total: number }>({
    queryKey: ['work-sessions', 'my', params],
    queryFn: async () => {
      const response = await api.get('/work-sessions/my', {
        params: {
          date_from: params?.dateFrom,
          date_to: params?.dateTo,
          status: params?.status,
          skip: params?.skip ?? 0,
          limit: params?.limit ?? 50,
        },
      });
      const data = response.data?.data || {};
      const rawSessions = data.work_sessions || [];
      return {
        sessions: rawSessions.map(mapSession),
        total: data.total ?? rawSessions.length,
      };
    },
  });
};

export const useGetDailySummary = (employeeId?: string, summaryDate?: string) => {
  return useQuery<DailySessionSummary>({
    queryKey: ['work-sessions', 'daily-summary', employeeId, summaryDate],
    queryFn: async () => {
      const response = await api.get('/work-sessions/daily-summary', {
        params: {
          employee_id: employeeId || undefined,
          summary_date: summaryDate || undefined,
        },
      });
      const data = response.data?.data?.summary || response.data?.summary || {};
      return mapDailySummary(data);
    },
    enabled: !!summaryDate,
  });
};

// ==========================================
// BREAKS HOOKS
// ==========================================

export const useGetActiveBreak = (enabled = true) => {
  return useQuery<EmployeeBreak | null>({
    queryKey: ['breaks', 'active'],
    enabled,
    queryFn: async () => {
      const response = await api.get('/breaks/active');
      const data = response.data?.data?.active_break || response.data?.active_break || null;
      return data ? mapBreak(data) : null;
    },
  });
};

export const useStartBreak = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (remarks?: string) => {
      const response = await api.post('/breaks/start', { remarks: remarks || null });
      return mapBreak(response.data?.data?.break_record || response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breaks'] });
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-my'] });
    },
  });
};

export const useEndBreak = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (remarks?: string) => {
      const response = await api.post('/breaks/end', { remarks: remarks || null });
      return mapBreak(response.data?.data?.break_record || response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breaks'] });
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-my'] });
    },
  });
};

export interface MyBreaksParams {
  dateFrom?: string;
  dateTo?: string;
  skip?: number;
  limit?: number;
}

export const useGetMyBreaks = (params?: MyBreaksParams) => {
  return useQuery<{ breaks: EmployeeBreak[]; total: number }>({
    queryKey: ['breaks', 'my', params],
    queryFn: async () => {
      const response = await api.get('/breaks/my', {
        params: {
          date_from: params?.dateFrom,
          date_to: params?.dateTo,
          skip: params?.skip ?? 0,
          limit: params?.limit ?? 50,
        },
      });
      const data = response.data?.data || {};
      const rawBreaks = data.break_records || [];
      return {
        breaks: rawBreaks.map(mapBreak),
        total: data.total ?? rawBreaks.length,
      };
    },
  });
};

// ==========================================
// REWORK HOOKS
// ==========================================

export const useOpenRework = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { taskId: string; reason?: string }) => {
      const response = await api.post('/task-rework/open', {
        task_id: data.taskId,
        reason: data.reason || null,
      });
      return mapRework(response.data?.data?.rework || response.data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rework', 'task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useCloseRework = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { reworkId: string; taskId: string; hoursSpent: number }) => {
      const response = await api.post(`/task-rework/${data.reworkId}/close`, {
        hours_spent: data.hoursSpent,
      });
      return mapRework(response.data?.data?.rework || response.data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rework', 'task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useGetReworkHistory = (taskId: string) => {
  return useQuery<TaskRework[]>({
    queryKey: ['rework', 'task', taskId],
    queryFn: async () => {
      const response = await api.get(`/task-rework/by-task/${taskId}`);
      const rawHistory = response.data?.data?.rework_history || [];
      return rawHistory.map(mapRework);
    },
    enabled: !!taskId,
  });
};
