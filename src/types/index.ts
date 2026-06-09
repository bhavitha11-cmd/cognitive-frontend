export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Client {
  id: string;
  salutation?: string;
  name: string;
  email: string;
  password?: string;
  country: string;
  mobile: string;
  gender: string;
  language: string;
  category?: string;
  subCategory?: string;
  loginAllowed: boolean;
  receiveNotifications: boolean;
  profilePicture?: string;
  
  // Company Details
  companyName: string;
  website?: string;
  taxName?: string;
  taxNumber?: string; // GST/VAT
  officePhone?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  address?: string;
  
  // Extra CRM details
  skype?: string;
}

export interface Project {
  id: string;
  name: string;
  shortCode: string;
  startDate: string;
  deadline: string;
  clientId: string;
  department: string;
  category: string;
  summary: string;
  notes?: string;
  progress: number; // 0 - 100
  status: 'In Progress' | 'Finished' | 'On Hold' | 'Canceled';
}

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Completed';

export interface Task {
  id: string;
  title: string;
  projectId: string;
  assignees: string[]; // User IDs or Names
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  description: string;
  attachments?: string[]; // file names or paths
}

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
