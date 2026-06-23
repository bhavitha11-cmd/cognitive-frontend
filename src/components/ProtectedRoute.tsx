import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
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
  const token = localStorage.getItem('cognitive_token');
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  // Hydrate auth store from localStorage on mount
  useEffect(() => {
    if (token && !isAuthenticated) {
      hydrateFromStorage();
    }
  }, [token, isAuthenticated, hydrateFromStorage]);

  // Not logged in at all
  if (!token) {
    return <Navigate to="/login" replace />;
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
