import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PermissionDetail {
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_export: boolean;
}

export interface AuthUser {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  employeeCode: string;
  username: string;
}

export type DataAccessLevel = 'FULL' | 'MANAGED' | 'TEAM' | 'SELF';

const SUPER_ADMIN_CODES = new Set([
  'ADMIN', 'CEO', 'CHIEF_EXECUTIVE_OFFICER', 'ADMINISTRATOR',
]);

// ── Store Interface ──────────────────────────────────────────────────────────

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  roles: string[];
  roleCodes: string[];
  permissions: PermissionDetail[];
  dataAccessLevel: DataAccessLevel;
  isAuthenticated: boolean;

  // Computed
  isSuperAdmin: () => boolean;
  hasPermission: (module: string, action: string) => boolean;
  hasModuleAccess: (module: string) => boolean;

  // Actions
  login: (token: string, employee: any, profile: any) => void;
  logout: () => void;
  hydrateFromStorage: () => void;
  refreshProfile: () => Promise<void>;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      roles: [],
      roleCodes: [],
      permissions: [],
      dataAccessLevel: 'SELF' as DataAccessLevel,
      isAuthenticated: false,

      // ── Computed helpers ──────────────────────────────────────────────────

      isSuperAdmin: () => {
        const { roleCodes } = get();
        return roleCodes.some((code) => SUPER_ADMIN_CODES.has(code));
      },

      hasPermission: (module: string, action: string) => {
        const state = get();
        // Super admins have all permissions
        if (state.isSuperAdmin()) return true;

        const actionKey = action.startsWith('can_') ? action : `can_${action}`;
        const perm = state.permissions.find(
          (p) => p.module_name.toLowerCase() === module.toLowerCase()
        );
        return perm ? !!(perm as any)[actionKey] : false;
      },

      hasModuleAccess: (module: string) => {
        return get().hasPermission(module, 'view');
      },

      // ── Actions ────────────────────────────────────────────────────────────

      login: (token: string, employee: any, profile: any) => {
        const user: AuthUser = {
          firstName: employee.first_name || employee.firstName || '',
          lastName: employee.last_name || employee.lastName || '',
          email: employee.email || '',
          employeeId: employee.id || profile?.id || profile?.employee_id || '',
          employeeCode: employee.employee_code || '',
          username: employee.username || '',
        };

        const roles: string[] = profile?.roles || [];
        const roleCodes: string[] = profile?.role_codes || [];
        const permissions: PermissionDetail[] = profile?.permissions || [];
        const dataAccessLevel: DataAccessLevel = profile?.data_access_level || 'SELF';

        // Backward compatibility: write to old localStorage keys
        localStorage.setItem('cognitive_token', token);
        localStorage.setItem('cognitive_user', JSON.stringify(employee));
        localStorage.setItem('cognitive_profile', JSON.stringify(profile));

        set({
          token,
          user,
          roles,
          roleCodes,
          permissions,
          dataAccessLevel,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem('cognitive_token');
        localStorage.removeItem('cognitive_user');
        localStorage.removeItem('cognitive_profile');

        set({
          token: null,
          user: null,
          roles: [],
          roleCodes: [],
          permissions: [],
          dataAccessLevel: 'SELF',
          isAuthenticated: false,
        });
      },

      hydrateFromStorage: () => {
        const token = localStorage.getItem('cognitive_token');
        if (!token) return;

        const userStr = localStorage.getItem('cognitive_user');
        const profileStr = localStorage.getItem('cognitive_profile');

        let employee: any = null;
        let profile: any = null;

        try { employee = userStr ? JSON.parse(userStr) : null; } catch { /* ignore */ }
        try { profile = profileStr ? JSON.parse(profileStr) : null; } catch { /* ignore */ }

        if (employee) {
          const user: AuthUser = {
            firstName: employee.first_name || employee.firstName || '',
            lastName: employee.last_name || employee.lastName || '',
            email: employee.email || '',
            employeeId: employee.id || profile?.id || profile?.employee_id || '',
            employeeCode: employee.employee_code || '',
            username: employee.username || '',
          };

          set({
            token,
            user,
            roles: profile?.roles || [],
            roleCodes: profile?.role_codes || [],
            permissions: profile?.permissions || [],
            dataAccessLevel: profile?.data_access_level || 'SELF',
            isAuthenticated: true,
          });
        }
      },

      refreshProfile: async () => {
        try {
          const response = await api.get('/auth/me');
          const profile = response.data?.data;
          if (profile) {
            const user: AuthUser = {
              firstName: profile.first_name || '',
              lastName: profile.last_name || '',
              email: profile.email || '',
              employeeId: profile.id || profile.employee_id || '',
              employeeCode: profile.employee_code || '',
              username: profile.username || '',
            };

            localStorage.setItem('cognitive_profile', JSON.stringify(profile));

            set({
              user,
              roles: profile.roles || [],
              roleCodes: profile.role_codes || [],
              permissions: profile.permissions || [],
              dataAccessLevel: profile.data_access_level || 'SELF',
            });
          }
        } catch (error) {
          console.error('Failed to refresh profile:', error);
        }
      },
    }),
    {
      name: 'cognitive-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        roles: state.roles,
        roleCodes: state.roleCodes,
        permissions: state.permissions,
        dataAccessLevel: state.dataAccessLevel,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
