import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Typography,
  Avatar,
  Divider,
  TextField,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import MailIcon from '@mui/icons-material/Mail';
import WorkIcon from '@mui/icons-material/Work';
import { useAuthStore } from '../../../store/useAuthStore';
import api, { parseError } from '../../../utils/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const UserProfilePage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const roles = useAuthStore((s) => s.roles);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const profileData = JSON.parse(localStorage.getItem('cognitive_profile') || '{}');

  const [activeTab, setActiveTab] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Form Inputs
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Refresh profile on mount
  useEffect(() => {
    setLoadingProfile(true);
    refreshProfile().finally(() => setLoadingProfile(false));
  }, [refreshProfile]);

  // Password Policy Checklist
  const passwordRules = [
    { label: 'Minimum 8 characters long', test: (pwd: string) => pwd.length >= 8 },
    { label: 'Contains an uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: 'Contains a lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: 'Contains a number', test: (pwd: string) => /\d/.test(pwd) },
    { label: 'Contains a special character (!@#$%^&*, etc.)', test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
  ];

  const allRulesPassed = passwordRules.every((rule) => rule.test(newPassword));

  const handleToggleCurrent = () => setShowCurrentPassword(!showCurrentPassword);
  const handleToggleNew = () => setShowNewPassword(!showNewPassword);
  const handleToggleConfirm = () => setShowConfirmPassword(!showConfirmPassword);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setSuccess(null);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (!allRulesPassed) {
      setError('New password must satisfy all password policy criteria.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      const { data, success: apiSuccess, message } = response.data;
      if (apiSuccess && data?.access_token) {
        localStorage.setItem('cognitive_token', data.access_token);
        
        // Refresh session profile state
        await refreshProfile();
        
        // Clear fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('Password changed successfully.');
      } else {
        setError(message || 'Failed to update password.');
      }
    } catch (err: any) {
      setError(parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProfile && !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Fallback values
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'User Profile';
  const emailVal = user?.email || 'N/A';
  const employeeCode = user?.employeeCode || 'N/A';

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
        Profile & Security Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column: User Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mb: 2.5,
                  boxShadow: 3,
                  fontSize: '2rem',
                  fontWeight: 700,
                  bgcolor: 'primary.main',
                }}
              >
                {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : <PersonIcon />}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {displayName}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {employeeCode}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, mb: 3 }}>
                {roles.map((r, idx) => (
                  <Chip key={idx} label={r} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600 }} />
                ))}
              </Box>

              <Divider sx={{ width: '100%', mb: 3 }} />

              <Stack spacing={2} sx={{ width: '100%', textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <MailIcon color="action" fontSize="small" />
                  <Typography variant="body2" noWrap sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                    {emailVal}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <WorkIcon color="action" fontSize="small" />
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                    {profileData.department_name || 'No Department'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Tab View */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minHeight: 400 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile tabs">
                  <Tab icon={<PersonIcon />} iconPosition="start" label="Profile Details" sx={{ textTransform: 'none', fontWeight: 600 }} />
                  <Tab icon={<SecurityIcon />} iconPosition="start" label="Security" sx={{ textTransform: 'none', fontWeight: 600 }} />
                </Tabs>
              </Box>

              {/* Tab Panel 1: Profile Details */}
              <TabPanel value={activeTab} index={0}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }} color="primary">
                  Personal Details
                </Typography>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>First Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.firstName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Last Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.lastName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Username</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.username}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Official Email</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{emailVal}</Typography>
                  </Grid>
                </Grid>

                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }} color="primary">
                  Employment Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Employee Code</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employeeCode}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Department</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{profileData.department_name || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Tab Panel 2: Security */}
              <TabPanel value={activeTab} index={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }} color="primary">
                  Change Password
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                    {success}
                  </Alert>
                )}

                <Box component="form" onSubmit={handlePasswordChange} noValidate sx={{ maxWidth: 480 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Current Password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    size="small"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleToggleCurrent} edge="end" sx={{ color: '#94a3b8' }}>
                              {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    size="small"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleToggleNew} edge="end" sx={{ color: '#94a3b8' }}>
                              {showNewPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  {/* Password Complexity checklist */}
                  {newPassword && (
                    <Box sx={{ mt: 1.5, mb: 1.5, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600, mb: 1 }}>
                        PASSWORD POLICY REQUIREMENTS:
                      </Typography>
                      <List dense disablePadding>
                        {passwordRules.map((rule, idx) => {
                          const passed = rule.test(newPassword);
                          return (
                            <ListItem key={idx} disableGutters sx={{ py: 0.25 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                {passed ? (
                                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
                                ) : (
                                  <RadioButtonUncheckedIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={rule.label}
                                slotProps={{
                                  primary: {
                                    sx: {
                                      color: passed ? 'text.primary' : 'text.secondary',
                                      fontSize: '0.75rem',
                                      fontWeight: passed ? 500 : 400,
                                    },
                                  },
                                }}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>
                  )}

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    size="small"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleToggleConfirm} edge="end" sx={{ color: '#94a3b8' }}>
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ mb: 3 }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                    sx={{
                      px: 4,
                      py: 1,
                      fontWeight: 700,
                      borderRadius: '8px',
                      textTransform: 'none',
                    }}
                  >
                    {submitting ? <CircularProgress size={24} color="inherit" /> : 'Change Password'}
                  </Button>
                </Box>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfilePage;
