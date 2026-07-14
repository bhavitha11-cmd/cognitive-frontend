import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Avatar,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import api, { parseError } from '../../../utils/api';
import { useAuthStore } from '../../../store/useAuthStore';

export const ForceChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  // Form Inputs
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      const { data, success, message } = response.data;
      if (success && data?.access_token) {
        // Save the new access token
        localStorage.setItem('cognitive_token', data.access_token);
        
        // Refresh the profile to hydrate store with new credentials (this sets mustChangePassword to false)
        await refreshProfile();

        // Redirect to dashboard
        navigate('/dashboard/private');
      } else {
        setError(message || 'Failed to update password.');
      }
    } catch (err: any) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          bgcolor: 'rgba(15, 23, 42, 0.9)',
          borderRadius: 4,
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Icon Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 3 }}>
            <Avatar
              sx={{
                bgcolor: 'warning.main',
                width: 56,
                height: 56,
                mb: 2,
                boxShadow: '0 4px 14px rgba(237, 108, 2, 0.3)',
              }}
            >
              <ShieldIcon sx={{ fontSize: 32, color: '#ffffff' }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', mb: 1 }}>
              Secure Your Account
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
              For your security, you are required to change your password before proceeding. This is either your first login or your password was recently reset by an administrator.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  color: '#ffffff',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8' },
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  color: '#ffffff',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8' },
              }}
            />

            {/* Password Policy Rules checklist */}
            {newPassword && (
              <Box sx={{ mt: 1.5, mb: 1.5, p: 2, bgcolor: 'rgba(255, 255, 255, 0.02)', borderRadius: 2, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600, mb: 1 }}>
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
                            <RadioButtonUncheckedIcon sx={{ color: '#64748b', fontSize: 16 }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={rule.label}
                          slotProps={{
                            primary: {
                              sx: {
                                color: passed ? '#ffffff' : '#94a3b8',
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  color: '#ffffff',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8' },
                mb: 4,
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.2,
                fontWeight: 700,
                fontSize: '0.9rem',
                borderRadius: '8px',
                bgcolor: 'warning.main',
                boxShadow: '0 4px 14px rgba(237, 108, 2, 0.2)',
                '&:hover': {
                  bgcolor: 'warning.dark',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password & Login'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForceChangePasswordPage;
