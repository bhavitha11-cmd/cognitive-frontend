import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';

// ==========================================
// TYPES
// ==========================================

export interface ApprovalStep {
  id?: string;
  workflowId?: string;
  requesterRoleId: string;
  requesterRoleName?: string;
  level: number;
  approverRoleId: string;
  approverRoleName?: string;
  resolutionScope: 'REPORTING_HIERARCHY' | 'TEAM_ASSIGNMENT' | 'DEPARTMENT_ASSIGNMENT' | 'GLOBAL';
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  moduleType: string;
  version: number;
  approvalStrategy: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  steps?: ApprovalStep[];
}

export interface PendingApprovalInstance {
  id: string;
  moduleType: string;
  targetId: string;
  workflowId: string;
  workflowVersion: number;
  level: number;
  approverRoleId: string;
  approverRoleName: string;
  assignedApproverId?: string;
  assignedApproverName?: string;
  status: string;
  actionedById?: string;
  actionedByName?: string;
  actionedAt?: string;
  comments?: string;
  resolvedByScope?: string;
  resolvedApproverId?: string;
  resolvedApproverName?: string;
  resolutionTime?: string;
  requesterName?: string;
  requesterCode?: string;
  detailsSummary?: string;
}

// ==========================================
// MAPPERS
// ==========================================

const mapStepFromBackend = (d: any): ApprovalStep => ({
  id: d.id,
  workflowId: d.workflow_id,
  requesterRoleId: d.requester_role_id,
  requesterRoleName: d.requester_role_name,
  level: d.level,
  approverRoleId: d.approver_role_id,
  approverRoleName: d.approver_role_name,
  resolutionScope: d.resolution_scope,
});

const mapWorkflowFromBackend = (d: any): ApprovalWorkflow => ({
  id: d.id,
  name: d.name,
  moduleType: d.module_type,
  version: d.version,
  approvalStrategy: d.approval_strategy,
  isActive: d.is_active,
  createdAt: d.created_at,
  updatedAt: d.updated_at,
  steps: Array.isArray(d.steps) ? d.steps.map(mapStepFromBackend) : [],
});

const mapPendingInstanceFromBackend = (d: any): PendingApprovalInstance => ({
  id: d.id,
  moduleType: d.module_type,
  targetId: d.target_id,
  workflowId: d.workflow_id,
  workflowVersion: d.workflow_version,
  level: d.level,
  approverRoleId: d.approver_role_id,
  approverRoleName: d.approver_role_name,
  assignedApproverId: d.assigned_approver_id,
  assignedApproverName: d.assigned_approver_name,
  status: d.status,
  actionedById: d.actioned_by_id,
  actionedByName: d.actioned_by_name,
  actionedAt: d.actioned_at,
  comments: d.comments,
  resolvedByScope: d.resolved_by_scope,
  resolvedApproverId: d.resolved_approver_id,
  resolvedApproverName: d.resolved_approver_name,
  resolutionTime: d.resolution_time,
  requesterName: d.requester_name,
  requesterCode: d.requester_code,
  detailsSummary: d.details_summary,
});

// ==========================================
// HOOKS
// ==========================================

export const useGetWorkflows = (moduleType?: string) => {
  return useQuery<ApprovalWorkflow[]>({
    queryKey: ['approval-workflows', moduleType],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (moduleType) params.module_type = moduleType;
      const response = await api.get('/approvals/workflows', { params });
      const items = response.data?.data?.workflows || [];
      return items.map(mapWorkflowFromBackend);
    },
  });
};

export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; moduleType: string; approvalStrategy?: string }) => {
      const payload = {
        name: data.name,
        module_type: data.moduleType,
        approval_strategy: data.approvalStrategy || 'ANY_ONE',
      };
      const response = await api.post('/approvals/workflows', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
    },
  });
};

export const useConfigureWorkflowSteps = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, steps }: { workflowId: string; steps: ApprovalStep[] }) => {
      const payload = steps.map((s) => ({
        requester_role_id: s.requesterRoleId,
        level: s.level,
        approver_role_id: s.approverRoleId,
        resolution_scope: s.resolutionScope,
      }));
      const response = await api.post(`/approvals/workflows/${workflowId}/steps`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
    },
  });
};

export const useActivateWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workflowId: string) => {
      const response = await api.put(`/approvals/workflows/${workflowId}/activate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
    },
  });
};

export const useGetPendingApprovals = () => {
  return useQuery<PendingApprovalInstance[]>({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const response = await api.get('/approvals/pending');
      const items = response.data?.data?.pending || [];
      return items.map(mapPendingInstanceFromBackend);
    },
  });
};

export const useActionApprovalStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      instanceId,
      action,
      comments,
    }: {
      instanceId: string;
      action: 'APPROVED' | 'REJECTED';
      comments?: string;
    }) => {
      const payload = {
        action,
        comments: comments || null,
      };
      const response = await api.post(`/approvals/instances/${instanceId}/action`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests-all'] });
    },
  });
};

export const useGetApprovalHistory = (moduleType?: string) => {
  return useQuery<PendingApprovalInstance[]>({
    queryKey: ['approval-history', moduleType],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (moduleType) params.module_type = moduleType;
      const response = await api.get('/approvals/history', { params });
      const items = response.data?.data?.history || [];
      return items.map(mapPendingInstanceFromBackend);
    },
  });
};
