import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { MainLayout } from '../layouts/MainLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DashboardSkeleton, TableSkeleton, FormSkeleton } from '../components/LoadingSkeleton';

// Reusable Lazy Loading Wrapper
const lazyLoad = (
  importFunc: () => Promise<{ default: React.ComponentType<any> }>,
  fallbackType: 'dashboard' | 'table' | 'form' = 'dashboard'
) => {
  const LazyComponent = lazy(importFunc);
  
  let fallback = <DashboardSkeleton />;
  if (fallbackType === 'table') fallback = <TableSkeleton />;
  if (fallbackType === 'form') fallback = <FormSkeleton />;

  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
};

import { ProtectedRoute } from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: lazyLoad(() => import('../modules/auth/pages/LoginPage'), 'form'),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard/private" replace />,
      },
      {
        path: 'dashboard',
        children: [
          {
            path: '',
            element: <Navigate to="/dashboard/private" replace />,
          },
          {
            path: 'private',
            element: lazyLoad(() => import('../modules/dashboard/pages/PrivateDashboard'), 'dashboard'),
          },
          {
            path: 'advanced',
            element: lazyLoad(() => import('../modules/dashboard/pages/AdvancedDashboard'), 'dashboard'),
          },
        ],
      },
      {
        path: 'calendar',
        element: lazyLoad(() => import('../modules/calendar/pages/CalendarPage'), 'dashboard'),
      },
      {
        path: 'clients',
        children: [
          {
            path: '',
            element: lazyLoad(() => import('../modules/clients/pages/ClientListPage'), 'table'),
          },
          {
            path: 'create',
            element: lazyLoad(() => import('../modules/clients/pages/AddClientPage'), 'form'),
          },
        ],
      },
      {
        path: 'projects',
        children: [
          {
            path: '',
            element: lazyLoad(() => import('../modules/projects/pages/ProjectListPage'), 'table'),
          },
          {
            path: 'create',
            element: lazyLoad(() => import('../modules/projects/pages/CreateProjectPage'), 'form'),
          },
        ],
      },
      {
        path: 'tasks',
        children: [
          {
            path: '',
            element: lazyLoad(() => import('../modules/tasks/pages/TaskListPage'), 'table'),
          },
          {
            path: 'create',
            element: lazyLoad(() => import('../modules/tasks/pages/CreateTaskPage'), 'form'),
          },
        ],
      },
      {
        path: 'timesheets',
        children: [
          {
            path: '',
            element: lazyLoad(() => import('../modules/timesheets/pages/TimesheetListPage'), 'table'),
          },
          {
            path: 'create',
            element: lazyLoad(() => import('../modules/timesheets/pages/LogTimePage'), 'form'),
          },
        ],
      },
      {
        path: 'hr',
        children: [
          {
            path: '',
            element: <Navigate to="/hr/employees" replace />,
          },
          {
            path: 'employees',
            children: [
              {
                path: '',
                element: lazyLoad(() => import('../modules/hr/pages/EmployeeListPage'), 'table'),
              },
              {
                path: ':id',
                element: lazyLoad(() => import('../modules/hr/pages/EmployeeProfilePage'), 'dashboard'),
              },
            ],
          },
          {
            path: 'roles',
            element: lazyLoad(() => import('../modules/hr/pages/RoleListPage'), 'table'),
          },
          {
            path: 'departments',
            element: lazyLoad(() => import('../modules/hr/pages/DepartmentListPage'), 'table'),
          },
          {
            path: 'teams',
            element: lazyLoad(() => import('../modules/hr/pages/TeamListPage'), 'table'),
          },
          {
            path: 'organization-chart',
            element: lazyLoad(() => import('../modules/hr/pages/OrganizationChartPage'), 'dashboard'),
          },
          {
            path: 'offboarding',
            element: lazyLoad(() => import('../modules/hr/pages/OffboardingWizard'), 'form'),
          },
          {
            path: 'audit-logs',
            element: lazyLoad(() => import('../modules/hr/pages/AuditLogPage'), 'table'),
          },
          {
            path: 'designations',
            element: lazyLoad(() => import('../modules/hr/pages/DesignationListPage'), 'table'),
          },
          {
            path: 'attendance-settings',
            element: lazyLoad(() => import('../modules/hr/pages/AttendanceSettingsPage'), 'form'),
          },
        ],
      },
      {
        path: 'tickets',
        element: lazyLoad(() => import('../modules/tickets/pages/TicketsPage'), 'table'),
      },
      {
        path: 'reports',
        element: lazyLoad(() => import('../modules/reports/pages/ReportsPage'), 'dashboard'),
      },
      {
        path: 'settings',
        element: lazyLoad(() => import('../modules/settings/pages/SettingsPage'), 'form'),
      },
      {
        path: '*',
        element: <Navigate to="/dashboard/private" replace />,
      },
    ],
  },
]);
