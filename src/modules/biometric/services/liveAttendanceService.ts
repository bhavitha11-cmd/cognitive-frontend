import { useQuery } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type { LiveAttendanceRecord } from '../types/liveAttendance';

export const useGetLiveAttendance = (
  organizationId?: string,
  departmentId?: string,
  targetDate?: string,
) => {
  return useQuery<LiveAttendanceRecord[]>({
    queryKey: ['biometric-live-attendance', organizationId, departmentId, targetDate],
    queryFn: async () => {
      const params: any = {};
      if (organizationId) params.organization_id = organizationId;
      if (departmentId) params.department_id = departmentId;
      if (targetDate) params.target_date = targetDate;
      const response = await api.get('/biometric/live', { params });
      return response.data || [];
    },
    refetchInterval: 3000,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};
