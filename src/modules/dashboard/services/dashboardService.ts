import { useQuery } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import { useAuthStore } from '../../../store/useAuthStore';
import type {
  DashboardStats, PlanVsActualData, UtilizationData, DepartmentLoad, OverdueTask, ClientPerfData, ScopeDist,
  CalendarEvent, PlanVsActualProject, EmployeeUtil, ExecutiveSummary, ExecutiveCharts, ExecutiveAlerts,
  ExecutiveRecentActivities, ProjectSummary, ProjectCharts, TeamLeadSummary, TeamLeadCharts, TeamMemberAttendance,
  EmployeeSummary, EmployeeCharts, EmployeePerformanceRow, PendingScheduleReviewWidgetData,
  TeamPerformanceRow, ExecutiveTeamPerformanceResponse, ClientPerformanceRow, ExecutiveClientPerformanceResponse,
  ProjectListRow, ExecutiveProjectListResponse, TaskSummaryRow, ExecutiveTaskSummaryResponse
} from '../types';

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
  backgroundColor: e.backgroundColor ?? e.background_color ?? '#206bc4',
  borderColor: e.borderColor ?? e.border_color ?? '#206bc4',
  textColor: e.textColor ?? e.text_color ?? '#ffffff',
  extendedProps: e.extendedProps ? {
    type: e.extendedProps.type ?? '',
    status: e.extendedProps.status,
    project: e.extendedProps.project,
    task_code: e.extendedProps.task_code,
    overdue: e.extendedProps.overdue,
  } : undefined,
});

export const useCanViewAnalytics = () =>
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

// --- New Executive Dashboard Hooks ---
export const useGetExecutiveSummary = (fromDate?: string, toDate?: string) => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'executive', 'summary', fromDate, toDate],
    enabled,
    staleTime: 30000,
    gcTime: 300000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await api.get<ApiResponse<ExecutiveSummary>>('/dashboard-analytics/executive/summary', { params });
      return res.data.data;
    },
  });
};

export const useGetExecutiveCharts = (fromDate?: string, toDate?: string) => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'executive', 'charts', fromDate, toDate],
    enabled,
    staleTime: 30000,
    gcTime: 300000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await api.get<ApiResponse<ExecutiveCharts>>('/dashboard-analytics/executive/charts', { params });
      return res.data.data;
    },
  });
};

export const useGetExecutiveAlerts = () => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'executive', 'alerts'],
    enabled,
    staleTime: 30000,
    gcTime: 300000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      const res = await api.get<ApiResponse<ExecutiveAlerts>>('/dashboard-analytics/executive/alerts');
      return res.data.data?.alerts ?? [];
    },
  });
};

export const useGetExecutiveRecentProjects = () => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'executive', 'recent-projects'],
    enabled,
    staleTime: 30000,
    gcTime: 300000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/dashboard-analytics/executive/recent-projects');
      return res.data.data?.projects ?? [];
    },
  });
};

export const useGetExecutiveRecentActivities = () => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'executive', 'recent-activities'],
    enabled,
    staleTime: 30000,
    gcTime: 300000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      const res = await api.get<ApiResponse<ExecutiveRecentActivities>>('/dashboard-analytics/executive/recent-activities');
      return res.data.data?.activities ?? [];
    },
  });
};

// --- New Executive Drilldown Hooks ---
export const useGetExecutiveTeamPerformance = (fromDate?: string, toDate?: string) => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'executive', 'team-performance', fromDate, toDate],
    enabled,
    staleTime: 30000,
    gcTime: 300000,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await api.get<ApiResponse<ExecutiveTeamPerformanceResponse>>('/dashboard-analytics/executive/team-performance', { params });
      return res.data.data?.teams ?? [];
    },
  });
};

export const useGetExecutiveClientPerformance = (fromDate?: string, toDate?: string) => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'executive', 'client-performance', fromDate, toDate],
    enabled,
    staleTime: 30000,
    gcTime: 300000,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await api.get<ApiResponse<ExecutiveClientPerformanceResponse>>('/dashboard-analytics/executive/client-performance', { params });
      return res.data.data?.clients ?? [];
    },
  });
};

export const useGetExecutiveIndividualPerformance = (departmentId?: string, teamId?: string, fromDate?: string, toDate?: string) => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'executive', 'individual-performance', departmentId, teamId, fromDate, toDate],
    enabled,
    staleTime: 30000,
    gcTime: 300000,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (departmentId) params.department_id = departmentId;
      if (teamId) params.team_id = teamId;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await api.get<ApiResponse<{ rankings: EmployeePerformanceRow[] }>>('/dashboard-analytics/executive/individual-performance', { params });
      return res.data.data?.rankings ?? [];
    },
  });
};

export const useGetExecutiveProjectList = (departmentId?: string, teamId?: string, fromDate?: string, toDate?: string) => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'executive', 'project-list', departmentId, teamId, fromDate, toDate],
    enabled,
    staleTime: 30000,
    gcTime: 300000,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (departmentId) params.department_id = departmentId;
      if (teamId) params.team_id = teamId;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await api.get<ApiResponse<ExecutiveProjectListResponse>>('/dashboard-analytics/executive/project-list', { params });
      return res.data.data?.projects ?? [];
    },
  });
};

export const useGetExecutiveTaskSummary = (departmentId?: string, teamId?: string, fromDate?: string, toDate?: string) => {
  const enabled = useCanViewAnalytics();
  return useQuery({
    queryKey: ['dashboard', 'executive', 'task-summary', departmentId, teamId, fromDate, toDate],
    enabled,
    staleTime: 30000,
    gcTime: 300000,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (departmentId) params.department_id = departmentId;
      if (teamId) params.team_id = teamId;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await api.get<ApiResponse<ExecutiveTaskSummaryResponse>>('/dashboard-analytics/executive/task-summary', { params });
      return res.data.data?.tasks ?? [];
    },
  });
};

// --- New Project Dashboard Hooks ---
export const useGetProjectSummary = (projectId?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'project', 'summary', projectId],
    enabled: !!projectId,
    staleTime: 15000,
    gcTime: 300000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      const res = await api.get<ApiResponse<ProjectSummary>>(`/dashboard-analytics/project/${projectId}/summary`);
      return res.data.data;
    },
  });
};

export const useGetProjectCharts = (projectId?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'project', 'charts', projectId],
    enabled: !!projectId,
    staleTime: 15000,
    gcTime: 300000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      const res = await api.get<ApiResponse<ProjectCharts>>(`/dashboard-analytics/project/${projectId}/charts`);
      return res.data.data;
    },
  });
};

// --- New Team Leader Dashboard Hooks ---
export const useGetTeamLeadSummary = () => {
  const enabled = useAuthStore((s) => s.isSuperAdmin() || s.hasPermission('Dashboard', 'view'));
  return useQuery({
    queryKey: ['dashboard', 'team-lead', 'summary'],
    enabled,
    staleTime: 15000,
    gcTime: 300000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      const res = await api.get<ApiResponse<TeamLeadSummary>>('/dashboard-analytics/team-leader/summary');
      return res.data.data;
    },
  });
};

export const useGetTeamLeadCharts = () => {
  const enabled = useAuthStore((s) => s.isSuperAdmin() || s.hasPermission('Dashboard', 'view'));
  return useQuery({
    queryKey: ['dashboard', 'team-lead', 'charts'],
    enabled,
    staleTime: 15000,
    gcTime: 300000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      const res = await api.get<ApiResponse<TeamLeadCharts>>('/dashboard-analytics/team-leader/charts');
      return res.data.data;
    },
  });
};

export const useGetTeamLeadAttendance = () => {
  const enabled = useAuthStore((s) => s.isSuperAdmin() || s.hasPermission('Dashboard', 'view'));
  return useQuery({
    queryKey: ['dashboard', 'team-lead', 'attendance'],
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/dashboard-analytics/team-leader/attendance');
      return (res.data.data?.attendance ?? []) as TeamMemberAttendance[];
    },
  });
};

// --- New Employee Dashboard Hooks ---
export const useGetEmployeeSummary = (fromDate?: string, toDate?: string) => {
  const enabled = useAuthStore((s) => s.isSuperAdmin() || s.hasPermission('Dashboard', 'view'));
  return useQuery({
    queryKey: ['dashboard', 'employee', 'summary', fromDate, toDate],
    enabled,
    staleTime: 5000,
    gcTime: 300000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await api.get<ApiResponse<EmployeeSummary>>('/dashboard-analytics/employee/summary', { params });
      return res.data.data;
    },
  });
};

export const useGetEmployeeCharts = (fromDate?: string, toDate?: string) => {
  const enabled = useAuthStore((s) => s.isSuperAdmin() || s.hasPermission('Dashboard', 'view'));
  return useQuery({
    queryKey: ['dashboard', 'employee', 'charts', fromDate, toDate],
    enabled,
    staleTime: 5000,
    gcTime: 300000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await api.get<ApiResponse<EmployeeCharts>>('/dashboard-analytics/employee/charts', { params });
      return res.data.data;
    },
  });
};

// --- New Employee Performance Dashboard Hooks ---
export const useGetPerformanceRankings = (departmentId?: string, teamId?: string, fromDate?: string, toDate?: string) => {
  const enabled = useAuthStore((s) => s.isSuperAdmin() || s.hasPermission('HR', 'view'));
  return useQuery({
    queryKey: ['dashboard', 'performance', 'rankings', departmentId, teamId, fromDate, toDate],
    enabled,
    staleTime: 60000,
    gcTime: 300000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (departmentId) params.department_id = departmentId;
      if (teamId) params.team_id = teamId;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await api.get<ApiResponse<any>>('/dashboard-analytics/performance/rankings', { params });
      return (res.data.data?.rankings ?? []) as EmployeePerformanceRow[];
    },
  });
};

export const useGetPendingScheduleReviews = () => {
  const enabled = useAuthStore((s) => s.hasPermission('Projects', 'view'));
  return useQuery({
    queryKey: ['dashboard', 'pending-schedule-reviews'],
    staleTime: 10000,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ reviews: any[]; count: number }>>('/dashboard/pending-schedule-reviews');
      const raw = res.data.data.reviews ?? [];
      return raw.map((r: any): PendingScheduleReviewWidgetData => ({
        id: r.id,
        holidayId: r.holiday_id,
        holidayName: r.holiday_name,
        holidayDate: r.holiday_date,
        projectId: r.project_id,
        projectName: r.project_name,
        projectCode: r.project_code,
        projectManagerName: r.project_manager_name ?? null,
        reviewStatus: r.review_status,
        createdAt: r.created_at,
      }));
    },
  });
};


