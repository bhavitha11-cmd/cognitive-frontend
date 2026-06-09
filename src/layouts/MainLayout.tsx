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

// Sidebar Icons
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import WorkOutlinedIcon from '@mui/icons-material/WorkOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
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

interface SidebarItem {
  name: string;
  path?: string;
  icon: React.ReactNode;
  children?: { name: string; path: string }[];
}

export const MainLayout: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const settings = useAppStore((state) => state.settings);

  // States
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Dashboard: true,
    Work: true,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Quick Add Menu Anchor
  const [quickAddAnchor, setQuickAddAnchor] = useState<null | HTMLElement>(null);
  // Profile Menu Anchor
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
      'Clients': 'Clients',
      'HR': 'HR',
      'Work': 'Projects',
      'Reports': 'Reports',
      'Settings': 'Settings',
    };

    const targetModule = permissionMap[itemName];
    if (!targetModule) return true;

    const userPerm = profile.permissions.find((p) => p.module_name.toLowerCase() === targetModule.toLowerCase());
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

  const menuItems: SidebarItem[] = [
    {
      name: 'Dashboard',
      icon: <DashboardOutlinedIcon />,
      children: [
        { name: 'Private Dashboard', path: '/dashboard/private' },
        { name: 'Advanced Dashboard', path: '/dashboard/advanced' },
      ],
    },
    { name: 'My Calendar', path: '/calendar', icon: <CalendarTodayOutlinedIcon /> },
    { name: 'Clients', path: '/clients', icon: <PeopleOutlinedIcon /> },
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
      name: 'Work',
      icon: <WorkOutlinedIcon />,
      children: [
        { name: 'Projects', path: '/projects' },
        { name: 'Tasks', path: '/tasks' },
        { name: 'Timesheets', path: '/timesheets' },
      ],
    },
    { name: 'Tickets', path: '/tickets', icon: <ConfirmationNumberOutlinedIcon /> },
    { name: 'Events', path: '/calendar', icon: <EventOutlinedIcon /> },
    { name: 'Messages', path: '/tickets', icon: <ChatBubbleOutlinedIcon /> },
    { name: 'Notice Board', path: '/dashboard/private', icon: <CampaignOutlinedIcon /> },
    { name: 'Knowledge Base', path: '/dashboard/private', icon: <MenuBookOutlinedIcon /> },
    { name: 'Reports', path: '/reports', icon: <BarChartOutlinedIcon /> },
    { name: 'Settings', path: '/settings', icon: <SettingsOutlinedIcon /> },
  ];

  const filteredMenuItems = menuItems.filter((item) => hasPermission(item.name));

  // Helper to determine if a route is active
  const isRouteActive = (path?: string) => {
    if (!path) return false;
    if (path === '/dashboard/private') {
      return location.pathname === '/dashboard/private' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Helper to determine if a parent menu contains the active route
  const isParentActive = (item: SidebarItem) => {
    if (!item.children) return false;
    return item.children.some((child) => location.pathname === child.path);
  };

  // Render Sidebar Content
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

            if (sidebarCollapsed && !isMobile) {
              return (
                <Tooltip key={item.name} title={item.name} placement="right">
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => {
                        if (hasChildren && item.children) {
                          navigate(item.children[0].path);
                        } else if (item.path) {
                          navigate(item.path);
                        }
                      }}
                      sx={{
                        justifyContent: 'center',
                        borderRadius: '6px',
                        py: 1.5,
                        px: 0,
                        color: active || parentActive ? theme.palette.sidebar.activeText : theme.palette.sidebar.text,
                        bgcolor: active || parentActive ? theme.palette.sidebar.active : 'transparent',
                        '&:hover': {
                          bgcolor: active || parentActive ? theme.palette.sidebar.active : theme.palette.sidebar.hover,
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          justifyContent: 'center',
                          color: active || parentActive ? theme.palette.sidebar.activeText : 'inherit',
                        }}
                      >
                        {item.icon}
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
                    onClick={() => {
                      if (hasChildren) {
                        handleSubmenuToggle(item.name);
                      } else if (item.path) {
                        navigate(item.path);
                      }
                    }}
                    sx={{
                      borderRadius: '6px',
                      color: active ? theme.palette.sidebar.activeText : theme.palette.sidebar.text,
                      bgcolor: active ? theme.palette.sidebar.active : 'transparent',
                      '&:hover': {
                        bgcolor: active ? theme.palette.sidebar.active : theme.palette.sidebar.hover,
                        color: '#ffffff',
                        '& .MuiListItemIcon-root': { color: '#ffffff' },
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
                    <ListItemText>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: active || parentActive ? 600 : 500 }}>
                        {item.name}
                      </Typography>
                    </ListItemText>
                    {hasChildren && (openSubmenus[item.name] ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />)}
                  </ListItemButton>
                </ListItem>

                {hasChildren && item.children && (
                  <Collapse in={openSubmenus[item.name]} timeout="auto" unmountOnExit sx={{ pl: 4 }}>
                    <List disablePadding>
                      {item.children.map((child) => {
                        const childActive = location.pathname === child.path;
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
                              <ListItemText>
                                <Typography sx={{ fontSize: '0.8125rem', fontWeight: childActive ? 600 : 400 }}>
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
            onClick={() => navigate('/tickets')}
            sx={{
              mb: 2,
              py: 1,
              fontWeight: 600,
              fontSize: '0.8125rem',
              whiteSpace: 'nowrap',
            }}
          >
            Raise Support Ticket
          </Button>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {(!sidebarCollapsed || isMobile) && (
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
              v5.5.24
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
    if (first === 'clients') {
      return second === 'create' ? 'Add Client' : 'Clients';
    }
    if (first === 'projects') {
      return second === 'create' ? 'Add Project' : 'Projects';
    }
    if (first === 'tasks') {
      return second === 'create' ? 'Add Task' : 'Tasks';
    }
    if (first === 'timesheets') {
      return second === 'create' ? 'Log Time' : 'Timesheets';
    }
    if (first === 'calendar') return 'My Calendar';
    if (first === 'settings') return 'Settings';
    if (first === 'reports') return 'Reports';
    if (first === 'tickets') return 'Tickets';
    if (first === 'hr') {
      if (second === 'employees') {
        return paths[2] ? 'Employee Profile' : 'Employees';
      }
      if (second === 'roles') return 'Roles';
      if (second === 'departments') return 'Departments';
      if (second === 'attendance-settings') return 'Attendance Settings';
      return 'HR Management';
    }
    
    return first.charAt(0).toUpperCase() + first.slice(1);
  };

  const getBreadcrumbTrail = () => {
    const title = getBreadcrumbTitle();
    return `Home • ${title}`;
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
        /* Permanent Collapsible Sidebar for Desktop */
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
                sx={{ mr: 1, display: isMobile ? 'flex' : 'flex' }}
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
                    navigate('/clients/create');
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
                <MenuItem
                  onClick={() => {
                    setQuickAddAnchor(null);
                    navigate('/timesheets/create');
                  }}
                >
                  Log Time
                </MenuItem>
              </Menu>

              {/* Message Bell */}
              <IconButton size="small">
                <Badge badgeContent={5} color="error">
                  <MailIcon fontSize="small" />
                </Badge>
              </IconButton>

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
                  alt={currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : settings.profileSettings.name}
                  src={settings.profileSettings.avatar}
                  sx={{ width: 32, height: 32 }}
                >
                  {currentUser ? `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}` : ''}
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
                    {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : settings.profileSettings.name}
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
                <MenuItem onClick={() => {
                  setProfileAnchor(null);
                  localStorage.removeItem('cognitive_token');
                  localStorage.removeItem('cognitive_user');
                  localStorage.removeItem('cognitive_profile');
                  navigate('/login');
                }}>Logout</MenuItem>
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
