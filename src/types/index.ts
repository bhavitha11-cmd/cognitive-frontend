// Re-export module-level types so the rest of the app can import from '@/types'
export type { Client, ClientCreate, ClientUpdate } from '../modules/clients/types';
export type { Project, ProjectCreate, ParentProject, ParentProjectCreate } from '../modules/projects/types';
export type { Task, TaskCreate, TaskAssignment, ScopeOfWork } from '../modules/tasks/types';

// ---------------------------------------------------------------------------
// Auth / User
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

// ---------------------------------------------------------------------------
// Timesheets
// ---------------------------------------------------------------------------

export interface TimesheetEntry {
  id: string;
  projectId: string;
  taskId: string;
  employeeId: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  memo: string;
  totalHours: number;
}

// ---------------------------------------------------------------------------
// App Settings
// ---------------------------------------------------------------------------

export interface AppSettings {
  companySettings: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    website: string;
  };
  businessAddress: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  appSettings: {
    theme: 'light' | 'dark' | 'system';
    sidebarCollapsed: boolean;
    language: string;
  };
  profileSettings: {
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  notificationSettings: {
    emailNotifications: boolean;
    desktopNotifications: boolean;
    taskAssigned: boolean;
    projectDeadline: boolean;
  };
  currencySettings: {
    currencyCode: string;
    currencySymbol: string;
    thousandSeparator: string;
    decimalSeparator: string;
  };
  taxSettings: {
    taxName: string;
    taxRate: number;
    vatNumber: string;
  };
  projectSettings: {
    allowClientToTask: boolean;
    defaultTaskStatus: string;
  };
  attendanceSettings: {
    officeStartTime: string;
    officeEndTime: string;
    halfDayHour: number;
    lateMarkAfterMinutes: number;
  };
}
