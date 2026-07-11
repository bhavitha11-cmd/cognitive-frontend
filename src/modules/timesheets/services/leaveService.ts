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
  requiresDocument: d.requires_document,
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
  approvalSteps: d.approval_steps || [],
  documentUrl: d.document_url || undefined,
  isHalfDay: d.is_half_day,
  halfDaySession: d.half_day_session || undefined,
});

const mapLeaveRequestToBackend = (data: LeaveRequestCreate) => ({
  leave_type_id: data.leaveTypeId,
  from_date: data.fromDate,
  to_date: data.toDate,
  reason: data.reason || null,
  document_url: data.documentUrl || null,
  is_half_day: data.isHalfDay ?? false,
  half_day_session: data.halfDaySession || null,
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
      const payload = {
        action: action,
        rejection_reason: rejectionReason || null,
        hr_notes: null,
      };
      const response = await api.post(`/leaves/requests/${id}/approve`, payload);
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

export const useUploadLeaveDocument = () => {
  return useMutation({
    mutationFn: async (file: globalThis.File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/leaves/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data?.data?.url as string;
    },
  });
};

export const useCreateLeaveType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<LeaveType, 'id' | 'isActive'>) => {
      const payload = {
        code: data.code,
        name: data.name,
        days_per_year: data.daysPerYear,
        is_paid: data.isPaid,
        is_carry_forward: data.isCarryForward,
        max_carry_forward_days: data.maxCarryForwardDays,
        requires_approval: data.requiresApproval,
        requires_document: data.requiresDocument,
        color: data.color,
        description: data.description || null,
      };
      const response = await api.post('/leaves/types', payload);
      return mapLeaveType(response.data?.data?.leave_type || response.data?.data || response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types-all'] });
    },
  });
};

export const useUpdateLeaveType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<LeaveType> & { id: string }) => {
      const payload: Record<string, any> = {};
      if (data.code !== undefined) payload.code = data.code;
      if (data.name !== undefined) payload.name = data.name;
      if (data.daysPerYear !== undefined) payload.days_per_year = data.daysPerYear;
      if (data.isPaid !== undefined) payload.is_paid = data.isPaid;
      if (data.isCarryForward !== undefined) payload.is_carry_forward = data.isCarryForward;
      if (data.maxCarryForwardDays !== undefined) payload.max_carry_forward_days = data.maxCarryForwardDays;
      if (data.requiresApproval !== undefined) payload.requires_approval = data.requiresApproval;
      if (data.requiresDocument !== undefined) payload.requires_document = data.requiresDocument;
      if (data.color !== undefined) payload.color = data.color;
      if (data.description !== undefined) payload.description = data.description || null;
      if (data.isActive !== undefined) payload.is_active = data.isActive;

      const response = await api.put(`/leaves/types/${id}`, payload);
      return mapLeaveType(response.data?.data?.leave_type || response.data?.data || response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types-all'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances-my'] });
    },
  });
};
