import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';

// ==========================================
// TYPES
// ==========================================

export interface TicketCategory {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketType {
  id: string;
  categoryId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketPriority {
  id: string;
  name: string;
  isActive: boolean;
}

export interface TicketStatus {
  id: string;
  name: string;
  isActive: boolean;
}

export interface TicketCategoryHandler {
  id: string;
  categoryId: string;
  employeeId: string;
  employeeName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  filename: string;
  fileUrl: string;
  uploadedById?: string;
  createdAt: string;
}

export interface TicketComment {
  id: string;
  comment: string;
  commentedById: string;
  commentedByName?: string;
  createdAt: string;
}

export interface TicketHistory {
  id: string;
  action: string;
  fieldName?: string;
  previousValue?: string;
  newValue?: string;
  performedById: string;
  performedByName?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  categoryId: string;
  categoryName?: string;
  ticketTypeId: string;
  ticketTypeName?: string;
  subject: string;
  description: string;
  priorityId: string;
  priorityName?: string;
  statusId: string;
  statusName?: string;
  raisedById: string;
  raisedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetail extends Ticket {
  attachments: TicketAttachment[];
  comments: TicketComment[];
  history: TicketHistory[];
}

// ==========================================
// MAPPERS
// ==========================================

const mapCategoryFromBackend = (d: any): TicketCategory => ({
  id: d.id,
  name: d.name,
  isActive: d.is_active,
  createdAt: d.created_at,
  updatedAt: d.updated_at,
});

const mapTypeFromBackend = (d: any): TicketType => ({
  id: d.id,
  categoryId: d.category_id,
  name: d.name,
  isActive: d.is_active,
  createdAt: d.created_at,
  updatedAt: d.updated_at,
});

const mapPriorityFromBackend = (d: any): TicketPriority => ({
  id: d.id,
  name: d.name,
  isActive: d.is_active,
});

const mapStatusFromBackend = (d: any): TicketStatus => ({
  id: d.id,
  name: d.name,
  isActive: d.is_active,
});

const mapHandlerFromBackend = (d: any): TicketCategoryHandler => ({
  id: d.id,
  categoryId: d.category_id,
  employeeId: d.employee_id,
  employeeName: d.employee_name,
  isActive: d.is_active,
  createdAt: d.created_at,
});

const mapAttachmentFromBackend = (d: any): TicketAttachment => ({
  id: d.id,
  filename: d.filename,
  fileUrl: d.file_url,
  uploadedById: d.uploaded_by_id,
  createdAt: d.created_at,
});

const mapCommentFromBackend = (d: any): TicketComment => ({
  id: d.id,
  comment: d.comment,
  commentedById: d.commented_by_id,
  commentedByName: d.commented_by_name,
  createdAt: d.created_at,
});

const mapHistoryFromBackend = (d: any): TicketHistory => ({
  id: d.id,
  action: d.action,
  fieldName: d.field_name,
  previousValue: d.previous_value,
  newValue: d.new_value,
  performedById: d.performed_by_id,
  performedByName: d.performed_by_name,
  createdAt: d.created_at,
});

const mapTicketFromBackend = (d: any): Ticket => ({
  id: d.id,
  ticketNumber: d.ticket_number,
  categoryId: d.category_id,
  categoryName: d.category_name,
  ticketTypeId: d.ticket_type_id,
  ticketTypeName: d.ticket_type_name,
  subject: d.subject,
  description: d.description,
  priorityId: d.priority_id,
  priorityName: d.priority_name,
  statusId: d.status_id,
  statusName: d.status_name,
  raisedById: d.raised_by_id,
  raisedByName: d.raised_by_name,
  createdAt: d.created_at,
  updatedAt: d.updated_at,
});

const mapTicketDetailFromBackend = (d: any): TicketDetail => ({
  ...mapTicketFromBackend(d),
  attachments: Array.isArray(d.attachments) ? d.attachments.map(mapAttachmentFromBackend) : [],
  comments: Array.isArray(d.comments) ? d.comments.map(mapCommentFromBackend) : [],
  history: Array.isArray(d.history) ? d.history.map(mapHistoryFromBackend) : [],
});

// ==========================================
// REACT QUERY HOOKS: Settings
// ==========================================

export const useGetCategories = (isActive?: boolean) => {
  return useQuery<TicketCategory[]>({
    queryKey: ['ticket-categories', isActive],
    queryFn: async () => {
      const response = await api.get('/tickets/settings/categories', {
        params: isActive !== undefined ? { is_active: isActive } : undefined,
      });
      const items = response.data?.data?.categories || [];
      return items.map(mapCategoryFromBackend);
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; isActive: boolean }) => {
      const response = await api.post('/tickets/settings/categories', {
        name: data.name,
        is_active: data.isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, isActive }: { id: string; name: string; isActive: boolean }) => {
      const response = await api.put(`/tickets/settings/categories/${id}`, {
        name,
        is_active: isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/tickets/settings/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] });
    },
  });
};

export const useGetTicketTypes = (categoryId?: string, isActive?: boolean) => {
  return useQuery<TicketType[]>({
    queryKey: ['ticket-types', categoryId, isActive],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (categoryId) params.category_id = categoryId;
      if (isActive !== undefined) params.is_active = isActive;
      const response = await api.get('/tickets/settings/types', { params });
      const items = response.data?.data?.types || [];
      return items.map(mapTypeFromBackend);
    },
  });
};

export const useCreateTicketType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { categoryId: string; name: string; isActive: boolean }) => {
      const response = await api.post('/tickets/settings/types', {
        category_id: data.categoryId,
        name: data.name,
        is_active: data.isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
    },
  });
};

export const useUpdateTicketType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, categoryId, name, isActive }: { id: string; categoryId: string; name: string; isActive: boolean }) => {
      const response = await api.put(`/tickets/settings/types/${id}`, {
        category_id: categoryId,
        name,
        is_active: isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
    },
  });
};

export const useDeleteTicketType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/tickets/settings/types/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
    },
  });
};

export const useGetPriorities = (isActive?: boolean) => {
  return useQuery<TicketPriority[]>({
    queryKey: ['ticket-priorities', isActive],
    queryFn: async () => {
      const response = await api.get('/tickets/settings/priorities', {
        params: isActive !== undefined ? { is_active: isActive } : undefined,
      });
      const items = response.data?.data?.priorities || [];
      return items.map(mapPriorityFromBackend);
    },
  });
};

export const useCreatePriority = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/tickets/settings/priorities', null, { params: { name } });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-priorities'] });
    },
  });
};

export const useUpdatePriority = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, isActive }: { id: string; name: string; isActive: boolean }) => {
      const response = await api.put(`/tickets/settings/priorities/${id}`, null, {
        params: { name, is_active: isActive },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-priorities'] });
    },
  });
};

export const useDeletePriority = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/tickets/settings/priorities/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-priorities'] });
    },
  });
};

export const useGetStatuses = (isActive?: boolean) => {
  return useQuery<TicketStatus[]>({
    queryKey: ['ticket-statuses', isActive],
    queryFn: async () => {
      const response = await api.get('/tickets/settings/statuses', {
        params: isActive !== undefined ? { is_active: isActive } : undefined,
      });
      const items = response.data?.data?.statuses || [];
      return items.map(mapStatusFromBackend);
    },
  });
};

export const useCreateStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/tickets/settings/statuses', null, { params: { name } });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-statuses'] });
    },
  });
};

export const useUpdateStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, isActive }: { id: string; name: string; isActive: boolean }) => {
      const response = await api.put(`/tickets/settings/statuses/${id}`, null, {
        params: { name, is_active: isActive },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-statuses'] });
    },
  });
};

export const useDeleteStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/tickets/settings/statuses/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-statuses'] });
    },
  });
};

export const useGetCategoryHandlers = (categoryId?: string) => {
  return useQuery<TicketCategoryHandler[]>({
    queryKey: ['ticket-handlers', categoryId],
    queryFn: async () => {
      const params = categoryId ? { category_id: categoryId } : undefined;
      const response = await api.get('/tickets/settings/handlers', { params });
      const items = response.data?.data?.handlers || [];
      return items.map(mapHandlerFromBackend);
    },
  });
};

export const useCreateCategoryHandler = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ categoryId, employeeId }: { categoryId: string; employeeId: string }) => {
      const response = await api.post('/tickets/settings/handlers', {
        category_id: categoryId,
        employee_id: employeeId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-handlers'] });
    },
  });
};

export const useDeleteCategoryHandler = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/tickets/settings/handlers/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-handlers'] });
    },
  });
};

export const useUpdateCategoryHandlerStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; isActive: boolean }) => {
      const response = await api.put(`/tickets/settings/handlers/${data.id}`, null, {
        params: { is_active: data.isActive },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-handlers'] });
    },
  });
};

// ==========================================
// REACT QUERY HOOKS: Operations
// ==========================================

export const useGetMyTickets = () => {
  return useQuery<Ticket[]>({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const response = await api.get('/tickets/my');
      const items = response.data?.data?.tickets || [];
      return items.map(mapTicketFromBackend);
    },
  });
};

export const useRaiseTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      categoryId: string;
      ticketTypeId: string;
      subject: string;
      description: string;
      priorityId: string;
      attachments?: { filename: string; file_url: string }[];
    }) => {
      const payload = {
        category_id: data.categoryId,
        ticket_type_id: data.ticketTypeId,
        subject: data.subject,
        description: data.description,
        priority_id: data.priorityId,
        attachments: data.attachments || [],
      };
      const response = await api.post('/tickets/my', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    },
  });
};

export const useGetCategoryTickets = () => {
  return useQuery<Ticket[]>({
    queryKey: ['category-tickets'],
    queryFn: async () => {
      const response = await api.get('/tickets/category');
      const items = response.data?.data?.tickets || [];
      return items.map(mapTicketFromBackend);
    },
  });
};

export const useGetTicketDetails = (id: string) => {
  return useQuery<TicketDetail>({
    queryKey: ['ticket-details', id],
    queryFn: async () => {
      const response = await api.get(`/tickets/${id}`);
      const data = response.data?.data?.ticket;
      if (!data) throw new Error('Failed to retrieve ticket details');
      return mapTicketDetailFromBackend(data);
    },
    enabled: !!id,
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, statusId }: { ticketId: string; statusId: string }) => {
      const response = await api.put(`/tickets/${ticketId}/status`, null, {
        params: { status_id: statusId },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-details', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['category-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, comment }: { ticketId: string; comment: string }) => {
      const response = await api.post(`/tickets/${ticketId}/comments`, { comment });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-details', variables.ticketId] });
    },
  });
};

export const useCheckIsHandler = () => {
  return useQuery<boolean>({
    queryKey: ['check-ticket-handler'],
    queryFn: async () => {
      const response = await api.get('/tickets/is-handler');
      return !!response.data?.data?.is_handler;
    },
  });
};
