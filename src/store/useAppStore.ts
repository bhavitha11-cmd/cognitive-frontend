import { create } from 'zustand';
import type { Client, Project, Task, TimesheetEntry, AppSettings, TaskStatus } from '../types';
import { generateMockData } from '../utils/mockData';

interface AppState {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  timesheets: TimesheetEntry[];
  settings: AppSettings;
  sidebarCollapsed: boolean;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addClient: (client: Client) => void;
  addProject: (project: Project) => void;
  addTask: (task: Task) => void;
  logTime: (entry: TimesheetEntry) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateSettings: (section: keyof AppSettings, sectionData: any) => void;
}

const initialData = generateMockData();

const initialSettings: AppSettings = {
  companySettings: {
    companyName: 'Cognitive Technologies',
    contactPerson: 'Admin User',
    email: 'admin@cognitive.com',
    phone: '+1 555-0199',
    website: 'https://cognitive.com',
  },
  businessAddress: {
    address: '100 Innovation Way, Suite 400',
    city: 'San Francisco',
    state: 'California',
    postalCode: '94107',
    country: 'United States',
  },
  appSettings: {
    theme: 'light',
    sidebarCollapsed: false,
    language: 'English',
  },
  profileSettings: {
    name: 'Admin User',
    email: 'admin@cognitive.com',
    phone: '+1 555-0199',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  },
  notificationSettings: {
    emailNotifications: true,
    desktopNotifications: true,
    taskAssigned: true,
    projectDeadline: true,
  },
  currencySettings: {
    currencyCode: 'USD',
    currencySymbol: '$',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  taxSettings: {
    taxName: 'VAT',
    taxRate: 15,
    vatNumber: 'VAT-US-102030',
  },
  projectSettings: {
    allowClientToTask: false,
    defaultTaskStatus: 'To Do',
  },
  attendanceSettings: {
    officeStartTime: '09:00',
    officeEndTime: '18:00',
    halfDayHour: 4,
    lateMarkAfterMinutes: 15,
  },
};

export const useAppStore = create<AppState>((set) => ({
  clients: initialData.clients,
  projects: initialData.projects,
  tasks: initialData.tasks,
  timesheets: initialData.timesheets,
  settings: initialSettings,
  sidebarCollapsed: false,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  addClient: (client) =>
    set((state) => ({
      clients: [client, ...state.clients],
    })),

  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),

  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),

  logTime: (entry) =>
    set((state) => ({
      timesheets: [entry, ...state.timesheets],
    })),

  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    })),

  updateSettings: (section, sectionData) =>
    set((state) => ({
      settings: {
        ...state.settings,
        [section]: {
          ...state.settings[section],
          ...sectionData,
        },
      },
    })),
}));
