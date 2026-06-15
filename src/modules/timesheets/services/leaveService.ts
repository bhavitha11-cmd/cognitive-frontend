import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type {
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestCreate,
} from '../types';

// ==========================================
// MAPPERS
// ==========================================

const mapLeaveType = (d: any): LeaveType => ({
  id: d.id,
  code: d.code,
  name: d.name,
  daysPerYear: d.days_per_year,
  isPaid: d.is_paid,
  isCarryForward: d.is_carry_forward,
  maxCarryForwardDays: d.max_carry_forward_days ?? 0,
  requiresApproval: d.requires_approval,
  color: d.color ?? '#1976d2',
  description: d.description || undefined,
  isActive: d.is_active,
});

const mapLeaveBalance = (d: any): LeaveBalance => ({
  id: d.id,
  employeeId: d.employee_id,
  employeeName: d.employee_name || undefined,
  leaveTypeId: d.leave_type_id,
  leaveTypeName: d.leave_type_name || undefined,
  leaveTypeCode: d.leave_type_code || undefined,
  year: d.year,
  totalAllowed: d.total_allowed,
  used: d.used,
  carriedForward: d.carried_forward ?? 0,
  remaining: d.remaining,
});

const mapLeaveRequest = (d: any): LeaveRequest => ({
  id: d.id,
  employeeId: d.employee_id,
  employeeName: d.employee_name || undefined,
  employeeCode: d.employee_code || undefined,
  leaveTypeId: d.leave_type_id,
  leaveTypeName: d.leave_type_name || undefined,
  leaveTypeCode: d.leave_type_code || undefined,
  fromDate: d.from_date,
  toDate: d.to_date,
  totalDays: d.total_days,
  reason: d.reason || undefined,
  status: d.status,
  appliedAt: d.applied_at || undefined,
  approvedBy: d.approved_by || undefined,
  approvedAt: d.approved_at || undefined,
  rejectionReason: d.rejection_reason || undefined,
  hrNotes: d.hr_notes || undefined,
});

const mapLeaveRequestToBackend = (data: LeaveRequestCreate) => ({
  leave_type_id: data.leaveTypeId,
  from_date: data.fromDate,
  to_date: data.toDate,
  reason: data.reason || null,
});

// ==========================================
// HOOKS
// ==========================================

export const useGetLeaveTypes = () => {
  return useQuery<LeaveType[]>({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const response = await api.get('/leaves/types');
      const items = response.data?.data?.leave_types || response.data?.data || response.data || [];
      return Array.isArray(items) ? items.map(mapLeaveType) : [];
    },
  });
};

export const useGetMyLeaveBalances = (year?: number) => {
  return useQuery<LeaveBalance[]>({
    queryKey: ['leave-balances-my', year],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (year) params.year = year;
      const response = await api.get('/leaves/balances', { params });
      const items = response.data?.data?.balances || response.data?.data || response.data || [];
      return Array.isArray(items) ? items.map(mapLeaveBalance) : [];
    },
  });
};

export const useGetLeaveRequests = (params?: { status?: string; year?: number }) => {
  return useQuery<LeaveRequest[]>({
    queryKey: ['leave-requests-my', params],
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      if (params?.status) queryParams.status = params.status;
      if (params?.year) queryParams.year = params.year;
      const response = await api.get('/leaves/requests/my', { params: queryParams });
      const items = response.data?.data?.requests || response.data?.data || response.data || [];
      return Array.isArray(items) ? items.map(mapLeaveRequest) : [];
    },
  });
};

export const useGetAllLeaveRequests = (params?: {
  status?: string;
  year?: number;
  employeeId?: string;
}) => {
  return useQuery<LeaveRequest[]>({
    queryKey: ['leave-requests-all', params],
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      if (params?.status) queryParams.status = params.status;
      if (params?.year) queryParams.year = params.year;
      if (params?.employeeId) queryParams.employee_id = params.employeeId;
      const response = await api.get('/leaves/requests', { params: queryParams });
      const items = response.data?.data?.requests || response.data?.data || response.data || [];
      return Array.isArray(items) ? items.map(mapLeaveRequest) : [];
    },
  });
};

export const useApplyLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: LeaveRequestCreate) => {
      const payload = mapLeaveRequestToBackend(data);
      const response = await api.post('/leaves/requests', payload);
      return mapLeaveRequest(response.data?.data?.request || response.data?.data || response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests-my'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances-my'] });
    },
  });
};

export const useCancelLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/leaves/requests/${id}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests-my'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances-my'] });
    },
  });
};

export const useApproveLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
      rejectionReason,
    }: {
      id: string;
      action: 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
    }) => {
      const payload: Record<string, any> = { status: action };
      if (rejectionReason) payload.rejection_reason = rejectionReason;
      const response = await api.patch(`/leaves/requests/${id}`, payload);
      return mapLeaveRequest(response.data?.data?.request || response.data?.data || response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests-all'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances-my'] });
    },
  });
};

export const useGetLeaveBalance = (employeeId: string, year?: number) => {
  return useQuery<LeaveBalance[]>({
    queryKey: ['leave-balance-employee', employeeId, year],
    enabled: !!employeeId,
    queryFn: async () => {
      const params: Record<string, any> = { employee_id: employeeId };
      if (year) params.year = year;
      const response = await api.get('/leaves/balances', { params });
      const items = response.data?.data?.balances || response.data?.data || response.data || [];
      return Array.isArray(items) ? items.map(mapLeaveBalance) : [];
    },
  });
};
