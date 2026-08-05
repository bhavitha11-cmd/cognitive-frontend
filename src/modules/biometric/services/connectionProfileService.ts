import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { ConnectionProfile } from '../types/connectionProfile';

export const useGetProfiles = (deviceId: string) => {
  return useQuery<ConnectionProfile[]>({
    queryKey: ['biometric-connections', deviceId],
    queryFn: async () => {
      const response = await api.get('/biometric/connections', { params: { device_id: deviceId } });
      return response.data || [];
    },
    enabled: !!deviceId,
  });
};

export const useCreateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post('/biometric/connections', payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['biometric-connections', variables.device_id] });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const response = await api.put(`/biometric/connections/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-connections'] });
    },
  });
};

export const useDeleteProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/biometric/connections/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-connections'] });
    },
  });
};
