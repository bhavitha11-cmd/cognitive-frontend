import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { EmployeeMapping } from '../types/employeeMapping';

export const useGetMappings = (deviceId?: string, employeeId?: string) => {
  return useQuery<EmployeeMapping[]>({
    queryKey: ['biometric-mappings', deviceId, employeeId],
    queryFn: async () => {
      const params: any = {};
      if (deviceId) params.device_id = deviceId;
      if (employeeId) params.employee_id = employeeId;
      const response = await api.get('/biometric/mappings', { params });
      return response.data?.mappings || [];
    },
  });
};

export const useCreateMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post('/biometric/mappings', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-mappings'] });
    },
  });
};

export const useBulkImportMappings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post('/biometric/mappings/bulk', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-mappings'] });
    },
  });
};

export const useAutoMapEmployees = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post('/biometric/mappings/auto', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-mappings'] });
    },
  });
};

export const useUpdateMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const response = await api.put(`/biometric/mappings/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-mappings'] });
    },
  });
};

export const useDeleteMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/biometric/mappings/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-mappings'] });
    },
  });
};
