import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';

// ==========================================
// TYPES – mirrors backend Pydantic schemas
// ==========================================

export interface KPITrend {
  current_value: number;
  previous_value: number;
  change_percentage: string; // e.g. "+12.5%"
  direction: 'up' | 'down' | 'flat';
}

export interface KPIDetail {
  raw_seconds: number;
  hours: number;
  minutes: number;
  formatted: string; // "HH:MM:SS" or "xx.x%"
  percentage: number;
  status: 'success' | 'warning' | 'danger' | 'info' | 'default';
  color: string; // hex color
  tooltip: string;
  formula: string;
  trend: KPITrend | null;
}

export interface ProductivityKPIs {
  presence_time: KPIDetail;
  break_time: KPIDetail;
  organization_time: KPIDetail;
  productive_time: KPIDetail;
  idle_time: KPIDetail;
  remaining_productive_time: KPIDetail;
  productivity_percentage: KPIDetail;
  organization_utilization: KPIDetail;
  attendance_utilization: KPIDetail;
  break_percentage: KPIDetail;
  idle_percentage: KPIDetail;
}

export interface TodayProductivityResponse {
  employee_id: string;
  date: string;
  kpis: ProductivityKPIs;
}

export interface TimelineEvent {
  time: string; // ISO datetime
  event_type:
    | 'CLOCK_IN'
    | 'CLOCK_OUT'
    | 'BREAK_START'
    | 'BREAK_END'
    | 'TASK_START'
    | 'TASK_END'
    | 'IDLE';
  title: string;
  description: string;
  metadata: Record<string, any>;
}

export interface IdleReason {
  id: string;
  code: string;
  name: string;
  description?: string;
  display_order: number;
  color?: string;
  department_id?: string;
  is_active: boolean;
}

export interface IdleClassification {
  id: string;
  employee_id: string;
  date: string;
  idle_segment_identifier: string;
  reason_id: string;
  remarks?: string;
}

export interface DailySummaryItem {
  date: string;
  kpis: ProductivityKPIs;
}

export interface RangeProductivityData {
  employee_id: string;
  start_date: string;
  end_date: string;
  period_kpis: ProductivityKPIs;
  days: DailySummaryItem[];
}

// ==========================================
// QUERY KEYS
// ==========================================

export const productivityKeys = {
  today: (employeeId?: string) => ['productivity', 'today', employeeId] as const,
  timeline: (employeeId?: string, date?: string) => ['productivity', 'timeline', employeeId, date] as const,
  reasons: (departmentId?: string) => ['productivity', 'reasons', departmentId] as const,
  range: (employeeId: string, startDate: string, endDate: string) =>
    ['productivity', 'range', employeeId, startDate, endDate] as const,
};

// ==========================================
// HOOKS
// ==========================================

/** Fetch today's KPIs for the currently logged-in employee. */
export function useGetTodayProductivity() {
  return useQuery<TodayProductivityResponse>({
    queryKey: productivityKeys.today(),
    queryFn: async () => {
      const res = await api.get('/analytics/productivity/today');
      return res.data.data as TodayProductivityResponse;
    },
    refetchInterval: 60_000, // Auto-refresh every 60 seconds
    staleTime: 30_000,
  });
}

/** Fetch activity timeline for a given employee and date. */
export function useGetProductivityTimeline(employeeId?: string, date?: string) {
  return useQuery<TimelineEvent[]>({
    queryKey: productivityKeys.timeline(employeeId, date),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (employeeId) params.employee_id = employeeId;
      if (date) params.query_date = date;
      const res = await api.get('/analytics/productivity/timeline', { params });
      return (res.data.data?.timeline ?? []) as TimelineEvent[];
    },
    enabled: true,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/** Fetch active idle reasons (optionally filtered by department). */
export function useGetIdleReasons(departmentId?: string) {
  return useQuery<IdleReason[]>({
    queryKey: productivityKeys.reasons(departmentId),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (departmentId) params.department_id = departmentId;
      const res = await api.get('/analytics/productivity/reasons', { params });
      return (res.data.data?.reasons ?? []) as IdleReason[];
    },
    staleTime: 5 * 60_000, // Reasons rarely change
  });
}

/** Classify an idle segment with a reason. */
export function useClassifyIdleSegment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      date: string;
      idle_segment_identifier: string;
      reason_id: string;
      remarks?: string;
    }) => {
      const res = await api.post('/analytics/productivity/idle-classifications', payload);
      return res.data.data.classification as IdleClassification;
    },
    onSuccess: (_data, variables) => {
      // Invalidate timeline so idle item shows updated classification
      queryClient.invalidateQueries({ queryKey: ['productivity', 'timeline'] });
    },
  });
}

/** Fetch range productivity for a specific employee. */
export function useGetEmployeeRangeProductivity(
  employeeId: string,
  startDate: string,
  endDate: string,
  enabled = true
) {
  return useQuery<RangeProductivityData>({
    queryKey: productivityKeys.range(employeeId, startDate, endDate),
    queryFn: async () => {
      const res = await api.get(`/analytics/productivity/employee/${employeeId}`, {
        params: { from_date: startDate, to_date: endDate },
      });
      return res.data.data as RangeProductivityData;
    },
    enabled: enabled && !!employeeId && !!startDate && !!endDate,
    staleTime: 2 * 60_000,
  });
}
