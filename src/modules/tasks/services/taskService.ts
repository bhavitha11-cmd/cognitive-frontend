import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { Task, TaskAssignment, ScopeOfWork, TaskCreate } from '../types';

// ==========================================
// MAPPERS
// ==========================================

const mapBackendAssignmentToFrontend = (a: any): TaskAssignment => ({
  id: a.id,
  taskId: a.task_id,
  employeeId: a.employee_id || undefined,
  employeeName: a.employee_name || undefined,
  employeeCode: a.employee_code || undefined,
  assignedHours: a.assigned_hours ?? 0,
  plannedStartDate: a.planned_start_date || undefined,
  plannedEndDate: a.planned_end_date || undefined,
  status: a.status || 'ASSIGNED',
  assignedAt: a.assigned_at || undefined,
});

const mapBackendTaskToFrontend = (t: any): Task => ({
  id: t.id,
  taskCode: t.task_code,
  title: t.title,
  description: t.description || undefined,
  projectId: t.project_id,
  projectName: t.project_name || undefined,
  parentTaskId: t.parent_task_id || undefined,
  scopeOfWorkId: t.scope_of_work_id || undefined,
  scopeName: t.scope_name || undefined,
  teamId: t.team_id,
  teamName: t.team_name || undefined,
  teamCode: t.team_code || undefined,
  departmentCategory: t.department_category || undefined,
  status: t.status || 'NOT_STARTED',
  priority: t.priority || 'MEDIUM',
  estimatedHours: t.estimated_hours ?? 0,
  actualHours: t.actual_hours ?? 0,
  progress: t.progress ?? 0,
  plannedStartDate: t.planned_start_date || undefined,
  plannedEndDate: t.planned_end_date || undefined,
  actualStartDate: t.actual_start_date || undefined,
  actualEndDate: t.actual_end_date || undefined,
  receivedDate: t.received_date || undefined,
  plannedDeliveryDate: t.planned_delivery_date || undefined,
  actualDeliveryDate: t.actual_delivery_date || undefined,
  remarks: t.remarks || undefined,
  isActive: t.is_active ?? true,
  assignments: Array.isArray(t.assignments) ? t.assignments.map(mapBackendAssignmentToFrontend) : [],
  assigneeCount: t.assignee_count ?? (Array.isArray(t.assignments) ? t.assignments.length : 0),
  reworkCount: t.rework_count ?? 0,
  totalReworkHours: t.total_rework_hours ?? 0,
  originalEstimatedHours: t.original_estimated_hours || undefined,
  createdAt: t.created_at || undefined,
});

const mapBackendScopeToFrontend = (s: any): ScopeOfWork => ({
  id: s.id,
  code: s.code,
  name: s.name,
  departmentCategory: s.department_category,
  isActive: s.is_active ?? true,
});

const mapTaskCreateToBackend = (data: TaskCreate) => ({
  task_code: data.taskCode,
  project_id: data.projectId,
  title: data.title,
  description: data.description || null,
  scope_of_work_id: data.scopeOfWorkId || null,
  team_id: data.teamId,
  department_category: data.departmentCategory || null,
  status: data.status || 'NOT_STARTED',
  priority: data.priority || 'MEDIUM',
  estimated_hours: data.estimatedHours ?? 0,
  planned_start_date: data.plannedStartDate || null,
  planned_end_date: data.plannedEndDate || null,
  planned_delivery_date: data.plannedDeliveryDate || null,
  remarks: data.remarks || null,
  assigned_employee_id: data.assignedEmployeeId || null,
});

// ==========================================
// PARAMS INTERFACE
// ==========================================

export interface TaskListParams {
  skip?: number;
  limit?: number;
  projectId?: string;
  status?: string;
  deptCat?: string;
  search?: string;
  employeeId?: string;
}

// ==========================================
// 1. GET TASKS (paginated list)
// ==========================================

export const useGetTasks = (params?: TaskListParams, options?: any) => {
  return useQuery<{ tasks: Task[]; total: number; skip: number; limit: number }>({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      if (params?.skip !== undefined) queryParams.skip = params.skip;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.projectId) queryParams.project_id = params.projectId;
      if (params?.status && params.status !== 'all') queryParams.status = params.status;
      if (params?.deptCat && params.deptCat !== 'all') queryParams.department_category = params.deptCat;
      if (params?.search) queryParams.search = params.search;
      if (params?.employeeId) queryParams.employee_id = params.employeeId;

      const response = await api.get('/tasks', { params: queryParams });
      const data = response.data?.data || response.data || {};
      const rawTasks = data.tasks || data.items || [];
      return {
        tasks: rawTasks.map(mapBackendTaskToFrontend),
        total: data.total ?? rawTasks.length,
        skip: data.skip ?? 0,
        limit: data.limit ?? rawTasks.length,
      };
    },
    ...options,
  });
};

// ==========================================
// 2. GET SINGLE TASK
// ==========================================

export const useGetTask = (id: string) => {
  return useQuery<Task>({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const response = await api.get(`/tasks/${id}`);
      const raw = response.data?.data?.task || response.data?.data || response.data;
      return mapBackendTaskToFrontend(raw);
    },
    enabled: !!id,
  });
};

// ==========================================
// 2b. GET PROJECT DETAILS BY PART NUMBER
// ==========================================

export const useGetProjectDetailsByPart = (partNumber: string) => {
  return useQuery<any>({
    queryKey: ['project-details-by-part', partNumber],
    queryFn: async () => {
      const response = await api.get(`/parts/${partNumber}/project-details`);
      return response.data?.data || response.data;
    },
    enabled: !!partNumber,
    retry: false,
  });
};

// ==========================================
// 3. GET TASKS BY PROJECT
// ==========================================

export const useGetTasksByProject = (projectId: string) => {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'project', projectId],
    queryFn: async () => {
      const response = await api.get('/tasks', { params: { project_id: projectId, limit: 500 } });
      const data = response.data?.data || response.data || {};
      const rawTasks = data.tasks || data.items || [];
      return rawTasks.map(mapBackendTaskToFrontend);
    },
    enabled: !!projectId,
  });
};

export const useGetNextTaskCode = (projectId: string) => {
  return useQuery<{ next_code: string; part_number: string; suffix: string; existing_count: number }>({
    queryKey: ['tasks', 'next-code', projectId],
    queryFn: async () => {
      const response = await api.get(`/tasks/next-code/${projectId}`);
      return response.data?.data || response.data;
    },
    enabled: !!projectId,
  });
};

// ==========================================
// 4. GET SCOPE OF WORK
// ==========================================

export const useGetScopeOfWork = (deptCategory?: string) => {
  return useQuery<ScopeOfWork[]>({
    queryKey: ['scope-of-work', deptCategory],
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      if (deptCategory && deptCategory !== 'all') queryParams.department_category = deptCategory;
      const response = await api.get('/scope-of-work', { params: queryParams });
      const data = response.data?.data || response.data || {};
      const rawScopes = data.scopes || data.items || (Array.isArray(data) ? data : []);
      return rawScopes.map(mapBackendScopeToFrontend);
    },
  });
};

// ==========================================
// 5. CREATE TASK
// ==========================================

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TaskCreate) => {
      const payload = mapTaskCreateToBackend(data);
      const response = await api.post('/tasks', payload);
      const raw = response.data?.data?.task || response.data?.data || response.data;
      return mapBackendTaskToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// ==========================================
// 6. UPDATE TASK
// ==========================================

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskCreate> }) => {
      const payload: Record<string, any> = {};
      if (data.taskCode !== undefined) payload.task_code = data.taskCode;
      if (data.projectId !== undefined) payload.project_id = data.projectId;
      if (data.title !== undefined) payload.title = data.title;
      if (data.description !== undefined) payload.description = data.description || null;
      if (data.scopeOfWorkId !== undefined) payload.scope_of_work_id = data.scopeOfWorkId || null;
      if (data.teamId !== undefined) payload.team_id = data.teamId;
      if (data.departmentCategory !== undefined) payload.department_category = data.departmentCategory || null;
      if (data.status !== undefined) payload.status = data.status;
      if (data.priority !== undefined) payload.priority = data.priority;
      if (data.estimatedHours !== undefined) payload.estimated_hours = data.estimatedHours;
      if (data.plannedStartDate !== undefined) payload.planned_start_date = data.plannedStartDate || null;
      if (data.plannedEndDate !== undefined) payload.planned_end_date = data.plannedEndDate || null;
      if (data.receivedDate !== undefined) payload.received_date = data.receivedDate || null;
      if (data.plannedDeliveryDate !== undefined) payload.planned_delivery_date = data.plannedDeliveryDate || null;
      if (data.remarks !== undefined) payload.remarks = data.remarks || null;
      if (data.assignedEmployeeId !== undefined) payload.assigned_employee_id = data.assignedEmployeeId || null;

      const response = await api.put(`/tasks/${id}`, payload);
      const raw = response.data?.data?.task || response.data?.data || response.data;
      return mapBackendTaskToFrontend(raw);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
    },
  });
};

// ==========================================
// 7. UPDATE TASK STATUS
// ==========================================

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, progress }: { id: string; status: string; progress?: number }) => {
      const payload: Record<string, any> = { status };
      if (progress !== undefined) payload.progress = progress;
      const response = await api.patch(`/tasks/${id}/status`, payload);
      const raw = response.data?.data?.task || response.data?.data || response.data;
      return mapBackendTaskToFrontend(raw);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
    },
  });
};

// ==========================================
// 8. DELETE TASK
// ==========================================

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// ==========================================
// 9. ASSIGN EMPLOYEE TO TASK
// ==========================================

export interface AssignEmployeeData {
  employeeId: string;
  assignedHours: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
}

export const useAssignEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: AssignEmployeeData }) => {
      const payload = {
        employee_id: data.employeeId,
        assigned_hours: data.assignedHours,
        planned_start_date: data.plannedStartDate || null,
        planned_end_date: data.plannedEndDate || null,
      };
      const response = await api.post(`/tasks/${taskId}/assignments`, payload);
      const raw = response.data?.data?.assignment || response.data?.data || response.data;
      return mapBackendAssignmentToFrontend(raw);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] });
    },
  });
};

// ==========================================
// 10. REMOVE ASSIGNMENT
// ==========================================

export const useRemoveAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, assignmentId }: { taskId: string; assignmentId: string }) => {
      await api.delete(`/tasks/${taskId}/assignments/${assignmentId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] });
    },
  });
};
