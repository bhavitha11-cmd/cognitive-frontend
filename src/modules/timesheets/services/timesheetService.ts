import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { TimeEntry, TimeEntryCreate, TimeEntryListResponse } from '../types';

// ==========================================
// MAPPERS
// ==========================================

const mapBackendTimeEntryToFrontend = (e: any): TimeEntry => ({
  id: e.id,
  employeeId: e.employee_id,
  employeeName: e.employee_name || undefined,
  employeeCode: e.employee_code || undefined,
  taskId: e.task_id,
  taskCode: e.task_code || undefined,
  taskTitle: e.task_title || undefined,
  projectId: e.project_id,
  projectName: e.project_name || undefined,
  date: e.date,
  hoursSpent: e.hours_spent ?? 0,
  description: e.description || undefined,
  entryType: e.entry_type || 'REGULAR',
  isBillable: e.is_billable ?? true,
  status: e.status || 'DRAFT',
  submittedAt: e.submitted_at || undefined,
  approvedBy: e.approved_by || undefined,
  approvedByName: e.approved_by_name || undefined,
  approvedAt: e.approved_at || undefined,
  rejectionReason: e.rejection_reason || undefined,
  createdAt: e.created_at || undefined,
});

const mapTimeEntryCreateToBackend = (data: TimeEntryCreate) => ({
  employee_id: data.employeeId || undefined,
  task_id: data.taskId,
  date: data.date,
  hours_spent: data.hoursSpent,
  description: data.description || null,
  entry_type: data.entryType || 'REGULAR',
  is_billable: data.isBillable !== undefined ? data.isBillable : true,
});

// ==========================================
// PARAMS INTERFACE
// ==========================================

export interface TimeEntryListParams {
  skip?: number;
  limit?: number;
  employeeId?: string;
  taskId?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

// ==========================================
// QUERY KEYS
// ==========================================

export const timeEntryKeys = {
  all: ['time-entries'] as const,
  lists: () => [...timeEntryKeys.all, 'list'] as const,
  list: (params?: TimeEntryListParams) => [...timeEntryKeys.lists(), params] as const,
  detail: (id: string) => [...timeEntryKeys.all, 'detail', id] as const,
  mySheet: (dateFrom: string, dateTo: string) =>
    [...timeEntryKeys.all, 'my-sheet', dateFrom, dateTo] as const,
};

// ==========================================
// HOOKS
// ==========================================

export const useGetTimeEntries = (params?: TimeEntryListParams) => {
  return useQuery<TimeEntryListResponse>({
    queryKey: timeEntryKeys.list(params),
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      if (params?.skip !== undefined) queryParams.skip = params.skip;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.employeeId) queryParams.employee_id = params.employeeId;
      if (params?.taskId) queryParams.task_id = params.taskId;
      if (params?.projectId) queryParams.project_id = params.projectId;
      if (params?.dateFrom) queryParams.date_from = params.dateFrom;
      if (params?.dateTo) queryParams.date_to = params.dateTo;
      if (params?.status) queryParams.status = params.status;

      const response = await api.get('/time-entries', { params: queryParams });
      const data = response.data?.data;
      const rawEntries = data?.entries || data?.time_entries || data || [];
      const entries = Array.isArray(rawEntries)
        ? rawEntries.map(mapBackendTimeEntryToFrontend)
        : [];

      return {
        entries,
        total: data?.total ?? entries.length,
        skip: data?.skip ?? 0,
        limit: data?.limit ?? entries.length,
      };
    },
  });
};

export const useGetTimeEntry = (id: string) => {
  return useQuery<TimeEntry>({
    queryKey: timeEntryKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/time-entries/${id}`);
      const raw = response.data?.data?.entry || response.data?.data || response.data;
      return mapBackendTimeEntryToFrontend(raw);
    },
    enabled: !!id,
  });
};

export const useGetMyTimesheet = (dateFrom: string, dateTo: string) => {
  return useQuery<TimeEntryListResponse>({
    queryKey: timeEntryKeys.mySheet(dateFrom, dateTo),
    queryFn: async () => {
      const response = await api.get('/time-entries/my-timesheet', {
        params: { date_from: dateFrom, date_to: dateTo },
      });
      const data = response.data?.data?.summary || response.data?.data || {};
      const rawEntries = data?.entries || data?.time_entries || [];
      const entries = Array.isArray(rawEntries)
        ? rawEntries.map(mapBackendTimeEntryToFrontend)
        : [];

      return {
        entries,
        total: data?.total ?? entries.length,
        skip: data?.skip ?? 0,
        limit: data?.limit ?? entries.length,
      };
    },
    enabled: !!dateFrom && !!dateTo,
  });
};

export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TimeEntryCreate) => {
      const payload = mapTimeEntryCreateToBackend(data);
      const response = await api.post('/time-entries', payload);
      const raw = response.data?.data?.entry || response.data?.data || response.data;
      return mapBackendTimeEntryToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
    },
  });
};

export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TimeEntryCreate> }) => {
      const payload: Record<string, any> = {};
      if (data.taskId !== undefined) payload.task_id = data.taskId;
      if (data.date !== undefined) payload.date = data.date;
      if (data.hoursSpent !== undefined) payload.hours_spent = data.hoursSpent;
      if (data.description !== undefined) payload.description = data.description || null;
      if (data.entryType !== undefined) payload.entry_type = data.entryType;
      if (data.isBillable !== undefined) payload.is_billable = data.isBillable;

      const response = await api.put(`/time-entries/${id}`, payload);
      const raw = response.data?.data?.entry || response.data?.data || response.data;
      return mapBackendTimeEntryToFrontend(raw);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.detail(variables.id) });
    },
  });
};

export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/time-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
    },
  });
};

export const useSubmitTimeEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/time-entries/${id}/submit`);
      const raw = response.data?.data?.entry || response.data?.data || response.data;
      return mapBackendTimeEntryToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
    },
  });
};

export const useApproveTimeEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/time-entries/${id}/approve`);
      const raw = response.data?.data?.entry || response.data?.data || response.data;
      return mapBackendTimeEntryToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
    },
  });
};

export const useRejectTimeEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post(`/time-entries/${id}/reject`, { reason });
      const raw = response.data?.data?.entry || response.data?.data || response.data;
      return mapBackendTimeEntryToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
    },
  });
};
