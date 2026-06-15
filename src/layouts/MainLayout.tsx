import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Badge,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Button,
  LinearProgress,
  Avatar,
  Tooltip,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MailIcon from '@mui/icons-material/Mail';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LightModeIcon from '@mui/icons-material/LightMode';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

// Sidebar Icons
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import WorkOutlinedIcon from '@mui/icons-material/WorkOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import { useAppStore } from '../store/useAppStore';

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

interface SidebarChild {
  name: string;
  path: string;
  icon?: React.ReactNode;
  adminOnly?: boolean;
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

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Dashboard: true,
    HR: false,
    Work: true,
    Timesheets: false,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  const [quickAddAnchor, setQuickAddAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const [currentUser, setCurrentUser] = useState<{ first_name: string; last_name: string; email: string } | null>(null);
  const [profile, setProfile] = useState<{
    roles: string[];
    permissions: {
      module_name: string;
      can_view: boolean;
      can_create: boolean;
      can_edit: boolean;
      can_delete: boolean;
      can_approve: boolean;
      can_export: boolean;
    }[];
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('cognitive_user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    const profStr = localStorage.getItem('cognitive_profile');
    if (profStr) {
      try {
        setProfile(JSON.parse(profStr));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const hasPermission = (itemName: string): boolean => {
    if (!profile) return true;

    if (
      profile.roles.includes('Administrator') ||
      profile.roles.includes('CEO') ||
      profile.roles.includes('ADMIN') ||
      profile.roles.includes('Chief Executive Officer')
    ) {
      return true;
    }

    const permissionMap: Record<string, string> = {
      Clients: 'Clients',
      HR: 'HR',
      Work: 'Projects',
      Reports: 'Reports',
      Settings: 'Settings',
    };

    const targetModule = permissionMap[itemName];
    if (!targetModule) return true;

    const userPerm = profile.permissions.find(
      (p) => p.module_name.toLowerCase() === targetModule.toLowerCase()
    );
    return userPerm ? userPerm.can_view : false;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSubmenuToggle = (name: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Navigation structure — Phase 1 scope
  const menuItems: SidebarItem[] = [
    {
      name: 'Dashboard',
      icon: <DashboardOutlinedIcon />,
      children: [
        { name: 'Private Dashboard', path: '/dashboard/private' },
        { name: 'Advanced Dashboard', path: '/dashboard/advanced' },
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
      name: 'Tasks',
      path: '/tasks',
      icon: <AssignmentOutlinedIcon />,
    },
    // Phase 2 — Timesheets
    {
      name: 'Timesheets',
      icon: <ScheduleOutlinedIcon />,
      children: [
        { name: 'Log Time', path: '/timesheets/create', icon: <ScheduleOutlinedIcon fontSize="small" /> },
        { name: 'My Timesheets', path: '/timesheets', icon: <ListAltOutlinedIcon fontSize="small" /> },
        { name: 'Attendance', path: '/timesheets/attendance', icon: <CheckCircleOutlineIcon fontSize="small" /> },
        { name: 'My Leaves', path: '/timesheets/leave', icon: <EventBusyOutlinedIcon fontSize="small" /> },
        { name: 'Leave Approval', path: '/timesheets/leave-approval', icon: <AdminPanelSettingsOutlinedIcon fontSize="small" />, adminOnly: true },
      ],
    },
    {
      name: 'Calendar',
      path: '/calendar',
      icon: <CalendarTodayOutlinedIcon />,
      comingSoon: true,
    },
    {
      name: 'Tickets',
      path: '/tickets',
      icon: <ConfirmationNumberOutlinedIcon />,
      comingSoon: true,
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <BarChartOutlinedIcon />,
      comingSoon: true,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <SettingsOutlinedIcon />,
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => hasPermission(item.name));

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
                          if (!child.adminOnly) return true;
                          if (!profile) return true;
                          return (
                            profile.roles.includes('Administrator') ||
                            profile.roles.includes('CEO') ||
                            profile.roles.includes('ADMIN') ||
                            profile.roles.includes('Chief Executive Officer') ||
                            profile.roles.includes('Manager')
                          );
                        })
                        .map((child) => {
                          const childActive = location.pathname.startsWith(child.path);
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
        {(!sidebarCollapsed || isMobile) && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => navigate('/settings')}
            sx={{
              mb: 2,
              py: 1,
              fontWeight: 600,
              fontSize: '0.8125rem',
              whiteSpace: 'nowrap',
            }}
          >
            App Settings
          </Button>
        )}
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
      return second === 'advanced' ? 'Advanced Dashboard' : 'Private Dashboard';
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
      if (second === 'create') return 'Log Time';
      if (second === 'leave') return 'My Leaves';
      if (second === 'leave-approval') return 'Leave Approval';
      if (second === 'attendance') return 'Attendance';
      return 'My Timesheets';
    }
    if (first === 'calendar') return 'Calendar';
    if (first === 'settings') return 'Settings';
    if (first === 'reports') return 'Reports';
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

            {/* Middle Header item: Setup Progress */}
            {!isMobile && (
              <Box sx={{ width: 160, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }} color="textSecondary">
                    Setup Progress
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }} color="primary">
                    3/6
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={50} sx={{ height: 4, borderRadius: 2 }} />
              </Box>
            )}

            {/* Right Header items */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Search Bar */}
              <Search sx={{ display: { xs: 'none', sm: 'block' } }}>
                <SearchIconWrapper>
                  <SearchIcon fontSize="small" />
                </SearchIconWrapper>
                <StyledInputBase placeholder="Search…" inputProps={{ 'aria-label': 'search' }} />
              </Search>

              {/* Theme Toggle placeholder */}
              <IconButton size="small">
                <LightModeIcon fontSize="small" />
              </IconButton>

              {/* Live Clock Widget */}
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

              {/* Quick Add Button */}
              <Tooltip title="Quick Add">
                <IconButton
                  size="small"
                  onClick={(e) => setQuickAddAnchor(e.currentTarget)}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Quick Add Menu */}
              <Menu
                anchorEl={quickAddAnchor}
                open={Boolean(quickAddAnchor)}
                onClose={() => setQuickAddAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem
                  onClick={() => {
                    setQuickAddAnchor(null);
                    navigate('/clients');
                  }}
                >
                  Add Client
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setQuickAddAnchor(null);
                    navigate('/projects/create');
                  }}
                >
                  Add Project
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setQuickAddAnchor(null);
                    navigate('/tasks/create');
                  }}
                >
                  Add Task
                </MenuItem>
              </Menu>

              {/* Notification Bell */}
              <IconButton size="small">
                <Badge badgeContent={8} color="primary">
                  <NotificationsIcon fontSize="small" />
                </Badge>
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
                    currentUser
                      ? `${currentUser.first_name} ${currentUser.last_name}`
                      : settings.profileSettings.name
                  }
                  src={settings.profileSettings.avatar}
                  sx={{ width: 32, height: 32 }}
                >
                  {currentUser
                    ? `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}`
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
                    {currentUser
                      ? `${currentUser.first_name} ${currentUser.last_name}`
                      : settings.profileSettings.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {currentUser ? currentUser.email : settings.profileSettings.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setProfileAnchor(null);
                    navigate('/settings');
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
                <MenuItem
                  onClick={() => {
                    setProfileAnchor(null);
                    localStorage.removeItem('cognitive_token');
                    localStorage.removeItem('cognitive_user');
                    localStorage.removeItem('cognitive_profile');
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
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
