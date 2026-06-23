import { useQuery } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import { useAuthStore } from '../../../store/useAuthStore';
import type { DashboardStats, PlanVsActualData, UtilizationData, DepartmentLoad, OverdueTask, ClientPerfData, ScopeDist, CalendarEvent, PlanVsActualProject, EmployeeUtil } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const mapStats = (d: any): DashboardStats => ({
  totalClients: d.total_clients ?? 0,
  activeClients: d.active_clients ?? 0,
  totalProjects: d.total_projects ?? 0,
  activeProjects: d.active_projects ?? 0,
  completedProjects: d.completed_projects ?? 0,
  totalTasks: d.total_tasks ?? 0,
  pendingTasks: d.pending_tasks ?? 0,
  inProgressTasks: d.in_progress_tasks ?? 0,
  completedTasks: d.completed_tasks ?? 0,
  overdueTasks: d.overdue_tasks ?? 0,
  totalEmployees: d.total_employees ?? 0,
  activeEmployees: d.active_employees ?? 0,
  presentToday: d.present_today ?? 0,
  totalEstimatedHours: d.total_estimated_hours ?? 0,
  totalActualHours: d.total_actual_hours ?? 0,
  overrunPercentage: d.overrun_percentage ?? 0,
});

const mapPlanVsActualProject = (p: any): PlanVsActualProject => ({
  id: p.id,
  partNumber: p.part_number,
  name: p.name,
  clientName: p.client_name,
  status: p.status,
  estimatedHours: p.estimated_hours ?? 0,
  actualHours: p.actual_hours ?? 0,
  overrunHours: p.overrun_hours ?? 0,
  overrunPercentage: p.overrun_percentage ?? 0,
  taskCount: p.task_count ?? 0,
  completedTaskCount: p.completed_task_count ?? 0,
  plannedEndDate: p.planned_end_date,
});

const mapPlanVsActual = (d: any): PlanVsActualData => ({
  projects: (d.projects ?? []).map(mapPlanVsActualProject),
  totalEstimated: d.total_estimated ?? 0,
  totalActual: d.total_actual ?? 0,
  totalOverrun: d.total_overrun ?? 0,
  overallOverrunPct: d.overall_overrun_pct ?? 0,
});

const mapEmployeeUtil = (e: any): EmployeeUtil => ({
  id: e.id,
  employeeCode: e.employee_code,
  employeeName: e.employee_name,
  departmentName: e.department_name,
  totalHoursLogged: e.total_hours_logged ?? 0,
  billableHours: e.billable_hours ?? 0,
  taskCount: e.task_count ?? 0,
  lateDays: e.late_days ?? 0,
  absenceDays: e.absence_days ?? 0,
  utilizationPercentage: e.utilization_percentage ?? 0,
});

const mapUtilization = (d: any): UtilizationData => ({
  employees: (d.employees ?? []).map(mapEmployeeUtil),
  periodStart: d.period_start ?? '',
  periodEnd: d.period_end ?? '',
  totalHoursCompany: d.total_hours_company ?? 0,
});

const mapDepartmentLoad = (d: any): DepartmentLoad => ({
  department: d.department ?? '',
  estimatedHours: d.estimated_hours ?? 0,
  actualHours: d.actual_hours ?? 0,
  taskCount: d.task_count ?? 0,
  overrunPercentage: d.overrun_percentage ?? 0,
});

const mapOverdueTask = (t: any): OverdueTask => ({
  id: t.id,
  taskCode: t.task_code,
  title: t.title,
  projectId: t.project_id,
  projectName: t.project_name,
  status: t.status,
  priority: t.priority,
  plannedDeliveryDate: t.planned_delivery_date,
  estimatedHours: t.estimated_hours ?? 0,
  actualHours: t.actual_hours ?? 0,
  daysOverdue: t.days_overdue ?? 0,
  assigneeName: t.assignee_name,
});

const mapClientPerf = (c: any): ClientPerfData['clients'][0] => ({
  id: c.id,
  name: c.name,
  totalProjects: c.total_projects ?? 0,
  activeProjects: c.active_projects ?? 0,
  completedProjects: c.completed_projects ?? 0,
  delayedProjects: c.delayed_projects ?? 0,
  totalEstimatedHours: c.total_estimated_hours ?? 0,
  totalActualHours: c.total_actual_hours ?? 0,
  onTimeDeliveryPct: c.on_time_delivery_pct ?? 0,
});

const mapClientPerfData = (d: any): ClientPerfData => ({
  clients: (d.clients ?? []).map(mapClientPerf),
});

const mapScopeDist = (s: any): ScopeDist => ({
  scopeCode: s.scope_code,
  scopeName: s.scope_name,
  departmentCategory: s.department_category,
  estimatedHours: s.estimated_hours ?? 0,
  actualHours: s.actual_hours ?? 0,
  taskCount: s.task_count ?? 0,
});

const mapCalendarEvent = (e: any): CalendarEvent => ({
  id: e.id,
  title: e.title,
  start: e.start,
  allDay: e.all_day ?? false,
  backgroundColor: e.backgroundColor ?? '#206bc4',
  borderColor: e.borderColor ?? '#206bc4',
  textColor: e.textColor ?? '#ffffff',
  extendedProps: e.extendedProps ? {
    type: e.extendedProps.type ?? '',
    status: e.extendedProps.status,
    project: e.extendedProps.project,
    task_code: e.extendedProps.task_code,
    overdue: e.extendedProps.overdue,
  } : undefined,
});

const useCanViewAnalytics = () =>
  useAuthStore((s) => {
    const isSuperAdmin = s.roleCodes.some((c) =>
      ['ADMIN', 'CEO', 'CHIEF_EXECUTIVE_OFFICER', 'ADMINISTRATOR'].includes(c)
    );
    if (isSuperAdmin) return true;
    const perm = s.permissions.find((p) => p.module_name.toLowerCase() === 'analytics');
    return perm?.can_view ?? false;
  });

export const useGetDashboardStats = () => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    enabled,
    retry: false,
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/analytics/dashboard');
      return mapStats(res.data.data);
    },
  });
};

export const useGetPlanVsActual = () => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'plan-vs-actual'],
    enabled,
    retry: false,
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/analytics/plan-vs-actual');
      return mapPlanVsActual(res.data.data);
    },
  });
};

export const useGetUtilization = (fromDate?: string, toDate?: string) => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'utilization', fromDate, toDate],
    enabled,
    retry: false,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await api.get<ApiResponse<any>>('/analytics/utilization', { params });
      return mapUtilization(res.data.data);
    },
  });
};

export const useGetDepartmentLoad = () => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'department-load'],
    enabled,
    retry: false,
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/analytics/department-load');
      const raw = res.data.data;
      const items = raw?.departments ?? raw ?? [];
      return (Array.isArray(items) ? items : []).map(mapDepartmentLoad) as DepartmentLoad[];
    },
  });
};

export const useGetOverdueTasks = () => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'overdue-tasks'],
    enabled,
    retry: false,
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/analytics/overdue-tasks');
      const raw = res.data.data;
      const items = raw?.tasks ?? raw ?? [];
      return (Array.isArray(items) ? items : []).map(mapOverdueTask) as OverdueTask[];
    },
  });
};

export const useGetUpcomingDeadlines = (days: number = 14) => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'upcoming-deadlines', days],
    enabled,
    retry: false,
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/analytics/upcoming-deadlines', { params: { days } });
      const raw = res.data.data;
      const items = raw?.tasks ?? raw ?? [];
      return (Array.isArray(items) ? items : []).map(mapOverdueTask) as OverdueTask[];
    },
  });
};

export const useGetClientPerformance = () => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'client-performance'],
    enabled,
    retry: false,
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/analytics/client-performance');
      return mapClientPerfData(res.data.data);
    },
  });
};

export const useGetScopeDistribution = () => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'scope-distribution'],
    enabled,
    retry: false,
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/analytics/scope-distribution');
      const raw = res.data.data;
      const items = raw?.scopes ?? raw ?? [];
      return (Array.isArray(items) ? items : []).map(mapScopeDist) as ScopeDist[];
    },
  });
};

export const useGetCalendarEvents = (fromDate: string, toDate: string) => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'calendar-events', fromDate, toDate],
    enabled: enabled && !!fromDate && !!toDate,
    retry: false,
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/analytics/calendar-events', { params: { from_date: fromDate, to_date: toDate } });
      const raw = res.data.data;
      const items = raw?.events ?? raw ?? [];
      return (Array.isArray(items) ? items : []).map(mapCalendarEvent) as CalendarEvent[];
    },
  });
};
