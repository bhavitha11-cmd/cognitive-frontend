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
            element: (
              <ProtectedRoute module="Analytics" action="view">
                {lazyLoad(() => import('../modules/dashboard/pages/ExecutiveDashboard'), 'dashboard')}
              </ProtectedRoute>
            ),
          },
          {
            path: 'project/:id',
            element: lazyLoad(() => import('../modules/dashboard/pages/ProjectDashboard'), 'dashboard'),
          },
          {
            path: 'team-leader',
            element: (
              <ProtectedRoute module="Dashboard" action="view">
                {lazyLoad(() => import('../modules/dashboard/pages/TeamLeaderDashboard'), 'dashboard')}
              </ProtectedRoute>
            ),
          },
          {
            path: 'employee',
            element: (
              <ProtectedRoute module="Dashboard" action="view">
                {lazyLoad(() => import('../modules/dashboard/pages/EmployeeDashboard'), 'dashboard')}
              </ProtectedRoute>
            ),
          },
          {
            path: 'employee-performance',
            element: (
              <ProtectedRoute module="HR" action="view">
                {lazyLoad(() => import('../modules/dashboard/pages/EmployeePerformanceDashboard'), 'dashboard')}
              </ProtectedRoute>
            ),
          },
          {
            path: 'employee-load',
            element: (
              <ProtectedRoute module="Dashboard" action="view">
                {lazyLoad(() => import('../modules/dashboard/pages/EmployeeLoadPage'), 'dashboard')}
              </ProtectedRoute>
            ),
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
      // Parts
      {
        path: 'parts',
        children: [
          {
            path: '',
            element: lazyLoad(() => import('../modules/projects/pages/PartListPage'), 'table'),
          },
          {
            path: ':id',
            element: lazyLoad(() => import('../modules/projects/pages/PartDetailPage'), 'dashboard'),
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
            element: (
              <ProtectedRoute module="Leave" action="edit">
                {lazyLoad(() => import('../modules/timesheets/pages/LeaveApprovalPage'), 'table')}
              </ProtectedRoute>
            ),
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
            element: (
              <ProtectedRoute module="HR" action="edit">
                {lazyLoad(() => import('../modules/hr/pages/RoleListPage'), 'table')}
              </ProtectedRoute>
            ),
          },
          {
            path: 'departments',
            element: (
              <ProtectedRoute module="HR" action="edit">
                {lazyLoad(() => import('../modules/hr/pages/DepartmentListPage'), 'table')}
              </ProtectedRoute>
            ),
          },
          {
            path: 'teams',
            element: (
              <ProtectedRoute module="HR" action="edit">
                {lazyLoad(() => import('../modules/hr/pages/TeamListPage'), 'table')}
              </ProtectedRoute>
            ),
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
            element: (
              <ProtectedRoute module="HR" action="edit">
                {lazyLoad(() => import('../modules/hr/pages/AuditLogPage'), 'table')}
              </ProtectedRoute>
            ),
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
            element: (
              <ProtectedRoute module="TaskTemplate" action="view">
                {lazyLoad(() => import('../modules/master-data/pages/TaskTemplateListPage'), 'table')}
              </ProtectedRoute>
            ),
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
      // Tickets
      {
        path: 'tickets',
        children: [
          {
            path: '',
            element: <Navigate to="/tickets/my" replace />,
          },
          {
            path: 'my',
            element: (
              <ProtectedRoute module="my_tickets" action="view">
                {lazyLoad(() => import('../modules/tickets/pages/MyTicketsPage'), 'table')}
              </ProtectedRoute>
            ),
          },
          {
            path: 'raise',
            element: (
              <ProtectedRoute module="raise_ticket" action="view">
                {lazyLoad(() => import('../modules/tickets/pages/RaiseTicketPage'), 'form')}
              </ProtectedRoute>
            ),
          },
          {
            path: 'support',
            element: (
              <ProtectedRoute module="category_tickets" action="view">
                {lazyLoad(() => import('../modules/tickets/pages/CategoryTicketsPage'), 'table')}
              </ProtectedRoute>
            ),
          },
          {
            path: ':id',
            element: (
              <ProtectedRoute module="my_tickets" action="view">
                {lazyLoad(() => import('../modules/tickets/pages/TicketDetailPage'), 'dashboard')}
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
