import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';

// Icons
import BusinessIcon from '@mui/icons-material/Business';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PercentIcon from '@mui/icons-material/Percent';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SaveIcon from '@mui/icons-material/Save';

import { useAppStore } from '../../../store/useAppStore';

type SettingsTab =
  | 'company'
  | 'address'
  | 'app'
  | 'profile'
  | 'notifications'
  | 'currency'
  | 'tax'
  | 'project'
  | 'attendance';

export const SettingsPage: React.FC = () => {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const [activeTab, setActiveTab] = useState<SettingsTab>('company');

  // Form handlers
  const handleCompanyChange = (field: string, value: any) => {
    updateSettings('companySettings', { [field]: value });
  };

  const handleAddressChange = (field: string, value: any) => {
    updateSettings('businessAddress', { [field]: value });
  };

  const handleAppChange = (field: string, value: any) => {
    updateSettings('appSettings', { [field]: value });
  };

  const handleProfileChange = (field: string, value: any) => {
    updateSettings('profileSettings', { [field]: value });
  };

  const handleNotificationChange = (field: string, value: any) => {
    updateSettings('notificationSettings', { [field]: value });
  };

  const handleCurrencyChange = (field: string, value: any) => {
    updateSettings('currencySettings', { [field]: value });
  };

  const handleTaxChange = (field: string, value: any) => {
    updateSettings('taxSettings', { [field]: value });
  };

  const handleProjectChange = (field: string, value: any) => {
    updateSettings('projectSettings', { [field]: value });
  };

  const handleAttendanceChange = (field: string, value: any) => {
    updateSettings('attendanceSettings', { [field]: value });
  };

  const tabsList = [
    { id: 'company' as const, label: 'Company Settings', icon: <BusinessIcon /> },
    { id: 'address' as const, label: 'Business Address', icon: <HomeIcon /> },
    { id: 'app' as const, label: 'App Settings', icon: <SettingsIcon /> },
    { id: 'profile' as const, label: 'Profile Settings', icon: <PersonIcon /> },
    { id: 'notifications' as const, label: 'Notification Settings', icon: <NotificationsIcon /> },
    { id: 'currency' as const, label: 'Currency Settings', icon: <AttachMoneyIcon /> },
    { id: 'tax' as const, label: 'Tax Settings', icon: <PercentIcon /> },
    { id: 'project' as const, label: 'Project Settings', icon: <AssignmentIcon /> },
    { id: 'attendance' as const, label: 'Attendance Settings', icon: <AccessTimeIcon /> },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Left vertical settings tabs */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <List disablePadding>
              {tabsList.map((tab) => (
                <ListItem disablePadding key={tab.id}>
                  <ListItemButton
                    selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    sx={{
                      py: 1.5,
                      '&.Mui-selected': {
                        borderLeft: '4px solid #206bc4',
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        '& .MuiListItemIcon-root': { color: 'primary.main' },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>{tab.icon}</ListItemIcon>
                    <ListItemText primary={<Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{tab.label}</Typography>} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>

        {/* Right Settings Form Details */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Card sx={{ minHeight: 450 }}>
            <CardContent sx={{ p: 3 }}>
              {/* Tab 1: Company Settings */}
              {activeTab === 'company' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    Company Settings
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Company Name"
                        value={settings.companySettings.companyName}
                        onChange={(e) => handleCompanyChange('companyName', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Contact Person"
                        value={settings.companySettings.contactPerson}
                        onChange={(e) => handleCompanyChange('contactPerson', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Email Address"
                        value={settings.companySettings.email}
                        onChange={(e) => handleCompanyChange('email', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Phone Number"
                        value={settings.companySettings.phone}
                        onChange={(e) => handleCompanyChange('phone', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Website"
                        value={settings.companySettings.website}
                        onChange={(e) => handleCompanyChange('website', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 2: Business Address */}
              {activeTab === 'address' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    Business Address
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Address"
                        value={settings.businessAddress.address}
                        onChange={(e) => handleAddressChange('address', e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="City"
                        value={settings.businessAddress.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="State"
                        value={settings.businessAddress.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Postal Code"
                        value={settings.businessAddress.postalCode}
                        onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Country"
                        value={settings.businessAddress.country}
                        onChange={(e) => handleAddressChange('country', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 3: App Settings */}
              {activeTab === 'app' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    App Settings
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>Theme Mode</Typography>
                      <Select
                        value={settings.appSettings.theme}
                        onChange={(e) => handleAppChange('theme', e.target.value)}
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="light">Light Mode</MenuItem>
                        <MenuItem value="dark">Dark Mode</MenuItem>
                        <MenuItem value="system">System Default</MenuItem>
                      </Select>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>System Language</Typography>
                      <Select
                        value={settings.appSettings.language}
                        onChange={(e) => handleAppChange('language', e.target.value)}
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="English">English</MenuItem>
                        <MenuItem value="Spanish">Spanish</MenuItem>
                        <MenuItem value="French">French</MenuItem>
                        <MenuItem value="German">German</MenuItem>
                      </Select>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 4: Profile Settings */}
              {activeTab === 'profile' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    Profile Settings
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Your Name"
                        value={settings.profileSettings.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Email Address"
                        value={settings.profileSettings.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Contact Phone"
                        value={settings.profileSettings.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 5: Notification Settings */}
              {activeTab === 'notifications' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    Notification Settings
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notificationSettings.emailNotifications}
                            onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                          />
                        }
                        label="Receive email notifications"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notificationSettings.desktopNotifications}
                            onChange={(e) => handleNotificationChange('desktopNotifications', e.target.checked)}
                          />
                        }
                        label="Receive desktop push notifications"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notificationSettings.taskAssigned}
                            onChange={(e) => handleNotificationChange('taskAssigned', e.target.checked)}
                          />
                        }
                        label="Notify me when a new task is assigned"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notificationSettings.projectDeadline}
                            onChange={(e) => handleNotificationChange('projectDeadline', e.target.checked)}
                          />
                        }
                        label="Notify me of upcoming project deadlines"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 6: Currency Settings */}
              {activeTab === 'currency' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    Currency Settings
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Currency Code"
                        value={settings.currencySettings.currencyCode}
                        onChange={(e) => handleCurrencyChange('currencyCode', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Currency Symbol"
                        value={settings.currencySettings.currencySymbol}
                        onChange={(e) => handleCurrencyChange('currencySymbol', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Thousand Separator"
                        value={settings.currencySettings.thousandSeparator}
                        onChange={(e) => handleCurrencyChange('thousandSeparator', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Decimal Separator"
                        value={settings.currencySettings.decimalSeparator}
                        onChange={(e) => handleCurrencyChange('decimalSeparator', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 7: Tax Settings */}
              {activeTab === 'tax' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    Tax Settings
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Tax Name"
                        value={settings.taxSettings.taxName}
                        onChange={(e) => handleTaxChange('taxName', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Tax Rate (%)"
                        type="number"
                        value={settings.taxSettings.taxRate}
                        onChange={(e) => handleTaxChange('taxRate', parseFloat(e.target.value))}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="VAT/GST Identification Number"
                        value={settings.taxSettings.vatNumber}
                        onChange={(e) => handleTaxChange('vatNumber', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 8: Project Settings */}
              {activeTab === 'project' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    Project Settings
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.projectSettings.allowClientToTask}
                            onChange={(e) => handleProjectChange('allowClientToTask', e.target.checked)}
                          />
                        }
                        label="Allow clients to add tasks to projects"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>Default Task Status</Typography>
                      <Select
                        value={settings.projectSettings.defaultTaskStatus}
                        onChange={(e) => handleProjectChange('defaultTaskStatus', e.target.value)}
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="To Do">To Do</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                      </Select>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 9: Attendance Settings */}
              {activeTab === 'attendance' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    Attendance Settings
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Office Start Time"
                        type="time"
                        value={settings.attendanceSettings.officeStartTime}
                        onChange={(e) => handleAttendanceChange('officeStartTime', e.target.value)}
                        fullWidth
                        size="small"
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Office End Time"
                        type="time"
                        value={settings.attendanceSettings.officeEndTime}
                        onChange={(e) => handleAttendanceChange('officeEndTime', e.target.value)}
                        fullWidth
                        size="small"
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Half Day Mark (Hours)"
                        type="number"
                        value={settings.attendanceSettings.halfDayHour}
                        onChange={(e) => handleAttendanceChange('halfDayHour', parseInt(e.target.value, 10))}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Late Mark Threshold (Minutes)"
                        type="number"
                        value={settings.attendanceSettings.lateMarkAfterMinutes}
                        onChange={(e) => handleAttendanceChange('lateMarkAfterMinutes', parseInt(e.target.value, 10))}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Save Success Button Mockup */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button variant="contained" color="primary" startIcon={<SaveIcon />} sx={{ px: 4 }}>
                  Save Changes
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage;
