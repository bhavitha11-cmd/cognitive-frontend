import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { MainLayout } from '../layouts/MainLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DashboardSkeleton, TableSkeleton, FormSkeleton } from '../components/LoadingSkeleton';
import { ProtectedRoute } from '../components/ProtectedRoute';

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
          {
            path: 'executive',
            element: lazyLoad(() => import('../modules/dashboard/pages/ExecutiveDashboard'), 'dashboard'),
          },
          {
            path: 'project/:id',
            element: lazyLoad(() => import('../modules/dashboard/pages/ProjectDashboard'), 'dashboard'),
          },
          {
            path: 'team-leader',
            element: lazyLoad(() => import('../modules/dashboard/pages/TeamLeaderDashboard'), 'dashboard'),
          },
          {
            path: 'employee',
            element: lazyLoad(() => import('../modules/dashboard/pages/EmployeeDashboard'), 'dashboard'),
          },
          {
            path: 'employee-performance',
            element: lazyLoad(() => import('../modules/dashboard/pages/EmployeePerformanceDashboard'), 'dashboard'),
          },
        ],
      },
      // Clients
      {
        path: 'clients',
        element: <ProtectedRoute module="Clients" action="view" />,
        children: [
          {
            path: '',
            element: lazyLoad(() => import('../modules/clients/pages/ClientListPage'), 'table'),
          },
          {
            path: 'create',
            element: <Navigate to="/clients" replace />,
          },
        ],
      },
      // Projects
      {
        path: 'projects',
        children: [
          {
            path: '',
            element: lazyLoad(() => import('../modules/projects/pages/ProjectListPage'), 'table'),
          },
          {
            path: 'create',
            element: (
              <ProtectedRoute module="Projects" action="create">
                {lazyLoad(() => import('../modules/projects/pages/CreateProjectPage'), 'form')}
              </ProtectedRoute>
            ),
          },
          {
            path: ':id',
            element: lazyLoad(() => import('../modules/projects/pages/ProjectDetailPage'), 'dashboard'),
          },
          {
            path: 'reviews/:id',
            element: lazyLoad(() => import('../modules/projects/pages/ScheduleReviewPage'), 'form'),
          },
        ],
      },
      // Tasks
      {
        path: 'tasks',
        children: [
          {
            path: '',
            element: lazyLoad(() => import('../modules/tasks/pages/TaskListPage'), 'table'),
          },
          {
            path: 'create',
            element: (
              <ProtectedRoute module="Tasks" action="create">
                {lazyLoad(() => import('../modules/tasks/pages/CreateTaskPage'), 'form')}
              </ProtectedRoute>
            ),
          },
          {
            path: ':id/edit',
            element: lazyLoad(() => import('../modules/tasks/pages/CreateTaskPage'), 'form'),
          },
        ],
      },
      // Planning — Phase 3 (Gantt, Capacity)
      {
        path: 'planning',
        children: [
          {
            path: 'projects/:id/timeline',
            element: lazyLoad(() => import('../modules/planning/pages/ProjectTimelinePage'), 'dashboard'),
          },
          {
            path: 'capacity',
            element: lazyLoad(() => import('../modules/planning/pages/CapacityPlanningPage'), 'dashboard'),
          },
        ],
      },
      // Timesheets — Phase 2
      {
        path: 'timesheets',
        children: [
          {
            path: '',
            element: lazyLoad(() => import('../modules/timesheets/pages/TimesheetListPage'), 'table'),
          },
          {
            path: 'active',
            element: lazyLoad(() => import('../modules/timesheets/pages/WorkCenterPage'), 'dashboard'),
          },
          {
            path: 'weekly',
            element: lazyLoad(() => import('../modules/timesheets/pages/WeeklyTimesheetPage'), 'table'),
          },
          {
            path: 'create',
            element: lazyLoad(() => import('../modules/timesheets/pages/LogTimePage'), 'form'),
          },
          {
            path: 'leave',
            element: lazyLoad(() => import('../modules/timesheets/pages/LeaveRequestPage'), 'table'),
          },
          {
            path: 'leave-approval',
            element: lazyLoad(() => import('../modules/timesheets/pages/LeaveApprovalPage'), 'table'),
          },
          {
            path: 'attendance',
            element: lazyLoad(() => import('../modules/timesheets/pages/AttendancePage'), 'table'),
          },
        ],
      },
      // HR
      {
        path: 'hr',
        element: <ProtectedRoute module="HR" action="view" />,
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
        path: 'reports',
        element: (
          <ProtectedRoute module="Reports" action="view">
            {lazyLoad(() => import('../modules/reports/pages/ReportsPage'), 'dashboard')}
          </ProtectedRoute>
        ),
      },
      {
        path: 'calendar',
        element: lazyLoad(() => import('../modules/calendar/pages/CalendarPage'), 'dashboard'),
      },
      // Master Data
      {
        path: 'master-data',
        children: [
          {
            path: '',
            element: <Navigate to="/master-data/task-templates" replace />,
          },
          {
            path: 'task-templates',
            element: lazyLoad(() => import('../modules/master-data/pages/TaskTemplateListPage'), 'table'),
          },
          {
            path: 'calendar-config',
            element: (
              <ProtectedRoute module="CalendarSettings" action="edit">
                {lazyLoad(() => import('../modules/master-data/pages/CalendarConfigPage'), 'dashboard')}
              </ProtectedRoute>
            ),
          },
        ],
      },
      // Settings
      {
        path: 'settings',
        element: (
          <ProtectedRoute module="Settings" action="view">
            {lazyLoad(() => import('../modules/settings/pages/SettingsPage'), 'form')}
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/dashboard/private" replace />,
      },
    ],
  },
]);
