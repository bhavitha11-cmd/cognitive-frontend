import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { Project, ProjectCreate, ProjectUpdate, ProjectListParams } from '../types';

// ==========================================
// MAPPERS
// ==========================================

const mapBackendProjectToFrontend = (p: any): Project => ({
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

const mapFrontendProjectToBackend = (data: ProjectCreate) => ({
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

// ==========================================
// HOOKS
// ==========================================

export const useGetProjects = (params?: ProjectListParams) => {
  return useQuery<{ projects: Project[]; total: number }>({
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
      const projects = (data.projects || []).map(mapBackendProjectToFrontend);
      return { projects, total: data.total ?? projects.length };
    },
  });
};

export const useGetProject = (id: string) => {
  return useQuery<Project>({
    queryKey: ['projects', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      const raw = response.data?.data?.project || response.data?.data || response.data;
      return mapBackendProjectToFrontend(raw);
    },
    enabled: !!id,
  });
};

export const useGetProjectStats = (id: string) => {
  return useQuery<any>({
    queryKey: ['projects', id, 'stats'],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}/stats`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProjectCreate) => {
      const payload = mapFrontendProjectToBackend(data);
      const response = await api.post('/projects', payload);
      const raw = response.data?.data?.project || response.data?.data || response.data;
      return mapBackendProjectToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
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
      const response = await api.put(`/projects/${id}`, payload);
      const raw = response.data?.data?.project || response.data?.data || response.data;
      return mapBackendProjectToFrontend(raw);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
    },
  });
};

export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const response = await api.patch(`/projects/${id}/status`, { status, reason });
      const raw = response.data?.data?.project || response.data?.data || response.data;
      return mapBackendProjectToFrontend(raw);
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

export const useGetHolidays = () => {
  return useQuery<string[]>({
    queryKey: ['holidays'],
    queryFn: async () => {
      const response = await api.get('/projects/holidays/list');
      return response.data?.data?.holidays || [];
    },
  });
};

