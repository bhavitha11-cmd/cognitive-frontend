export type RoleStatus = 'Active' | 'Inactive';

export type EmployeeStatus =
  | 'ACTIVE'
  | 'PROBATION'
  | 'NOTICE_PERIOD'
  | 'ON_LEAVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'RESIGNED'
  | 'TERMINATED';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type GenderType = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

// Display label helpers
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
};

export const GENDER_LABELS: Record<GenderType, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: 'Prefer Not to Say',
};

export interface RolePermission {
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_activate: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  reportsTo: string;
  status: RoleStatus;
  createdDate: string;
  isSystemRole?: boolean;
  permissions?: RolePermission[];
}

export interface Employee {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName?: string;
  officialEmail?: string;
  personalEmail?: string;
  email: string;
  mobile: string;
  phone?: string;
  alternatePhone?: string;
  gender: GenderType;
  dateOfBirth: string;
  profilePhoto?: string;

  // Organization Info
  departmentId: string;
  designationId?: string;
  designationName?: string;
  roleIds: string[];
  reportingManagerId?: string;
  dateOfJoining: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;

  // Authentication Info
  username: string;
  password?: string;
  sendWelcomeEmail: boolean;

  // Emergency & Address
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  isDepartmentHead?: boolean;
  teamId?: string;
  teamName?: string;
  roleInTeam?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headEmployeeId?: string;
  departmentHeadName?: string;
  employeeCount?: number;
  status: 'Active' | 'Inactive';
  createdDate?: string;
}

export interface Team {
  id: string;
  team_name: string;
  team_code: string;
  description?: string;
  department_id?: string;
  department_name?: string;
  member_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  team_lead_name?: string;
  team_lead_id?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  role_in_team: 'LEAD' | 'MEMBER' | string;
  is_primary_team: boolean;
  joined_at: string;
  left_at?: string;
}

export interface Designation {
  id: string;
  name: string;
  code: string;
  description?: string;
  departmentId?: string;
  departmentName?: string;
  level?: number;
  status: 'Active' | 'Inactive';
  createdDate?: string;
}

export interface AttendanceSettings {
  officeStartTime: string;
  officeEndTime: string;
  halfDayHour: number;
  lateMarkAfterMinutes: number;
}
