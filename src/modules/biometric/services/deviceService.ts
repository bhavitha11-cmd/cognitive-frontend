import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { BiometricDevice, DeviceListResponse, DeviceCreatePayload } from '../types/device';

export const useGetDevices = (filters?: any) => {
  return useQuery<DeviceListResponse>({
    queryKey: ['biometric-devices', filters],
    queryFn: async () => {
      const response = await api.get('/biometric/devices', { params: filters });
      return response.data || { devices: [], total: 0, page: 1, page_size: 10 };
    },
  });
};

export const useGetDevice = (deviceId: string) => {
  return useQuery<BiometricDevice>({
    queryKey: ['biometric-devices', deviceId],
    queryFn: async () => {
      const response = await api.get(`/biometric/devices/${deviceId}`);
      return response.data;
    },
    enabled: !!deviceId,
  });
};

export const useCreateDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DeviceCreatePayload) => {
      const response = await api.post('/biometric/devices', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
    },
  });
};

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<DeviceCreatePayload> }) => {
      const response = await api.put(`/biometric/devices/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
    },
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/biometric/devices/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
    },
  });
};
