import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Employee, Role, Department, AttendanceSettings, Team } from '../types';

interface HRState {
  employees: Employee[];
  roles: Role[];
  departments: Department[];
  teams: Team[];
  attendanceSettings: AttendanceSettings;

  // Role Actions
  setRoles: (roles: Role[]) => void;
  addRole: (role: Omit<Role, 'id' | 'createdDate'>) => void;
  updateRole: (id: string, role: Partial<Role>) => void;
  deleteRole: (id: string) => void;

  // Department Actions
  setDepartments: (departments: Department[]) => void;

  // Team Actions
  setTeams: (teams: Team[]) => void;

  // Employee Actions
  setEmployees: (employees: Employee[]) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deactivateEmployee: (id: string) => void;
  bulkDeleteEmployees: (ids: string[]) => void;
  bulkDeactivateEmployees: (ids: string[]) => void;

  // Attendance Actions
  updateAttendanceSettings: (settings: Partial<AttendanceSettings>) => void;
}

// Initial Attendance Settings
const initialAttendanceSettings: AttendanceSettings = {
  officeStartTime: '09:00',
  officeEndTime: '18:00',
  halfDayHour: 4,
  lateMarkAfterMinutes: 15,
};

export const useHRStore = create<HRState>()(
  persist(
    (set) => ({
      employees: [],
      roles: [],
      departments: [],
      teams: [],
      attendanceSettings: initialAttendanceSettings,

      // Role Actions
      setRoles: (roles) => set({ roles }),
      addRole: (role) =>
        set((state) => {
          const newRole: Role = {
            ...role,
            id: `role-${Date.now()}`,
            createdDate: new Date().toISOString().split('T')[0],
          };
          return { roles: [newRole, ...state.roles] };
        }),

      updateRole: (id, roleData) =>
        set((state) => ({
          roles: state.roles.map((r) => (r.id === id ? { ...r, ...roleData } : r)),
        })),

      deleteRole: (id) =>
        set((state) => ({
          roles: state.roles.filter((r) => r.id !== id),
          employees: state.employees.map((emp) => ({
            ...emp,
            roleIds: emp.roleIds.filter((rid) => rid !== id),
          })),
        })),

      // Department Actions
      setDepartments: (departments) => set({ departments }),

      // Team Actions
      setTeams: (teams) => set({ teams }),

      // Employee Actions
      setEmployees: (employees) => set({ employees }),
      addEmployee: (employee) =>
        set((state) => {
          const formattedNum = String(state.employees.length + 1).padStart(3, '0');
          const newEmployee: Employee = {
            ...employee,
            id: `EMP-${formattedNum}`,
          };
          return { employees: [...state.employees, newEmployee] };
        }),

      updateEmployee: (id, employeeData) =>
        set((state) => ({
          employees: state.employees.map((e) => (e.id === id ? { ...e, ...employeeData } : e)),
        })),

      deactivateEmployee: (id) =>
        set((state) => ({
          employees: state.employees.map((e) => (e.id === id ? { ...e, status: 'SUSPENDED' as const } : e)),
        })),

      bulkDeleteEmployees: (ids) =>
        set((state) => ({
          employees: state.employees.filter((e) => !ids.includes(e.id)),
        })),

      bulkDeactivateEmployees: (ids) =>
        set((state) => ({
          employees: state.employees.map((e) => (ids.includes(e.id) ? { ...e, status: 'SUSPENDED' as const } : e)),
        })),

      // Attendance Actions
      updateAttendanceSettings: (settingsData) =>
        set((state) => ({
          attendanceSettings: { ...state.attendanceSettings, ...settingsData },
        })),
    }),
    {
      name: 'cognitive-hr-store',
    }
  )
);
