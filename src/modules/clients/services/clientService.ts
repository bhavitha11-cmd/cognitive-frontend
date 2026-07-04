import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { Client, ClientCreate, ClientUpdate, ClientListResponse } from '../types';

// ==========================================
// MAPPERS
// ==========================================

const mapBackendClientToFrontend = (c: any): Client => ({
  id: c.id,
  clientCode: c.client_code || c.clientCode || '',
  name: c.name,
  industry: c.industry || undefined,
  contactPerson: c.contact_person || undefined,
  contactEmail: c.contact_email || undefined,
  contactPhone: c.contact_phone || undefined,
  alternatePhone: c.alternate_phone || undefined,
  additionalContacts: c.additional_contacts || [],
  country: c.country || undefined,
  address: c.address || undefined,
  notes: c.notes || undefined,
  isActive: c.is_active ?? true,
  status: c.status || 'Active',
  deactivationReason: c.deactivation_reason || undefined,
  deactivatedAt: c.deactivated_at || undefined,
  deactivatedBy: c.deactivated_by || undefined,
  projectCount: c.project_count ?? 0,
  createdAt: c.created_at || undefined,
});

const mapFrontendClientToBackend = (data: ClientCreate) => ({
  client_code: data.clientCode,
  name: data.name,
  industry: data.industry || null,
  contact_person: data.contactPerson || null,
  contact_email: data.contactEmail || null,
  contact_phone: data.contactPhone || null,
  alternate_phone: data.alternatePhone || null,
  additional_contacts: data.additionalContacts || [],
  country: data.country || null,
  address: data.address || null,
  notes: data.notes || null,
});

// ==========================================
// QUERY PARAMS
// ==========================================

export interface ClientListParams {
  skip?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

// ==========================================
// HOOKS
// ==========================================

export const useGetClients = (params?: ClientListParams) => {
  return useQuery<ClientListResponse>({
    queryKey: ['clients', params],
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      if (params?.skip !== undefined) queryParams.skip = params.skip;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;
      if (params?.isActive !== undefined) queryParams.is_active = params.isActive;

      const response = await api.get('/clients', { params: queryParams });
      const data = response.data?.data || response.data;
      const rawClients = data?.clients || [];

      return {
        clients: rawClients.map(mapBackendClientToFrontend),
        total: data?.total ?? rawClients.length,
        skip: data?.skip ?? 0,
        limit: data?.limit ?? rawClients.length,
      };
    },
  });
};

// ==========================================
// LOOKUP (lightweight, auth-only reference endpoint — no Clients:view needed)
// ==========================================

export interface ClientLookupItem {
  id: string;
  name: string;
  clientCode: string;
}

export const useGetClientsLookup = () => {
  return useQuery<ClientLookupItem[]>({
    queryKey: ['clients-lookup'],
    queryFn: async () => {
      const response = await api.get('/clients/lookup');
      const data = response.data?.data || response.data;
      const items = data?.clients || data || [];
      return items.map((c: any) => ({
        id: c.id,
        name: c.name,
        clientCode: c.client_code || c.clientCode || '',
      }));
    },
  });
};

export const useGetClient = (id: string) => {
  return useQuery<Client>({
    queryKey: ['clients', id],
    queryFn: async () => {
      const response = await api.get(`/clients/${id}`);
      const raw = response.data?.data?.client || response.data?.data || response.data;
      return mapBackendClientToFrontend(raw);
    },
    enabled: !!id,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ClientCreate) => {
      const payload = mapFrontendClientToBackend(data);
      const response = await api.post('/clients', payload);
      const raw = response.data?.data?.client || response.data?.data || response.data;
      return mapBackendClientToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClientUpdate }) => {
      const payload: Record<string, any> = {};
      if (data.clientCode !== undefined) payload.client_code = data.clientCode || null;
      if (data.name !== undefined) payload.name = data.name;
      if (data.industry !== undefined) payload.industry = data.industry || null;
      if (data.contactPerson !== undefined) payload.contact_person = data.contactPerson || null;
      if (data.contactEmail !== undefined) payload.contact_email = data.contactEmail || null;
      if (data.contactPhone !== undefined) payload.contact_phone = data.contactPhone || null;
      if (data.alternatePhone !== undefined) payload.alternate_phone = data.alternatePhone || null;
      if (data.additionalContacts !== undefined) payload.additional_contacts = data.additionalContacts || [];
      if (data.country !== undefined) payload.country = data.country || null;
      if (data.address !== undefined) payload.address = data.address || null;
      if (data.notes !== undefined) payload.notes = data.notes || null;
      if (data.isActive !== undefined) payload.is_active = data.isActive;
      if (data.status !== undefined) payload.status = data.status;
      if (data.deactivationReason !== undefined) payload.deactivation_reason = data.deactivationReason || null;

      const response = await api.put(`/clients/${id}`, payload);
      const raw = response.data?.data?.client || response.data?.data || response.data;
      return mapBackendClientToFrontend(raw);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};
