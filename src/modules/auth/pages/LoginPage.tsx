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
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import api from '../../../utils/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // Inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTogglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { username, password });
      const { data, success, message } = response.data;

      if (success && data?.access_token) {
        localStorage.setItem('cognitive_token', data.access_token);
        localStorage.setItem('cognitive_user', JSON.stringify(data.employee));
        
        // Fetch full profile (me) to cache roles & permissions
        const meResponse = await api.get('/auth/me');
        if (meResponse.data?.success) {
          localStorage.setItem('cognitive_profile', JSON.stringify(meResponse.data.data));
        }

        // Navigate to default dashboard
        navigate('/dashboard/private');
      } else {
        setError(message || 'Authentication failed. Please try again.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Server error. Please verify the API is running.';
      setError(msg);
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
        background: 'linear-gradient(135deg, #0e1628 0%, #1e293b 100%)',
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          bgcolor: 'rgba(14, 22, 40, 0.85)',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          {/* Logo & Header */}
          <Avatar
            onClick={() => {
              setUsername('admin');
              setPassword('AdminPassword123!');
              setError(null);
            }}
            sx={{
              m: '0 auto 16px',
              bgcolor: 'primary.main',
              width: 52,
              height: 52,
              boxShadow: '0 4px 12px rgba(32, 107, 196, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.08)',
                bgcolor: 'primary.dark',
                boxShadow: '0 6px 16px rgba(32, 107, 196, 0.6)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            title="Autofill Admin Credentials"
          >
            <LockOutlinedIcon sx={{ fontSize: 28 }} />
          </Avatar>
          
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', mb: 0.5 }}>
            COGNITIVE
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4, fontWeight: 500 }}>
            Enterprise HRMS Portal Login
          </Typography>

          {/* Error Banner */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left', borderRadius: 1.5 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
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
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword} edge="end" sx={{ color: '#94a3b8' }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
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
                boxShadow: '0 4px 12px rgba(32, 107, 196, 0.25)',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
