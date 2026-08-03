import { useQuery } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { BiometricLog, BiometricLogFilters } from '../types/biometricLog';

export const useGetBiometricLogs = (filters: BiometricLogFilters) => {
  return useQuery<{ logs: BiometricLog[]; total: number; page: number; page_size: number }>({
    queryKey: ['biometric-logs', filters],
    queryFn: async () => {
      const response = await api.get('/biometric/logs', { params: filters });
      return response.data?.data || { logs: [], total: 0, page: 1, page_size: 10 };
    },
  });
};

export const exportBiometricLogsCsv = async (filters: BiometricLogFilters) => {
  const response = await api.get('/biometric/logs/export', {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};
