import React from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import HomeIcon from '@mui/icons-material/Home';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        p: 4,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'error.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          boxShadow: '0 4px 20px rgba(211, 47, 47, 0.3)',
        }}
      >
        <LockOutlinedIcon sx={{ fontSize: 40, color: '#fff' }} />
      </Box>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
        403 — Access Denied
      </Typography>

      <Typography
        variant="body1"
        color="textSecondary"
        sx={{ maxWidth: 440, mb: 4, lineHeight: 1.7 }}
      >
        You don't have the required permissions to access this page.
        Contact your administrator if you believe this is an error.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<HomeIcon />}
        onClick={() => navigate('/dashboard/private')}
        sx={{ px: 4, py: 1.2, fontWeight: 600, borderRadius: 2 }}
      >
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default AccessDeniedPage;
