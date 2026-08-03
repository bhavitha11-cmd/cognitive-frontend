import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  Tooltip,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

// Sidebar Icons
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CalendarViewWeekOutlinedIcon from '@mui/icons-material/CalendarViewWeekOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';

import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useGetActiveBreak } from '../modules/timesheets/services/workSessionService';
import { Alert } from '@mui/material';

const drawerWidth = 260;
const collapsedDrawerWidth = 70;

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '20px',
  backgroundColor: alpha(theme.palette.common.black, 0.04),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.black, 0.08),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    fontSize: '0.875rem',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

// Live clock widget — isolated & memoized so its per-second tick only
// re-renders this small component instead of the whole layout tree.
const LiveClock: React.FC = React.memo(() => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        mr: 1,
      }}
    >
      <AccessTimeIcon fontSize="small" color="action" />
      <Typography variant="body2" sx={{ fontWeight: 600 }} color="textSecondary">
        {formatTime(currentTime)}
      </Typography>
    </Box>
  );
});
LiveClock.displayName = 'LiveClock';

interface SidebarChild {
  name: string;
  path: string;
  icon?: React.ReactNode;
  adminOnly?: boolean;
  /** Module permission required to view this nav item (module:view check). */
  requiredPermission?: string;
}

interface SidebarItem {
  name: string;
  path?: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  children?: SidebarChild[];
}

export const MainLayout: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const settings = useAppStore((state) => state.settings);

  // ── Auth Store — read BEFORE any conditional hooks ───────────────────────────
  const authUser = useAuthStore((s) => s.user);
  const authRoles = useAuthStore((s) => s.roles);
  const authIsSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const authHasPermission = useAuthStore((s) => s.hasPermission);
  const authLogout = useAuthStore((s) => s.logout);
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);

  // Only poll /breaks/active when the user is authenticated to prevent an
  // unauthenticated request that triggers the 401 interceptor, which clears
  // the token and interferes with the login flow.
  const { data: activeBreak } = useGetActiveBreak(isAuthenticated);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Dashboard: true,
    HR: false,
    Work: true,
    Timesheets: false,
    'Master Data': false,
  });

  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  // Hydrate auth store on mount if needed
  useEffect(() => {
    if (!isAuthenticated && localStorage.getItem('cognitive_token')) {
      hydrateFromStorage();
    }
  }, [isAuthenticated, hydrateFromStorage]);

  const modulePermissions = useAuthStore((s) => s.modulePermissions) || [];

  const hasPermission = (itemName: string): boolean => {
    if (!isAuthenticated) return true;

    if (authIsSuperAdmin()) {
      return true;
    }

    const permissionMap: Record<string, string> = {
      Clients: 'Clients',
      HR: 'HR',
      Work: 'Projects',
      'Master Data': 'TaskTemplate',
      Reports: 'Reports',
      Settings: 'Settings',
    };

    const targetModule = permissionMap[itemName];
    if (!targetModule) return true;

    return authHasPermission(targetModule, 'view');
  };

  const getFilteredSidebarItems = (): SidebarItem[] => {
    if (!isAuthenticated) return [];
    if (authIsSuperAdmin()) return menuItems;

    // Map each child path to its corresponding feature_key
    const PATH_TO_FEATURE_KEY: Record<string, string> = {
      '/dashboard/private': 'private_dashboard',
      '/dashboard/advanced': 'advanced_dashboard',
      '/dashboard/executive': 'executive_dashboard',
      '/dashboard/team-leader': 'team_leader_dashboard',
      '/dashboard/employee': 'my_dashboard',
      '/dashboard/employee-performance': 'employee_performance',
      '/dashboard/employee-load': 'employee_load_chart',
      '/clients': 'clients',
      '/hr/employees': 'employees',
      '/hr/roles': 'roles',
      '/hr/departments': 'departments',
      '/hr/teams': 'teams',
      '/hr/organization-chart': 'org_chart',
      '/hr/offboarding': 'offboarding',
      '/hr/audit-logs': 'audit_logs',
      '/hr/attendance-settings': 'attendance_settings',
      '/projects': 'projects',
      '/parts': 'parts',
      '/tasks': 'tasks',
      '/timesheets/active': 'work_center',
      '/timesheets/weekly': 'weekly_timesheet',
      '/timesheets': 'session_history',
      '/timesheets/attendance': 'attendance',
      '/timesheets/leave': 'my_leaves',
      '/timesheets/leave-approval': 'leave_approval',
      '/calendar': 'calendar',
      '/reports': 'reports',
      '/master-data/task-templates': 'task_title_library',
      '/settings': 'settings',
      '/tickets/my': 'my_tickets',
      '/tickets/support': 'category_tickets',
      '/biometric/settings/devices': 'biometric_devices',
      '/biometric/settings/connections': 'biometric_connections',
      '/biometric/settings/mapping': 'biometric_mapping',
      '/biometric/settings/sync-config': 'biometric_sync_config',
      '/biometric/settings/test': 'biometric_test',
      '/biometric/attendance/logs': 'biometric_logs',
      '/biometric/attendance/live': 'biometric_live',
      '/biometric/attendance/sync-history': 'biometric_sync_history',
      '/biometric/attendance/health': 'biometric_device_health',
    };

    // If modulePermissions is empty (e.g. before initial profile fetch), fallback to hasPermission filter
    if (!modulePermissions || modulePermissions.length === 0) {
      return menuItems.filter((item) => hasPermission(item.name));
    }

    // Map menuItems.name to backend module_key
    const MODULE_NAME_TO_KEY: Record<string, string> = {
      'Dashboard': 'dashboard',
      'Clients': 'clients',
      'HR': 'hr',
      'Projects': 'projects',
      'Parts': 'projects',
      'Tasks': 'tasks',
      'Timesheets': 'timesheets',
      'Calendar': 'calendar',
      'Reports': 'reports',
      'Master Data': 'master_data',
      'Settings': 'settings',
      'Tickets': 'tickets',
      'Biometric Settings': 'biometric_settings',
      'Biometric Attendance': 'biometric_attendance',
    };

    return menuItems
      .map((item) => {
        const modKey = MODULE_NAME_TO_KEY[item.name];
        if (!modKey) return null;

        const backendModule = modulePermissions.find((m) => m.module_key === modKey);
        if (!backendModule) return null;

        // If the item has children
        if (item.children) {
          const filteredChildren = item.children.filter((child) => {
            const featKey = PATH_TO_FEATURE_KEY[child.path];
            if (!featKey) return false;

            const backendFeature = backendModule.features.find((f) => f.feature_key === featKey);
            if (!backendFeature) return false;

            return backendFeature.view_scope !== 'NONE' && backendFeature.menu_visible;
          });

          if (filteredChildren.length === 0) return null;
          return {
            ...item,
            children: filteredChildren,
          };
        }

        // If the item has a direct path
        if (item.path) {
          const featKey = PATH_TO_FEATURE_KEY[item.path];
          if (!featKey) return null;

          const backendFeature = backendModule.features.find((f) => f.feature_key === featKey);
          if (!backendFeature) return null;

          if (backendFeature.view_scope === 'NONE') return null;
        }

        return item;
      })
      .filter((item): item is SidebarItem => item !== null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSubmenuToggle = (name: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Navigation structure — Phase 1 scope
  const menuItems: SidebarItem[] = [
    {
      name: 'Dashboard',
      icon: <DashboardOutlinedIcon />,
      children: [
        { name: 'Private Dashboard', path: '/dashboard/private', requiredPermission: 'Analytics' },
        { name: 'Advanced Dashboard', path: '/dashboard/advanced', requiredPermission: 'Analytics' },
        { name: 'Executive Dashboard', path: '/dashboard/executive', requiredPermission: 'Analytics' },
        { name: 'Team Lead Dashboard', path: '/dashboard/team-leader', requiredPermission: 'Dashboard' },
        { name: 'My Dashboard', path: '/dashboard/employee', requiredPermission: 'Dashboard' },
        { name: 'Employee Performance', path: '/dashboard/employee-performance', requiredPermission: 'HR' },
        { name: 'Employee Load Chart', path: '/dashboard/employee-load', requiredPermission: 'Dashboard' },
      ],
    },
    {
      name: 'Clients',
      path: '/clients',
      icon: <PeopleOutlinedIcon />,
    },
    {
      name: 'HR',
      icon: <BadgeOutlinedIcon />,
      children: [
        { name: 'Employees', path: '/hr/employees' },
        { name: 'Roles', path: '/hr/roles' },
        { name: 'Departments', path: '/hr/departments' },
        { name: 'Teams', path: '/hr/teams' },
        { name: 'Org Chart', path: '/hr/organization-chart' },
        { name: 'Offboarding', path: '/hr/offboarding' },
        { name: 'Audit Logs', path: '/hr/audit-logs' },
        { name: 'Attendance', path: '/hr/attendance-settings' },
      ],
    },
    {
      name: 'Projects',
      path: '/projects',
      icon: <FolderOutlinedIcon />,
    },
    {
      name: 'Parts',
      path: '/parts',
      icon: <LayersOutlinedIcon />,
    },
    {
      name: 'Tasks',
      path: '/tasks',
      icon: <AssignmentOutlinedIcon />,
    },
    // Phase 2 — Timesheets
    {
      name: 'Timesheets',
      icon: <ScheduleOutlinedIcon />,
      children: [
        { name: 'Data Center', path: '/timesheets/active', icon: <AssignmentOutlinedIcon fontSize="small" /> },
        { name: 'Weekly Timesheet', path: '/timesheets/weekly', icon: <CalendarViewWeekOutlinedIcon fontSize="small" /> },
        { name: 'Session History', path: '/timesheets', icon: <ListAltOutlinedIcon fontSize="small" /> },
        { name: 'Attendance', path: '/timesheets/attendance', icon: <CheckCircleOutlinedIcon fontSize="small" /> },
        { name: 'My Leaves', path: '/timesheets/leave', icon: <EventBusyOutlinedIcon fontSize="small" /> },
        { name: 'Leave Approval', path: '/timesheets/leave-approval', icon: <CheckCircleOutlinedIcon fontSize="small" />, adminOnly: true },
      ],
    },
    {
      name: 'Tickets',
      icon: <ConfirmationNumberOutlinedIcon />,
      children: [
        { name: 'My Tickets', path: '/tickets/my' },
        { name: 'Support Queue', path: '/tickets/support' },
      ],
    },
    {
      name: 'Calendar',
      path: '/calendar',
      icon: <CalendarTodayOutlinedIcon />,
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <BarChartOutlinedIcon />,
    },
    {
      name: 'Master Data',
      icon: <LibraryBooksOutlinedIcon />,
      children: [
        { name: 'Task Title Library', path: '/master-data/task-templates' },
      ],
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <SettingsOutlinedIcon />,
    },
    {
      name: 'Biometric Settings',
      icon: <FingerprintIcon />,
      children: [
        { name: 'Devices', path: '/biometric/settings/devices' },
        { name: 'Connection Profiles', path: '/biometric/settings/connections' },
        { name: 'Employee Mapping', path: '/biometric/settings/mapping' },
        { name: 'Sync Configuration', path: '/biometric/settings/sync-config' },
        { name: 'Connection Test', path: '/biometric/settings/test' },
      ],
    },
    {
      name: 'Biometric Attendance',
      icon: <AccessTimeIcon />,
      children: [
        { name: 'Biometric Logs', path: '/biometric/attendance/logs' },
        { name: 'Live Attendance', path: '/biometric/attendance/live' },
        { name: 'Sync History', path: '/biometric/attendance/sync-history' },
        { name: 'Device Health', path: '/biometric/attendance/health' },
      ],
    },
  ];

  const filteredMenuItems = getFilteredSidebarItems();

  const isRouteActive = (path?: string) => {
    if (!path) return false;
    if (path === '/dashboard/private') {
      return location.pathname === '/dashboard/private' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const isParentActive = (item: SidebarItem) => {
    if (!item.children) return false;
    return item.children.some((child) => location.pathname.startsWith(child.path));
  };

  const isChildActive = (childPath: string, children: SidebarChild[]) => {
    if (!location.pathname.startsWith(childPath)) return false;
    return !children.some(
      (sibling) =>
        sibling.path !== childPath &&
        sibling.path.length > childPath.length &&
        location.pathname.startsWith(sibling.path)
    );
  };

  const renderSidebar = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.sidebar.background,
        color: theme.palette.sidebar.text,
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          minHeight: 64,
        }}
      >
        <Avatar
          variant="rounded"
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          CO
        </Avatar>
        {(!sidebarCollapsed || isMobile) && (
          <Typography variant="subtitle1" color="#ffffff" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
            COGNITIVE
          </Typography>
        )}
      </Box>

      {/* Navigation List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 2, px: 1 }}>
        <List disablePadding>
          {filteredMenuItems.map((item) => {
            const hasChildren = !!item.children;
            const parentActive = isParentActive(item);
            const active = isRouteActive(item.path);
            const isComingSoon = !!item.comingSoon;

            if (sidebarCollapsed && !isMobile) {
              return (
                <Tooltip
                  key={item.name}
                  title={isComingSoon ? `${item.name} — Coming Soon` : item.name}
                  placement="right"
                >
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      disabled={isComingSoon}
                      onClick={() => {
                        if (!isComingSoon) {
                          if (hasChildren && item.children) {
                            navigate(item.children[0].path);
                          } else if (item.path) {
                            navigate(item.path);
                          }
                        }
                      }}
                      sx={{
                        justifyContent: 'center',
                        borderRadius: '6px',
                        py: 1.5,
                        px: 0,
                        opacity: isComingSoon ? 0.45 : 1,
                        color:
                          active || parentActive
                            ? theme.palette.sidebar.activeText
                            : theme.palette.sidebar.text,
                        bgcolor:
                          active || parentActive ? theme.palette.sidebar.active : 'transparent',
                        '&:hover': {
                          bgcolor:
                            active || parentActive
                              ? theme.palette.sidebar.active
                              : theme.palette.sidebar.hover,
                        },
                        '&.Mui-disabled': {
                          opacity: 0.45,
                          color: theme.palette.sidebar.text,
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          justifyContent: 'center',
                          color:
                            active || parentActive ? theme.palette.sidebar.activeText : 'inherit',
                        }}
                      >
                        {isComingSoon ? <LockOutlinedIcon fontSize="small" /> : item.icon}
                      </ListItemIcon>
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              );
            }

            return (
              <React.Fragment key={item.name}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    disabled={isComingSoon}
                    onClick={() => {
                      if (isComingSoon) return;
                      if (hasChildren) {
                        handleSubmenuToggle(item.name);
                      } else if (item.path) {
                        navigate(item.path);
                      }
                    }}
                    sx={{
                      borderRadius: '6px',
                      opacity: isComingSoon ? 0.5 : 1,
                      color: active ? theme.palette.sidebar.activeText : theme.palette.sidebar.text,
                      bgcolor: active ? theme.palette.sidebar.active : 'transparent',
                      '&:hover': {
                        bgcolor: active ? theme.palette.sidebar.active : theme.palette.sidebar.hover,
                        color: '#ffffff',
                        '& .MuiListItemIcon-root': { color: '#ffffff' },
                      },
                      '&.Mui-disabled': {
                        opacity: 0.5,
                        color: theme.palette.sidebar.text,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: active ? theme.palette.sidebar.activeText : 'inherit',
                        minWidth: 40,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText disableTypography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          sx={{ fontSize: '0.875rem', fontWeight: active || parentActive ? 600 : 500 }}
                        >
                          {item.name}
                        </Typography>
                        {isComingSoon && (
                          <Chip
                            label="Soon"
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(255,255,255,0.12)',
                              color: 'rgba(255,255,255,0.6)',
                              '& .MuiChip-label': { px: 0.75 },
                            }}
                          />
                        )}
                      </Box>
                    </ListItemText>
                    {hasChildren &&
                      (openSubmenus[item.name] ? (
                        <ExpandLess sx={{ fontSize: 18 }} />
                      ) : (
                        <ExpandMore sx={{ fontSize: 18 }} />
                      ))}
                  </ListItemButton>
                </ListItem>

                {hasChildren && item.children && (
                  <Collapse
                    in={openSubmenus[item.name]}
                    timeout="auto"
                    unmountOnExit
                    sx={{ pl: 4 }}
                  >
                    <List disablePadding>
                      {item.children
                        .filter((child) => {
                          // Super admins always see everything
                          if (authIsSuperAdmin()) return true;

                          // Per-item permission guard
                          if (child.requiredPermission) {
                            if (!isAuthenticated) return true; // show during hydration
                            if (!authHasPermission(child.requiredPermission, 'view')) return false;
                          }

                          return true;
                        })
                        .map((child) => {
                          const childActive = isChildActive(child.path, item.children!);
                          return (
                            <ListItem disablePadding key={child.name} sx={{ mb: 0.5 }}>
                              <ListItemButton
                                component={Link}
                                to={child.path}
                                sx={{
                                  borderRadius: '6px',
                                  py: 0.75,
                                  color: childActive ? '#ffffff' : theme.palette.sidebar.text,
                                  '&:hover': {
                                    color: '#ffffff',
                                    bgcolor: theme.palette.sidebar.hover,
                                  },
                                }}
                              >
                                {child.icon && (
                                  <ListItemIcon
                                    sx={{
                                      minWidth: 32,
                                      color: childActive ? '#ffffff' : 'inherit',
                                    }}
                                  >
                                    {child.icon}
                                  </ListItemIcon>
                                )}
                                <ListItemText>
                                  <Typography
                                    sx={{ fontSize: '0.8125rem', fontWeight: childActive ? 600 : 400 }}
                                  >
                                    {child.name}
                                  </Typography>
                                </ListItemText>
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* Sidebar Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {(!sidebarCollapsed || isMobile) && (
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
              v1.0.0
            </Typography>
          )}
          {!isMobile && (
            <IconButton
              size="small"
              onClick={toggleSidebar}
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                '&:hover': { color: '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.05)' },
                ml: sidebarCollapsed ? 'auto' : 0,
                mr: sidebarCollapsed ? 'auto' : 0,
              }}
            >
              {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );

  const getBreadcrumbTitle = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return 'Private Dashboard';
    const first = paths[0];
    const second = paths[1];

    if (first === 'dashboard') {
      if (second === 'advanced') return 'Advanced Dashboard';
      if (second === 'executive') return 'Executive Dashboard';
      if (second === 'project') return 'Project Dashboard';
      if (second === 'team-leader') return 'Team Leader Dashboard';
      if (second === 'employee') return 'Employee Dashboard';
      if (second === 'employee-performance') return 'Employee Performance Dashboard';
      return 'Private Dashboard';
    }
    if (first === 'clients') return 'Clients';
    if (first === 'projects') {
      if (second === 'create') return 'Add Project';
      if (second) return 'Project Detail';
      return 'Projects';
    }
    if (first === 'tasks') {
      return second === 'create' ? 'Add Task' : 'Tasks';
    }
    if (first === 'timesheets') {
      if (second === 'weekly') return 'Weekly Timesheet';
      if (second === 'create') return 'Log Time';
      if (second === 'leave') return 'My Leaves';
      if (second === 'leave-approval') return 'Leave Approval';
      if (second === 'attendance') return 'Attendance';
      return 'My Timesheets';
    }
    if (first === 'calendar') return 'Calendar';
    if (first === 'settings') return 'Settings';
    if (first === 'reports') return 'Reports';
    if (first === 'master-data') {
      if (second === 'task-templates') return 'Task Title Library';
      return 'Master Data';
    }
    if (first === 'tickets') return 'Tickets';
    if (first === 'hr') {
      if (second === 'employees') {
        return paths[2] ? 'Employee Profile' : 'Employees';
      }
      if (second === 'roles') return 'Roles';
      if (second === 'departments') return 'Departments';
      if (second === 'teams') return 'Teams';
      if (second === 'organization-chart') return 'Org Chart';
      if (second === 'offboarding') return 'Offboarding';
      if (second === 'audit-logs') return 'Audit Logs';
      if (second === 'attendance-settings') return 'Attendance Settings';
      return 'HR Management';
    }
    if (first === 'biometric') {
      if (second === 'settings') {
        const third = paths[2];
        if (third === 'devices') return 'Biometric Devices';
        if (third === 'connections') return 'Connection Profiles';
        if (third === 'mapping') return 'Employee Mapping';
        if (third === 'sync-config') return 'Sync Configuration';
        if (third === 'test') return 'Connection Test';
        return 'Biometric Settings';
      }
      if (second === 'attendance') {
        const third = paths[2];
        if (third === 'logs') return 'Biometric Logs';
        if (third === 'live') return 'Live Attendance';
        if (third === 'sync-history') return 'Sync History';
        if (third === 'health') return 'Device Health';
        return 'Biometric Attendance';
      }
      return 'Biometric';
    }

    return first.charAt(0).toUpperCase() + first.slice(1);
  };

  const getBreadcrumbTrail = () => {
    return `Home • ${getBreadcrumbTitle()}`;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Drawer for Mobile */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {renderSidebar}
        </Drawer>
      ) : (
        <Box
          sx={{
            width: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth,
            flexShrink: 0,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            borderRight: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              left: 0,
              width: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              zIndex: theme.zIndex.drawer,
              overflow: 'hidden',
            }}
          >
            {renderSidebar}
          </Box>
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Header Appbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
            zIndex: theme.zIndex.drawer - 1,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: 2, minHeight: 64 }}>
            {/* Left Header items */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={isMobile ? handleDrawerToggle : toggleSidebar}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {getBreadcrumbTitle()}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {getBreadcrumbTrail()}
                </Typography>
              </Box>
            </Box>

            {/* Right Header items */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Search Bar — navigates to search pages */}
              <Search sx={{ display: { xs: 'none', sm: 'block' } }}>
                <SearchIconWrapper>
                  <SearchIcon fontSize="small" />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder="Search tasks, projects, clients…"
                  inputProps={{ 'aria-label': 'search' }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (e.key === 'Enter' && val) {
                      navigate(`/tasks?search=${encodeURIComponent(val)}`);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </Search>

              {/* Live Clock Widget */}
              <LiveClock />


              {/* Notification Bell — shows when available */}
              <IconButton size="small" disabled>
                <NotificationsIcon fontSize="small" />
              </IconButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

              {/* User Profile Menu */}
              <IconButton
                size="small"
                onClick={(e) => setProfileAnchor(e.currentTarget)}
                sx={{ p: 0.5 }}
              >
                <Avatar
                  alt={
                    authUser
                      ? `${authUser.firstName} ${authUser.lastName}`
                      : settings.profileSettings.name
                  }
                  src={settings.profileSettings.avatar}
                  sx={{ width: 32, height: 32 }}
                >
                  {authUser
                    ? `${authUser.firstName.charAt(0)}${authUser.lastName.charAt(0)}`
                    : ''}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={profileAnchor}
                open={Boolean(profileAnchor)}
                onClose={() => setProfileAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {authUser
                      ? `${authUser.firstName} ${authUser.lastName}`
                      : settings.profileSettings.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {authUser ? authUser.email : settings.profileSettings.email}
                  </Typography>
                </Box>
                <Divider />
                {!mustChangePassword && (
                  <>
                    <MenuItem
                      onClick={() => {
                        setProfileAnchor(null);
                        navigate('/profile');
                      }}
                    >
                      Profile Settings
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setProfileAnchor(null);
                        navigate('/settings');
                      }}
                    >
                      App Settings
                    </MenuItem>
                    <Divider />
                  </>
                )}
                <MenuItem
                  onClick={() => {
                    setProfileAnchor(null);
                    authLogout();
                    navigate('/login');
                  }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content Wrapper */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            bgcolor: 'background.default',
            overflow: 'auto',
          }}
        >
          {activeBreak && (
            <Alert severity="warning" variant="filled" sx={{ mb: 3, fontWeight: 700, borderRadius: 1 }}>
              You are currently on break. Your running task session has been auto-paused.
            </Alert>
          )}
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
