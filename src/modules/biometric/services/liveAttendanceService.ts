import { useQuery } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { LiveAttendanceRecord } from '../types/liveAttendance';

export const useGetLiveAttendance = (organizationId?: string, departmentId?: string) => {
  return useQuery<LiveAttendanceRecord[]>({
    queryKey: ['biometric-live-attendance', organizationId, departmentId],
    queryFn: async () => {
      const params: any = {};
      if (organizationId) params.organization_id = organizationId;
      if (departmentId) params.department_id = departmentId;
      const response = await api.get('/biometric/live', { params });
      return response.data || [];
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });
};
