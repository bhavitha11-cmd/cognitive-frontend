import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type {
  TaskTemplate,
  TaskTemplateCreate,
  TaskTemplateUpdate,
  TaskTemplateSearchItem,
  TaskTemplateListResponse,
} from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapBackendToFrontend = (t: any): TaskTemplate => ({
  id: t.id,
  templateCode: t.template_code,
  title: t.title,
  description: t.description || undefined,
  isActive: t.is_active ?? true,
  createdBy: t.created_by || undefined,
  updatedBy: t.updated_by || undefined,
  createdAt: t.created_at,
  updatedAt: t.updated_at,
});

const mapFrontendToBackend = (data: TaskTemplateCreate) => ({
  title: data.title,
  description: data.description || null,
});

export interface TaskTemplateListParams {
  skip?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: string;
}

export const useGetTaskTemplates = (params?: TaskTemplateListParams) => {
  return useQuery<TaskTemplateListResponse>({
    queryKey: ['task-templates', params],
    queryFn: async () => {
      const queryParams: Record<string, unknown> = {};
      if (params?.skip !== undefined) queryParams.skip = params.skip;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;
      if (params?.isActive !== undefined) queryParams.is_active = params.isActive;
      if (params?.sortBy) queryParams.sort_by = params.sortBy;
      if (params?.sortOrder) queryParams.sort_order = params.sortOrder;

      const response = await api.get('/task-templates', { params: queryParams });
      const data = response.data?.data || response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any[] = data?.templates || [];
      return {
        templates: raw.map(mapBackendToFrontend),
        total: data?.total ?? raw.length,
        skip: data?.skip ?? 0,
        limit: data?.limit ?? raw.length,
      };
    },
  });
};

export const useSearchTaskTemplates = (q: string) => {
  return useQuery<TaskTemplateSearchItem[]>({
    queryKey: ['task-templates', 'search', q],
    queryFn: async () => {
      const response = await api.get('/task-templates/search', {
        params: q ? { q } : {},
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any[] = response.data?.data?.templates || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return raw.map((t: any) => ({
        id: t.id,
        templateCode: t.template_code,
        title: t.title,
        description: t.description || undefined,
      }));
    },
    enabled: true,
    staleTime: 30_000,
  });
};

export const useGetTaskTemplate = (id: string) => {
  return useQuery<TaskTemplate>({
    queryKey: ['task-templates', id],
    queryFn: async () => {
      const response = await api.get(`/task-templates/${id}`);
      const raw = response.data?.data?.template || response.data?.data || response.data;
      return mapBackendToFrontend(raw);
    },
    enabled: !!id,
  });
};

export const useCreateTaskTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TaskTemplateCreate) => {
      const payload = mapFrontendToBackend(data);
      const response = await api.post('/task-templates', payload);
      const raw = response.data?.data?.template || response.data?.data || response.data;
      return mapBackendToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
    },
  });
};

export const useUpdateTaskTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaskTemplateUpdate }) => {
      const payload: Record<string, unknown> = {};
      if (data.title !== undefined) payload.title = data.title;
      if (data.description !== undefined) payload.description = data.description || null;
      if (data.isActive !== undefined) payload.is_active = data.isActive;
      const response = await api.put(`/task-templates/${id}`, payload);
      const raw = response.data?.data?.template || response.data?.data || response.data;
      return mapBackendToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
    },
  });
};

export const useDeleteTaskTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/task-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
    },
  });
};

export const useBulkStatusTaskTemplates = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, isActive }: { ids: string[]; isActive: boolean }) => {
      const response = await api.patch('/task-templates/bulk-status', { ids, is_active: isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
    },
  });
};
