import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { DeviceHealth, ConnectionTestResult } from '../types/deviceHealth';

export const useGetAllHealth = (organizationId?: string) => {
  return useQuery<DeviceHealth[]>({
    queryKey: ['biometric-health', organizationId],
    queryFn: async () => {
      const params: any = {};
      if (organizationId) params.organization_id = organizationId;
      const response = await api.get('/biometric/health', { params });
      return response.data || [];
    },
  });
};

export const useGetDeviceHealth = (deviceId: string) => {
  return useQuery<DeviceHealth>({
    queryKey: ['biometric-health', deviceId],
    queryFn: async () => {
      const response = await api.get(`/biometric/health/${deviceId}`);
      return response.data;
    },
    enabled: !!deviceId,
  });
};

export const useTestConnection = () => {
  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await api.post(`/biometric/test/${deviceId}`);
      return response.data as ConnectionTestResult;
    },
  });
};
