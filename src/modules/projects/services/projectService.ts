import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { Project, ProjectCreate, ProjectUpdate, ProjectListParams, ParentProject, ParentProjectCreate } from '../types';

// ==========================================
// MAPPERS
// ==========================================

export const mapBackendProjectToFrontend = (p: any): Project => ({
  id: p.id,
  partNumber: p.part_number,
  name: p.name,
  partName: p.part_name,
  description: p.description || undefined,
  clientId: p.client_id,
  clientName: p.client_name || undefined,
  projectManagerId: p.project_manager_id || undefined,
  projectManagerName: p.project_manager_name || undefined,
  departmentId: p.department_id,
  departmentName: p.department_name || undefined,
  departmentCode: p.department_code || undefined,
  status: p.status,
  priority: p.priority,
  isBillable: p.is_billable ?? true,
  plannedStartDate: p.planned_start_date || undefined,
  plannedEndDate: p.planned_end_date || undefined,
  actualStartDate: p.actual_start_date || undefined,
  actualEndDate: p.actual_end_date || undefined,
  estimatedHours: p.estimated_hours ?? 0,
  contractHours: p.contract_hours || undefined,
  invoiceStatus: p.invoice_status ?? 'PENDING',
  tokForm: p.tok_form || undefined,
  feedbackStatus: p.feedback_status ?? 'PENDING',
  statusReason: p.status_reason || undefined,
  isActive: p.is_active ?? true,
  taskCount: p.task_count ?? 0,
  completedTaskCount: p.completed_task_count ?? 0,
  actualHours: p.actual_hours ?? 0,
  createdAt: p.created_at || undefined,
});

export const mapFrontendProjectToBackend = (data: ProjectCreate) => ({
  part_number: data.partNumber,
  name: data.name,
  part_name: data.partName,
  description: data.description || null,
  client_id: data.clientId,
  project_manager_id: data.projectManagerId || null,
  department_id: data.departmentId,
  status: data.status || 'Yet To Start',
  priority: data.priority || 'MEDIUM',
  is_billable: data.isBillable ?? true,
  planned_start_date: data.plannedStartDate || null,
  planned_end_date: data.plannedEndDate || null,
  estimated_hours: data.estimatedHours ?? 0,
  contract_hours: data.contractHours || null,
  invoice_status: data.invoiceStatus || 'PENDING',
  tok_form: data.tokForm || null,
  feedback_status: data.feedbackStatus || 'PENDING',
  status_reason: data.statusReason || null,
});

export const mapBackendParentProjectToFrontend = (p: any): ParentProject => ({
  id: p.id,
  name: p.name,
  description: p.description || undefined,
  clientId: p.client_id,
  clientName: p.client_name || undefined,
  projectManagerId: p.project_manager_id || undefined,
  projectManagerName: p.project_manager_name || undefined,
  departmentId: p.department_id,
  departmentName: p.department_name || undefined,
  departmentCode: p.department_code || undefined,
  isActive: p.is_active ?? true,
  partCount: p.part_count ?? 0,
  status: p.status,
  progress: p.progress ?? 0.0,
  plannedStartDate: p.planned_start_date || undefined,
  plannedEndDate: p.planned_end_date || undefined,
  actualStartDate: p.actual_start_date || undefined,
  actualEndDate: p.actual_end_date || undefined,
  estimatedHours: p.estimated_hours ?? 0.0,
  actualHours: p.actual_hours ?? 0.0,
  parts: (p.parts || []).map(mapBackendProjectToFrontend),
});

export const mapFrontendParentProjectToBackend = (data: ParentProjectCreate) => ({
  name: data.name,
  description: data.description || null,
  client_id: data.clientId,
  project_manager_id: data.projectManagerId || null,
  department_id: data.departmentId,
  parts: (data.parts || []).map(mapFrontendProjectToBackend),
});

// ==========================================
// PROJECT HOOKS (Parent Projects)
// ==========================================

export const useGetProjects = (params?: ProjectListParams) => {
  return useQuery<{ projects: ParentProject[]; total: number }>({
    queryKey: ['projects', params],
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      if (params?.skip !== undefined) queryParams.skip = params.skip;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;
      if (params?.clientId) queryParams.client_id = params.clientId;
      if (params?.status) queryParams.status = params.status;
      const response = await api.get('/projects', { params: queryParams });
      const data = response.data?.data || {};
      const projects = (data.projects || []).map(mapBackendParentProjectToFrontend);
      return { projects, total: data.total ?? projects.length };
    },
  });
};

export const useGetProject = (id: string) => {
  return useQuery<ParentProject>({
    queryKey: ['projects', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      const raw = response.data?.data?.project || response.data?.data || response.data;
      return mapBackendParentProjectToFrontend(raw);
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ParentProjectCreate) => {
      const payload = mapFrontendParentProjectToBackend(data);
      const response = await api.post('/projects', payload);
      const raw = response.data?.data?.project || response.data?.data || response.data;
      return mapBackendParentProjectToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useCreatePart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        parent_project_id: data.parentProjectId,
        part_number: data.partNumber,
        name: data.name,
        part_name: data.partName,
        description: data.description || null,
        client_id: data.clientId,
        project_manager_id: data.projectManagerId || null,
        department_id: data.departmentId,
        status: data.status || 'Yet To Start',
        priority: data.priority || 'MEDIUM',
        is_billable: data.isBillable !== undefined ? data.isBillable : true,
        planned_start_date: data.plannedStartDate || null,
        planned_end_date: data.plannedEndDate || null,
        estimated_hours: Number(data.estimatedHours || 0),
        contract_hours: data.contractHours ? Number(data.contractHours) : null,
        invoice_status: data.invoiceStatus || 'PENDING',
        tok_form: data.tokForm || null,
        feedback_status: data.feedbackStatus || 'PENDING',
      };
      const response = await api.post('/parts', payload);
      return response.data?.data?.part;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ParentProjectCreate> & { isActive?: boolean } }) => {
      const payload: Record<string, any> = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description || null;
      if (data.clientId !== undefined) payload.client_id = data.clientId;
      if (data.projectManagerId !== undefined) payload.project_manager_id = data.projectManagerId || null;
      if (data.departmentId !== undefined) payload.department_id = data.departmentId;
      if (data.isActive !== undefined) payload.is_active = data.isActive;
      const response = await api.put(`/projects/${id}`, payload);
      const raw = response.data?.data?.project || response.data?.data || response.data;
      return mapBackendParentProjectToFrontend(raw);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// ==========================================
// PART HOOKS (Previously Project Hooks)
// ==========================================

export const useGetParts = (params?: ProjectListParams & { parentProjectId?: string }) => {
  return useQuery<{ parts: Project[]; total: number }>({
    queryKey: ['parts', params],
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      if (params?.skip !== undefined) queryParams.skip = params.skip;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;
      if (params?.clientId) queryParams.client_id = params.clientId;
      if (params?.status) queryParams.status = params.status;
      if (params?.parentProjectId) queryParams.parent_project_id = params.parentProjectId;
      const response = await api.get('/parts', { params: queryParams });
      const data = response.data?.data || {};
      const parts = (data.projects || []).map(mapBackendProjectToFrontend);
      return { parts, total: data.total ?? parts.length };
    },
  });
};

export const useGetPart = (id: string) => {
  return useQuery<Project & { parentProjectId?: string }>({
    queryKey: ['parts', id],
    queryFn: async () => {
      const response = await api.get(`/parts/${id}`);
      const raw = response.data?.data?.project || response.data?.data || response.data;
      return mapBackendProjectToFrontend(raw);
    },
    enabled: !!id,
  });
};

export const useGetPartStats = (id: string) => {
  return useQuery<any>({
    queryKey: ['parts', id, 'stats'],
    queryFn: async () => {
      const response = await api.get(`/parts/${id}/stats`);
      return response.data?.data?.stats || response.data?.data || response.data;
    },
    enabled: !!id,
  });
};

export const useUpdatePart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProjectUpdate }) => {
      const payload: Record<string, any> = {};
      if (data.partNumber !== undefined) payload.part_number = data.partNumber;
      if (data.name !== undefined) payload.name = data.name;
      if (data.partName !== undefined) payload.part_name = data.partName;
      if (data.description !== undefined) payload.description = data.description || null;
      if (data.clientId !== undefined) payload.client_id = data.clientId;
      if (data.projectManagerId !== undefined) payload.project_manager_id = data.projectManagerId || null;
      if (data.departmentId !== undefined) payload.department_id = data.departmentId;
      if (data.status !== undefined) payload.status = data.status;
      if (data.priority !== undefined) payload.priority = data.priority;
      if (data.isBillable !== undefined) payload.is_billable = data.isBillable;
      if (data.plannedStartDate !== undefined) payload.planned_start_date = data.plannedStartDate || null;
      if (data.plannedEndDate !== undefined) payload.planned_end_date = data.plannedEndDate || null;
      if (data.estimatedHours !== undefined) payload.estimated_hours = data.estimatedHours;
      if (data.contractHours !== undefined) payload.contract_hours = data.contractHours || null;
      if (data.invoiceStatus !== undefined) payload.invoice_status = data.invoiceStatus;
      if (data.tokForm !== undefined) payload.tok_form = data.tokForm || null;
      if (data.feedbackStatus !== undefined) payload.feedback_status = data.feedbackStatus;
      if (data.statusReason !== undefined) payload.status_reason = data.statusReason || null;
      const response = await api.put(`/parts/${id}`, payload);
      const raw = response.data?.data?.project || response.data?.data || response.data;
      return mapBackendProjectToFrontend(raw);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['parts', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdatePartStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const response = await api.patch(`/parts/${id}/status`, { status, reason });
      const raw = response.data?.data?.project || response.data?.data || response.data;
      return mapBackendProjectToFrontend(raw);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['parts', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDeletePart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/parts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};


export const useGetHolidays = () => {
  return useQuery<string[]>({
    queryKey: ['holidays'],
    queryFn: async () => {
      const response = await api.get('/projects/holidays/list');
      return response.data?.data?.holidays || [];
    },
  });
};

// ==========================================
// PENDING SCHEDULE REVIEW HOOKS
// ==========================================

export interface ProjectImpact {
  projectId: string;
  projectName: string;
  currentStartDate: string;
  currentEndDate: string;
  proposedStartDate: string;
  proposedEndDate: string;
  deliveryRisk: string;
  affectedTasksCount: number;
}

export interface TaskImpact {
  taskId: string;
  taskName: string;
  assignedEmployeeName: string | null;
  currentStatus: string;
  currentStartDate: string;
  currentEndDate: string;
  proposedStartDate: string;
  proposedEndDate: string;
  dependencyInfo: string | null;
}

export interface ImpactAnalysis {
  reviewId: string;
  reviewStatus: string;
  holidayId: string;
  holidayName: string;
  holidayDate: string;
  project: ProjectImpact | null;
  affectedTasks: TaskImpact[];
}

export const useGetImpactAnalysis = (reviewId: string) => {
  return useQuery<ImpactAnalysis>({
    queryKey: ['schedule-reviews', reviewId, 'impact-analysis'],
    queryFn: async () => {
      const response = await api.get(`/schedule-reviews/${reviewId}/impact-analysis`);
      const data = response.data?.data || {};
      const proj = data.project;
      const tasks = data.affected_tasks || [];

      return {
        reviewId: data.review_id,
        reviewStatus: data.review_status,
        holidayId: data.holiday_id,
        holidayName: data.holiday_name,
        holidayDate: data.holiday_date,
        project: proj ? {
          projectId: proj.project_id,
          projectName: proj.project_name,
          currentStartDate: proj.current_start_date,
          currentEndDate: proj.current_end_date,
          proposedStartDate: proj.proposed_start_date,
          proposedEndDate: proj.proposed_end_date,
          deliveryRisk: proj.delivery_risk,
          affectedTasksCount: proj.affected_tasks_count,
        } : null,
        affectedTasks: tasks.map((t: any): TaskImpact => ({
          taskId: t.task_id,
          taskName: t.task_name,
          assignedEmployeeName: t.assigned_employee_name,
          currentStatus: t.current_status,
          currentStartDate: t.current_start_date,
          currentEndDate: t.current_end_date,
          proposedStartDate: t.proposed_start_date,
          proposedEndDate: t.proposed_end_date,
          dependencyInfo: t.dependency_info,
        })),
      };
    },
    enabled: !!reviewId,
  });
};

export interface DateOverride {
  id: string;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
}

export interface ApplyReviewPayload {
  projectUpdates: DateOverride[];
  taskUpdates: DateOverride[];
}

export const useApplyScheduleReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, data }: { reviewId: string; data: ApplyReviewPayload }) => {
      const payload = {
        project_updates: data.projectUpdates.map(p => ({
          project_id: p.id,
          planned_start_date: p.plannedStartDate || null,
          planned_end_date: p.plannedEndDate || null,
        })),
        task_updates: data.taskUpdates.map(t => ({
          task_id: t.id,
          planned_start_date: t.plannedStartDate || null,
          planned_end_date: t.plannedEndDate || null,
        })),
      };
      const response = await api.post(`/schedule-reviews/${reviewId}/apply`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'pending-schedule-reviews'] });
    },
  });
};

export const useRejectScheduleReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, notes }: { reviewId: string; notes?: string }) => {
      const response = await api.post(`/schedule-reviews/${reviewId}/reject`, { notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'pending-schedule-reviews'] });
    },
  });
};


