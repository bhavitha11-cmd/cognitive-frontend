import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { SyncHistory } from '../types/syncHistory';

export const useTriggerSync = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await api.post(`/biometric/sync/${deviceId}`);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-sync-history'] });
    },
  });
};

export const useGetSyncHistory = (deviceId?: string) => {
  return useQuery<SyncHistory[]>({
    queryKey: ['biometric-sync-history', deviceId],
    queryFn: async () => {
      const params: any = {};
      if (deviceId) params.device_id = deviceId;
      const response = await api.get('/biometric/sync/history', { params });
      return response.data?.data?.history || [];
    },
  });
};

export const useRetrySyncHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (historyId: string) => {
      const response = await api.post(`/biometric/sync/${historyId}/retry`);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-sync-history'] });
    },
  });
};

export const useGetSyncConfig = (deviceId: string) => {
  return useQuery<any>({
    queryKey: ['biometric-sync-config', deviceId],
    queryFn: async () => {
      const response = await api.get(`/biometric/sync/config/${deviceId}`);
      return response.data;
    },
    enabled: !!deviceId,
  });
};

export const useUpdateSyncConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ deviceId, payload }: { deviceId: string; payload: any }) => {
      const response = await api.put(`/biometric/sync/config/${deviceId}`, payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['biometric-sync-config', variables.deviceId] });
    },
  });
};
