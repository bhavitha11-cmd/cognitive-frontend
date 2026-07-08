import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { EmployeeSchedule, EmployeeScheduleCreate, TaskDependency, TaskDependencyCreate, EmployeeCapacity, CapacityWeek, GanttData, GanttTask, GanttDependency } from '../types';

const mapGanttTask = (t: any): GanttTask => ({
  id: t.id,
  taskCode: t.task_code,
  title: t.title,
  scheduledStartDate: t.scheduled_start_date || undefined,
  scheduledEndDate: t.scheduled_end_date || undefined,
  plannedStartDate: t.planned_start_date || undefined,
  plannedEndDate: t.planned_end_date || undefined,
  actualStartDate: t.actual_start_date || undefined,
  actualEndDate: t.actual_end_date || undefined,
  progress: t.progress ?? 0,
  estimatedHours: t.estimated_hours ?? 0,
  actualHours: t.actual_hours ?? 0,
  status: t.status,
  priority: t.priority,
  assignees: Array.isArray(t.assignees) ? t.assignees.map((a: any) => ({
    employeeId: a.employee_id || undefined,
    employeeName: a.employee_name || undefined,
    assignedHours: a.assigned_hours ?? 0,
  })) : [],
  projectId: t.project_id,
});

const mapGanttDependency = (d: any): GanttDependency => ({
  id: d.id,
  taskId: d.task_id,
  dependsOnTaskId: d.depends_on_task_id,
  dependencyType: d.dependency_type,
});

const mapEmployeeSchedule = (s: any): EmployeeSchedule => ({
  id: s.id,
  employeeId: s.employee_id,
  employeeName: s.employee_name || undefined,
  employeeCode: s.employee_code || undefined,
  weekStartDate: s.week_start_date,
  availableHours: s.available_hours ?? 0,
  createdAt: s.created_at || undefined,
});

const mapEmployeeScheduleCreateToBackend = (data: EmployeeScheduleCreate) => ({
  employee_id: data.employeeId,
  week_start_date: data.weekStartDate,
  available_hours: data.availableHours,
});

const mapTaskDependencyCreateToBackend = (data: TaskDependencyCreate) => ({
  task_id: data.taskId,
  depends_on_task_id: data.dependsOnTaskId,
  dependency_type: data.dependencyType || 'FINISH_TO_START',
});

const mapCapacityWeek = (w: any): CapacityWeek => ({
  weekStartDate: w.week_start_date,
  availableHours: w.available_hours ?? 0,
  scheduledHours: w.scheduled_hours ?? 0,
  utilizationPct: w.utilization_pct ?? 0,
});

const mapTaskDependency = (d: any): TaskDependency => ({
  id: d.id,
  taskId: d.task_id,
  dependsOnTaskId: d.depends_on_task_id,
  taskCode: d.task_code || undefined,
  taskTitle: d.task_title || undefined,
  dependsOnTaskCode: d.depends_on_task_code || undefined,
  dependsOnTaskTitle: d.depends_on_task_title || undefined,
  dependencyType: d.dependency_type,
  createdAt: d.created_at || undefined,
});

export const useGetGanttData = (projectId: string) => {
  return useQuery<GanttData>({
    queryKey: ['gantt', projectId],
    queryFn: async () => {
      const response = await api.get(`/planning/gantt/${projectId}`);
      const raw = response.data?.data || response.data;
      const tasks = Array.isArray(raw.tasks) ? raw.tasks.map(mapGanttTask) : [];
      const dependencies = Array.isArray(raw.dependencies) ? raw.dependencies.map(mapGanttDependency) : [];
      return { tasks, dependencies };
    },
    enabled: !!projectId,
  });
};

export const useScheduleProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await api.post(`/planning/schedule/${projectId}`);
      const raw = response.data?.data || response.data;
      const tasks = Array.isArray(raw.tasks) ? raw.tasks.map(mapGanttTask) : [];
      const dependencies = Array.isArray(raw.dependencies) ? raw.dependencies.map(mapGanttDependency) : [];
      return { tasks, dependencies };
    },
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
    },
  });
};

export const useGetEmployeeCapacity = (employeeId: string, fromDate: string, toDate: string) => {
  return useQuery<EmployeeCapacity>({
    queryKey: ['employee-capacity', employeeId, fromDate, toDate],
    queryFn: async () => {
      const response = await api.get(`/planning/capacity/${employeeId}`, {
        params: { from_date: fromDate, to_date: toDate },
      });
      const raw = response.data?.data || response.data;
      return {
        employeeId: raw.employee_id || employeeId,
        employeeName: raw.employee_name || '',
        weeks: Array.isArray(raw.weeks) ? raw.weeks.map(mapCapacityWeek) : [],
      };
    },
    enabled: !!employeeId && !!fromDate && !!toDate,
  });
};

export const useGetEmployeeSchedules = (employeeId: string, fromDate: string, toDate: string) => {
  return useQuery<EmployeeSchedule[]>({
    queryKey: ['employee-schedules', employeeId, fromDate, toDate],
    queryFn: async () => {
      const response = await api.get('/planning/schedules', {
        params: { employee_id: employeeId, from_date: fromDate, to_date: toDate },
      });
      const raw = response.data?.data || response.data;
      const items = Array.isArray(raw) ? raw : (Array.isArray(raw.schedules) ? raw.schedules : []);
      return items.map(mapEmployeeSchedule);
    },
    enabled: !!employeeId && !!fromDate && !!toDate,
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: EmployeeScheduleCreate) => {
      const payload = mapEmployeeScheduleCreateToBackend(data);
      const response = await api.post('/planning/schedules', payload);
      const raw = response.data?.data?.schedule || response.data?.data || response.data;
      return mapEmployeeSchedule(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-schedules'] });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmployeeScheduleCreate> }) => {
      const payload: Record<string, any> = {};
      if (data.employeeId !== undefined) payload.employee_id = data.employeeId;
      if (data.weekStartDate !== undefined) payload.week_start_date = data.weekStartDate;
      if (data.availableHours !== undefined) payload.available_hours = data.availableHours;
      const response = await api.put(`/planning/schedules/${id}`, payload);
      const raw = response.data?.data?.schedule || response.data?.data || response.data;
      return mapEmployeeSchedule(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-schedules'] });
    },
  });
};

export const useCreateDependency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TaskDependencyCreate) => {
      const payload = mapTaskDependencyCreateToBackend(data);
      const response = await api.post('/planning/dependencies', payload);
      const raw = response.data?.data?.dependency || response.data?.data || response.data;
      return mapTaskDependency(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gantt'] });
      queryClient.invalidateQueries({ queryKey: ['project-dependencies'] });
    },
  });
};

export const useDeleteDependency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/planning/dependencies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gantt'] });
      queryClient.invalidateQueries({ queryKey: ['project-dependencies'] });
    },
  });
};

export const useGetProjectDependencies = (projectId: string) => {
  return useQuery<TaskDependency[]>({
    queryKey: ['project-dependencies', projectId],
    queryFn: async () => {
      const response = await api.get(`/planning/project-dependencies/${projectId}`);
      const raw = response.data?.data || response.data;
      const items = Array.isArray(raw) ? raw : (Array.isArray(raw.dependencies) ? raw.dependencies : []);
      return items.map(mapTaskDependency);
    },
    enabled: !!projectId,
  });
};

export const useGetTaskDependencies = (taskId: string) => {
  return useQuery<TaskDependency[]>({
    queryKey: ['task-dependencies', taskId],
    queryFn: async () => {
      const response = await api.get(`/planning/dependencies/${taskId}`);
      const raw = response.data?.data || response.data;
      const items = Array.isArray(raw) ? raw : (Array.isArray(raw.dependencies) ? raw.dependencies : []);
      return items.map(mapTaskDependency);
    },
    enabled: !!taskId,
  });
};

// ── Employee Load Chart ──────────────────────────────────────────────────────

export interface LoadTask {
  taskId: string;
  taskCode: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  status: string;
  priority: string;
  progress: number;
  assignedHours: number;
  estimatedHours: number;
  actualHours: number;
  startDate: string | null;
  endDate: string | null;
}

export interface EmployeeLoadRow {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  displayName: string;
  profilePhotoUrl: string | null;
  designation: string | null;
  department: string | null;
  reportingManagerId: string | null;
  loadedUntil: string | null;
  loadStatus: 'AVAILABLE' | 'UNDERLOADED' | 'OPTIMAL' | 'OVERLOADED';
  totalAssignedHours: number;
  activeTaskCount: number;
  tasks: LoadTask[];
}

export interface EmployeeLoadChartData {
  rows: EmployeeLoadRow[];
  fromDate: string;
  toDate: string;
}

const mapLoadTask = (t: any): LoadTask => ({
  taskId: t.task_id,
  taskCode: t.task_code,
  taskTitle: t.task_title,
  projectId: t.project_id,
  projectName: t.project_name,
  status: t.status,
  priority: t.priority,
  progress: t.progress ?? 0,
  assignedHours: t.assigned_hours ?? 0,
  estimatedHours: t.estimated_hours ?? 0,
  actualHours: t.actual_hours ?? 0,
  startDate: t.start_date || null,
  endDate: t.end_date || null,
});

const mapEmployeeLoadRow = (r: any): EmployeeLoadRow => ({
  employeeId: r.employee_id,
  employeeCode: r.employee_code,
  employeeName: r.employee_name,
  displayName: r.display_name || r.employee_name,
  profilePhotoUrl: r.profile_photo_url || null,
  designation: r.designation || null,
  department: r.department || null,
  reportingManagerId: r.reporting_manager_id || null,
  loadedUntil: r.loaded_until || null,
  loadStatus: r.load_status || 'AVAILABLE',
  totalAssignedHours: r.total_assigned_hours ?? 0,
  activeTaskCount: r.active_task_count ?? 0,
  tasks: Array.isArray(r.tasks) ? r.tasks.map(mapLoadTask) : [],
});

export const useGetEmployeeLoadChart = (params: {
  fromDate?: string;
  toDate?: string;
  departmentId?: string;
  teamId?: string;
}) => {
  return useQuery<EmployeeLoadChartData>({
    queryKey: ['employee-load-chart', params.fromDate, params.toDate, params.departmentId, params.teamId],
    queryFn: async () => {
      const response = await api.get('/dashboard-analytics/employee-load', {
        params: {
          from_date: params.fromDate,
          to_date: params.toDate,
          department_id: params.departmentId,
          team_id: params.teamId,
        },
      });
      const raw = response.data?.data || response.data;
      return {
        rows: Array.isArray(raw.rows) ? raw.rows.map(mapEmployeeLoadRow) : [],
        fromDate: raw.from_date || params.fromDate || '',
        toDate: raw.to_date || params.toDate || '',
      };
    },
    staleTime: 30_000,
  });
};

