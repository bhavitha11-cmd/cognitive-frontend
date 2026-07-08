import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';
import { useHRStore } from '../modules/hr/store/useHRStore';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PermissionDetail {
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_activate: boolean;
}

export interface FeaturePermissionDetail {
  feature_key: string;
  feature_name: string;
  module_key: string;
  module_name: string;
  route: string | null;
  menu_visible: boolean;
  view_scope: string;
  create_scope: string;
  update_scope: string;
  delete_scope: string;
}

export interface ModulePermissionDetail {
  module_key: string;
  module_name: string;
  icon: string | null;
  display_order: number;
  features: FeaturePermissionDetail[];
}

export interface AuthUser {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  employeeCode: string;
  username: string;
  departmentId?: string;
  teamId?: string;
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
  modulePermissions: ModulePermissionDetail[];
  dataAccessLevel: DataAccessLevel;
  isAuthenticated: boolean;

  // Computed
  isSuperAdmin: () => boolean;
  hasPermission: (moduleOrFeature: string, action: string) => boolean;
  hasModuleAccess: (moduleOrFeature: string) => boolean;

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
      modulePermissions: [],
      dataAccessLevel: 'SELF' as DataAccessLevel,
      isAuthenticated: false,

      // ── Computed helpers ──────────────────────────────────────────────────

      isSuperAdmin: () => {
        const { roleCodes } = get();
        return roleCodes.some((code) => SUPER_ADMIN_CODES.has(code));
      },

      hasPermission: (moduleOrFeature: string, action: string) => {
        const state = get();
        // Super admins have all permissions
        if (state.isSuperAdmin()) return true;

        // Legacy module name mappings
        const LEGACY_MODULE_MAP: Record<string, string> = {
          'HR': 'employees',
          'Clients': 'clients',
          'Finance': 'settings',
          'Projects': 'projects',
          'Inventory': 'settings',
          'Settings': 'settings',
          'Reports': 'reports',
          'Timesheets': 'work_center',
          'Tasks': 'tasks',
          'Attendance': 'attendance',
          'Leave': 'my_leaves',
          'Analytics': 'advanced_dashboard',
          'Dashboard': 'my_dashboard',
          'CalendarSettings': 'calendar_configuration',
          'TaskTemplate': 'task_title_library',
          'Productivity': 'work_center',
        };

        const targetKey = LEGACY_MODULE_MAP[moduleOrFeature] || moduleOrFeature;
        
        // Normalize action to scope field
        const ACTION_MAP: Record<string, string> = {
          'can_view': 'view_scope',
          'view': 'view_scope',
          'can_create': 'create_scope',
          'create': 'create_scope',
          'can_edit': 'update_scope',
          'edit': 'update_scope',
          'update': 'update_scope',
          'can_activate': 'delete_scope',
          'activate': 'delete_scope',
          'delete': 'delete_scope',
        };
        const scopeField = ACTION_MAP[action] || 'view_scope';

        // Scan module permissions for a matching feature
        for (const mod of state.modulePermissions) {
          const feature = mod.features.find(
            (f) => f.feature_key.toLowerCase() === targetKey.toLowerCase()
          );
          if (feature) {
            const scope = (feature as any)[scopeField];
            return scope && scope !== 'NONE';
          }
        }

        // Fallback to legacy permissions list if modulePermissions is not yet loaded
        const actionKey = action.startsWith('can_') ? action : `can_${action}`;
        const legacyPerm = state.permissions.find(
          (p) => p.module_name.toLowerCase() === moduleOrFeature.toLowerCase()
        );
        if (legacyPerm) {
          return !!(legacyPerm as any)[actionKey];
        }

        return false;
      },

      hasModuleAccess: (moduleOrFeature: string) => {
        return get().hasPermission(moduleOrFeature, 'view');
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
          departmentId: employee.department_id || employee.departmentId || profile?.department_id || profile?.departmentId || undefined,
          teamId: employee.team_id || employee.teamId || profile?.team_id || profile?.teamId || undefined,
        };

        const roles: string[] = profile?.roles || [];
        const roleCodes: string[] = profile?.role_codes || [];
        const permissions: PermissionDetail[] = profile?.permissions || [];
        const modulePermissions: ModulePermissionDetail[] = profile?.module_permissions || [];
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
          modulePermissions,
          dataAccessLevel,
          isAuthenticated: true,
        });
      },

      logout: () => {
        // Clear the legacy/back-compat auth keys...
        localStorage.removeItem('cognitive_token');
        localStorage.removeItem('cognitive_user');
        localStorage.removeItem('cognitive_profile');

        // Reset in-memory auth state (persisted `cognitive-auth` is rewritten
        // by the persist middleware from this cleared state).
        set({
          token: null,
          user: null,
          roles: [],
          roleCodes: [],
          permissions: [],
          modulePermissions: [],
          dataAccessLevel: 'SELF',
          isAuthenticated: false,
        });

        // Prevent cross-user data leaks on a shared browser:
        // wipe the persisted HR store (contains employee/PII) ...
        try {
          const hr = useHRStore.getState();
          hr.setEmployees([]);
          hr.setRoles([]);
          hr.setDepartments([]);
          hr.setTeams([]);
          // Drop the persisted `cognitive-hr-store` blob from localStorage too.
          useHRStore.persist?.clearStorage?.();
        } catch (e) {
          console.error('Failed to clear HR store on logout:', e);
        }

        // ...and clear the React Query cache (any cached PII / list responses).
        // Imported dynamically to avoid a circular import with App.tsx
        // (App -> router -> ProtectedRoute -> useAuthStore).
        void import('../App')
          .then(({ queryClient }) => queryClient.clear())
          .catch((e) => console.error('Failed to clear query cache on logout:', e));
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
            departmentId: employee.department_id || employee.departmentId || profile?.department_id || profile?.departmentId || undefined,
            teamId: employee.team_id || employee.teamId || profile?.team_id || profile?.teamId || undefined,
          };

          set({
            token,
            user,
            roles: profile?.roles || [],
            roleCodes: profile?.role_codes || [],
            permissions: profile?.permissions || [],
            modulePermissions: profile?.module_permissions || [],
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
              username: profile.username || '',
              employeeCode: profile.employee_code || '',
              departmentId: profile.department_id || profile.departmentId || undefined,
              teamId: profile.team_id || profile.teamId || undefined,
            };

            localStorage.setItem('cognitive_profile', JSON.stringify(profile));

            set({
              user,
              roles: profile.roles || [],
              roleCodes: profile.role_codes || [],
              permissions: profile.permissions || [],
              modulePermissions: profile.module_permissions || [],
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
        modulePermissions: state.modulePermissions,
        dataAccessLevel: state.dataAccessLevel,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
