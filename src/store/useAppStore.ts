import { create } from 'zustand';
import type { TimesheetEntry, AppSettings } from '../types';

// ---------------------------------------------------------------------------
// State Shape
// ---------------------------------------------------------------------------

interface AppState {
  /**
   * Timesheets are still managed locally (Coming-Soon module, no API yet).
   */
  timesheets: TimesheetEntry[];

  /**
   * Global app settings (company info, profile, notifications, etc.)
   */
  settings: AppSettings;

  /**
   * Sidebar collapse state.
   */
  sidebarCollapsed: boolean;

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  /** Log a timesheet entry (used by the Coming-Soon LogTime page). */
  logTime: (entry: TimesheetEntry) => void;

  /** Persist a settings section update (used by SettingsPage). */
  updateSettings: (section: keyof AppSettings, sectionData: any) => void;
}

// ---------------------------------------------------------------------------
// Default App Settings
// ---------------------------------------------------------------------------

const initialSettings: AppSettings = {
  companySettings: {
    companyName: 'Cognitive Technologies',
    contactPerson: 'Admin User',
    email: 'admin@cognitive.com',
    phone: '+91 999-0000',
    website: 'https://cognitive.com',
  },
  businessAddress: {
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  },
  appSettings: {
    theme: 'light',
    sidebarCollapsed: false,
    language: 'English',
  },
  profileSettings: {
    name: 'Admin User',
    email: 'admin@cognitive.com',
    phone: '+91 999-0000',
    avatar: undefined,
  },
  notificationSettings: {
    emailNotifications: true,
    desktopNotifications: true,
    taskAssigned: true,
    projectDeadline: true,
  },
  currencySettings: {
    currencyCode: 'INR',
    currencySymbol: '₹',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  taxSettings: {
    taxName: 'GST',
    taxRate: 18,
    vatNumber: '',
  },
  projectSettings: {
    allowClientToTask: false,
    defaultTaskStatus: 'NOT_STARTED',
  },
  attendanceSettings: {
    officeStartTime: '09:00',
    officeEndTime: '18:00',
    halfDayHour: 4,
    lateMarkAfterMinutes: 15,
  },
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState>((set) => ({
  timesheets: [],
  settings: initialSettings,
  sidebarCollapsed: false,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) =>
    set({ sidebarCollapsed: collapsed }),

  logTime: (entry) =>
    set((state) => ({
      timesheets: [entry, ...state.timesheets],
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
