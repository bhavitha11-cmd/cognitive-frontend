import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHRStore } from '../store/useHRStore';
import { api } from '../../../utils/api';
import type { Employee, Role, Department, Designation, Team, TeamMember } from '../types';

// ==========================================
// MAPPERS
// ==========================================

const mapBackendRoleToFrontend = (backendRole: any): Role => ({
  id: backendRole.id,
  name: backendRole.name,
  description: backendRole.description || '',
  reportsTo: backendRole.parent_role_id || '',
  status: backendRole.is_active ? 'Active' : 'Inactive',
  createdDate: backendRole.created_at?.split('T')[0] || '',
  isSystemRole: backendRole.is_system_role,
  permissions: backendRole.permissions || [],
});

const mapFrontendRoleToBackend = (frontendRole: Omit<Role, 'id' | 'createdDate'>) => ({
  name: frontendRole.name,
  description: frontendRole.description,
  parent_role_id: frontendRole.reportsTo || null,
  is_active: frontendRole.status === 'Active',
});

const mapBackendDepartmentToFrontend = (d: any): Department => ({
  id: d.id,
  name: d.name,
  code: d.code,
  description: d.description || '',
  headEmployeeId: d.department_head_id || undefined,
  departmentHeadName: d.department_head_name || undefined,
  employeeCount: d.employee_count || 0,
  status: d.is_active ? 'Active' : 'Inactive',
  createdDate: d.created_at?.split('T')[0] || '',
});

const mapFrontendDepartmentToBackend = (d: Omit<Department, 'id' | 'createdDate'>) => ({
  name: d.name,
  code: d.code,
  description: d.description || '',
  department_head_id: d.headEmployeeId || null,
  is_active: d.status === 'Active',
});

const mapBackendDesignationToFrontend = (d: any): Designation => ({
  id: d.id,
  name: d.name,
  code: d.code,
  description: d.description || '',
  departmentId: d.department_id || undefined,
  departmentName: d.department_name || undefined,
  level: d.level || undefined,
  status: d.is_active ? 'Active' : 'Inactive',
  createdDate: d.created_at?.split('T')[0] || '',
});

const mapBackendEmployeeToFrontend = (e: any): Employee => ({
  id: e.id,
  firstName: e.first_name,
  middleName: e.middle_name || undefined,
  lastName: e.last_name,
  displayName: e.display_name || undefined,
  officialEmail: e.official_email || undefined,
  personalEmail: e.personal_email || undefined,
  email: e.email,
  mobile: e.mobile_number || '',
  phone: e.phone || undefined,
  alternatePhone: e.alternate_phone || undefined,
  gender: e.gender || 'MALE',
  dateOfBirth: e.date_of_birth || '',
  profilePhoto: e.profile_photo_url || '',
  departmentId: e.department_id || '',
  designationId: e.designation_id || undefined,
  designationName: e.designation_name || undefined,
  roleIds: e.role_ids || [],
  reportingManagerId: e.reporting_manager_id || undefined,
  dateOfJoining: e.date_of_joining || '',
  employmentType: e.employment_type || 'FULL_TIME',
  status: e.account_status || 'ACTIVE',
  username: e.username,
  sendWelcomeEmail: false,
  emergencyContactName: e.emergency_contact_name || undefined,
  emergencyContactPhone: e.emergency_contact_phone || undefined,
  address: e.address || undefined,
  isDepartmentHead: e.is_department_head || false,
  teamId: e.team_id || undefined,
  teamName: e.team_name || undefined,
  roleInTeam: e.role_in_team || undefined,
});

const mapFrontendEmployeeToBackend = (data: any) => ({
  first_name: data.firstName,
  middle_name: data.middleName || null,
  last_name: data.lastName,
  display_name: data.displayName || null,
  official_email: data.officialEmail || null,
  personal_email: data.personalEmail || null,
  email: data.email,
  phone: data.phone || null,
  mobile_number: data.mobile || null,
  alternate_phone: data.alternatePhone || null,
  gender: data.gender || null,
  date_of_birth: data.dateOfBirth || null,
  profile_photo_url: data.profilePhoto || null,
  department_id: data.departmentId || null,
  designation_id: data.designationId || null,
  role_ids: data.roleIds || [],
  reporting_manager_id: data.reportingManagerId || null,
  date_of_joining: data.dateOfJoining || null,
  employment_type: data.employmentType || null,
  account_status: data.status || 'ACTIVE',
  username: data.username,
  password: data.password || undefined,
  emergency_contact_name: data.emergencyContactName || null,
  emergency_contact_phone: data.emergencyContactPhone || null,
  address: data.address || null,
  is_department_head: data.isDepartmentHead !== undefined ? data.isDepartmentHead : false,
  team_id: data.teamId || null,
  is_team_lead: data.isTeamLead !== undefined ? data.isTeamLead : false,
});

// ==========================================
// 1. ROLES
// ==========================================

export const useGetRoles = () => {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      const mapped = response.data.data?.roles || response.data || [];
      const roles = Array.isArray(mapped) ? mapped.map(mapBackendRoleToFrontend) : [];
      useHRStore.getState().setRoles(roles);
      return roles;
    },
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newRole: Omit<Role, 'id' | 'createdDate'>) => {
      const payload = mapFrontendRoleToBackend(newRole);
      const response = await api.post('/roles', payload);
      return mapBackendRoleToFrontend(response.data?.data?.role || response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Role> }) => {
      const payload: any = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description;
      if (data.reportsTo !== undefined) payload.parent_role_id = data.reportsTo || null;
      if (data.status !== undefined) payload.is_active = data.status === 'Active';
      const response = await api.put(`/roles/${id}`, payload);
      return mapBackendRoleToFrontend(response.data?.data?.role || response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/roles/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useSetRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, permissions }: { id: string; permissions: Record<string, any> }) => {
      const permissionsList = Object.entries(permissions).map(([module_name, perms]) => ({
        module_name,
        can_view: perms.can_view || false,
        can_create: perms.can_create || false,
        can_edit: perms.can_edit || false,
        can_delete: perms.can_delete || false,
        can_approve: perms.can_approve || false,
        can_export: perms.can_export || false,
      }));
      const response = await api.put(`/roles/${id}/permissions`, { permissions: permissionsList });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

// ==========================================
// 2. DEPARTMENTS
// ==========================================

export const useGetDepartments = () => {
  return useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      const items = response.data?.data?.departments || [];
      const mapped = items.map(mapBackendDepartmentToFrontend);
      useHRStore.getState().setDepartments(mapped);
      return mapped;
    },
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Department, 'id' | 'createdDate'>) => {
      const payload = mapFrontendDepartmentToBackend(data);
      const res = await api.post('/departments', payload);
      return mapBackendDepartmentToFrontend(res.data?.data?.department || res.data?.data || res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Department> }) => {
      const payload: any = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.code !== undefined) payload.code = data.code;
      if (data.description !== undefined) payload.description = data.description;
      if (data.headEmployeeId !== undefined) payload.department_head_id = data.headEmployeeId || null;
      if (data.status !== undefined) payload.is_active = data.status === 'Active';
      const res = await api.put(`/departments/${id}`, payload);
      return mapBackendDepartmentToFrontend(res.data?.data?.department || res.data?.data || res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

// ==========================================
// 3. DESIGNATIONS
// ==========================================

export const useGetDesignations = (departmentId?: string) => {
  return useQuery<Designation[]>({
    queryKey: ['designations', departmentId],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (departmentId) params.department_id = departmentId;
      const response = await api.get('/designations', { params });
      const items = response.data?.data?.designations || [];
      return items.map(mapBackendDesignationToFrontend);
    },
  });
};

export const useCreateDesignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Designation, 'id' | 'createdDate'>) => {
      const payload = {
        name: data.name,
        code: data.code,
        description: data.description || null,
        department_id: data.departmentId || null,
        level: data.level || null,
        is_active: data.status === 'Active',
      };
      const response = await api.post('/designations', payload);
      return mapBackendDesignationToFrontend(
        response.data?.data?.designation || response.data?.data || response.data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
    },
  });
};

export const useUpdateDesignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Designation> }) => {
      const payload: Record<string, any> = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.code !== undefined) payload.code = data.code;
      if (data.description !== undefined) payload.description = data.description;
      if (data.departmentId !== undefined) payload.department_id = data.departmentId || null;
      if (data.level !== undefined) payload.level = data.level || null;
      if (data.status !== undefined) payload.is_active = data.status === 'Active';
      const response = await api.put(`/designations/${id}`, payload);
      return mapBackendDesignationToFrontend(
        response.data?.data?.designation || response.data?.data || response.data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
    },
  });
};

export const useDeleteDesignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/designations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

// ==========================================
// 4. EMPLOYEES
// ==========================================

export interface EmployeeListParams {
  search?: string;
  skip?: number;
  limit?: number;
  departmentId?: string;
  accountStatus?: string;
}

export const useGetEmployees = (params?: EmployeeListParams) => {
  return useQuery<Employee[]>({
    queryKey: ['employees', params],
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      if (params?.search) queryParams.search = params.search;
      if (params?.skip !== undefined) queryParams.skip = params.skip;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.departmentId) queryParams.department_id = params.departmentId;
      if (params?.accountStatus) queryParams.account_status = params.accountStatus;
      const response = await api.get('/employees', { params: queryParams });
      const items = response.data?.data?.employees || [];
      const mapped = items.map(mapBackendEmployeeToFrontend);
      useHRStore.getState().setEmployees(mapped);
      return mapped;
    },
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newEmp: any) => {
      const payload = mapFrontendEmployeeToBackend(newEmp);
      const response = await api.post('/employees', payload);
      return mapBackendEmployeeToFrontend(response.data?.data?.employee);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const payload: any = {};
      if (data.firstName !== undefined) payload.first_name = data.firstName;
      if (data.middleName !== undefined) payload.middle_name = data.middleName || null;
      if (data.lastName !== undefined) payload.last_name = data.lastName;
      if (data.displayName !== undefined) payload.display_name = data.displayName || null;
      if (data.officialEmail !== undefined) payload.official_email = data.officialEmail || null;
      if (data.personalEmail !== undefined) payload.personal_email = data.personalEmail || null;
      if (data.email !== undefined) payload.email = data.email;
      if (data.mobile !== undefined) payload.mobile_number = data.mobile;
      if (data.phone !== undefined) payload.phone = data.phone || null;
      if (data.alternatePhone !== undefined) payload.alternate_phone = data.alternatePhone || null;
      if (data.gender !== undefined) payload.gender = data.gender;
      if (data.dateOfBirth !== undefined) payload.date_of_birth = data.dateOfBirth;
      if (data.profilePhoto !== undefined) payload.profile_photo_url = data.profilePhoto || null;
      if (data.departmentId !== undefined) payload.department_id = data.departmentId || null;
      if (data.designationId !== undefined) payload.designation_id = data.designationId || null;
      if (data.roleIds !== undefined) payload.role_ids = data.roleIds;
      if (data.reportingManagerId !== undefined) payload.reporting_manager_id = data.reportingManagerId || null;
      if (data.dateOfJoining !== undefined) payload.date_of_joining = data.dateOfJoining;
      if (data.employmentType !== undefined) payload.employment_type = data.employmentType;
      if (data.status !== undefined) payload.account_status = data.status;
      if (data.username !== undefined) payload.username = data.username;
      if (data.password) payload.password = data.password;
      if (data.emergencyContactName !== undefined) payload.emergency_contact_name = data.emergencyContactName || null;
      if (data.emergencyContactPhone !== undefined) payload.emergency_contact_phone = data.emergencyContactPhone || null;
      if (data.address !== undefined) payload.address = data.address || null;
      if (data.isDepartmentHead !== undefined) payload.is_department_head = data.isDepartmentHead;
      if (data.teamId !== undefined) payload.team_id = data.teamId || null;
      if (data.isTeamLead !== undefined) payload.is_team_lead = data.isTeamLead;
      const response = await api.put(`/employees/${id}`, payload);
      return mapBackendEmployeeToFrontend(response.data?.data?.employee);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useDeactivateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/employees/${id}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useBulkDeactivateEmployees = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await api.post('/employees/bulk-deactivate', { ids });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useBulkDeleteEmployees = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await api.post('/employees/bulk-delete', { ids });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

// ==========================================
// OFFBOARDING
// ==========================================

export const useOffboardCheck = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/employees/${id}/offboard/check`);
      return response.data?.data;
    },
  });
};

export const useOffboardConfirm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, finalStatus }: { id: string; finalStatus?: string }) => {
      const response = await api.post(`/employees/${id}/offboard/confirm`, null, {
        params: { final_status: finalStatus || 'RESIGNED' },
      });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useTransferReports = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newManagerId, employeeIds }: { id: string; newManagerId: string; employeeIds: string[] }) => {
      const response = await api.post(`/employees/${id}/transfer-reports`, {
        new_manager_id: newManagerId,
        employee_ids: employeeIds,
      });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useTransferTeams = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newLeadId, teamIds }: { id: string; newLeadId: string; teamIds: string[] }) => {
      const response = await api.post(`/employees/${id}/transfer-teams`, {
        new_lead_id: newLeadId,
        team_ids: teamIds,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useTransferDepartments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newHeadId, departmentIds }: { id: string; newHeadId: string; departmentIds: string[] }) => {
      const response = await api.post(`/employees/${id}/transfer-departments`, {
        new_head_id: newHeadId,
        department_ids: departmentIds,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useGetRoleHistory = () => {
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await api.get(`/employees/${employeeId}/role-history`);
      return response.data?.data?.history || [];
    },
  });
};

export const useGetReportingHistory = () => {
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await api.get(`/employees/${employeeId}/reporting-history`);
      return response.data?.data?.history || [];
    },
  });
};

// ==========================================
// 5. TEAMS
// ==========================================

export const useGetTeams = () => {
  return useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await api.get('/teams');
      return response.data?.data?.teams || [];
    },
  });
};

export const useGetTeam = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.get(`/teams/${id}`);
      return response.data?.data;
    },
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Team>) => {
      const response = await api.post('/teams', data);
      return response.data?.data?.team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Team> }) => {
      const response = await api.put(`/teams/${id}`, data);
      return response.data?.data?.team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useAddTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, data }: { teamId: string; data: Partial<TeamMember> }) => {
      const response = await api.post(`/teams/${teamId}/members`, data);
      return response.data?.data?.member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, memberId }: { teamId: string; memberId: string }) => {
      await api.delete(`/teams/${teamId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

// ==========================================
// 6. ORGANIZATION TREE
// ==========================================

export const useGetOrgTree = () => {
  return useQuery({
    queryKey: ['org-tree'],
    queryFn: async () => {
      const response = await api.get('/organization/tree');
      return response.data?.data?.tree || [];
    },
  });
};

export const useGetRoleTree = () => {
  return useQuery({
    queryKey: ['role-tree'],
    queryFn: async () => {
      const response = await api.get('/organization/tree/role');
      return response.data?.data?.tree || [];
    },
  });
};

// ==========================================
// 7. AUDIT LOGS
// ==========================================

export const useGetAuditLogs = () => {
  return useMutation({
    mutationFn: async (params?: { entity_type?: string; entity_id?: string; action?: string; page?: number; size?: number }) => {
      const response = await api.get('/audit-logs', { params });
      return response.data?.data;
    },
  });
};
