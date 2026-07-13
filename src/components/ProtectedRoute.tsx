import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from '../store/useAuthStore';
import { AccessDeniedPage } from './AccessDeniedPage';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  module?: string;      // e.g. "HR", "Projects"
  action?: string;      // e.g. "view", "create"
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  module,
  action = 'view',
}) => {
  const token = useAuthStore((s) => s.token);
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  // Hydrate auth store from localStorage on mount
  useEffect(() => {
    const localToken = localStorage.getItem('cognitive_token');
    if (localToken && !isAuthenticated) {
      hydrateFromStorage();
    }
  }, [isAuthenticated, hydrateFromStorage]);

  // If there's no token in store or localStorage, redirect to login
  const hasLocalToken = !!localStorage.getItem('cognitive_token');
  if (!token && !hasLocalToken) {
    return <Navigate to="/login" replace />;
  }

  // If a local token exists but the store hasn't hydrated/authenticated yet, show loading spinner
  if (hasLocalToken && !isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If a module/action guard is specified, check permissions
  if (module && isAuthenticated) {
    if (!hasPermission(module, action)) {
      return <AccessDeniedPage />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
