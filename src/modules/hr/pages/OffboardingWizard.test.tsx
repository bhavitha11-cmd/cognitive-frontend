import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';

vi.mock('../services/hrService', () => ({
  useGetEmployees: vi.fn(),
  useGetOffboardImpact: vi.fn(),
  useExecuteOffboard: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { OffboardingWizard } from './OffboardingWizard';
import { useGetEmployees, useGetOffboardImpact, useExecuteOffboard } from '../services/hrService';

const mockEmployees = [
  {
    id: 'emp-1',
    firstName: 'John',
    lastName: 'Doe',
    employeeCode: 'EMP001',
    departmentName: 'Engineering',
    status: 'ACTIVE',
  },
  {
    id: 'emp-2',
    firstName: 'Jane',
    lastName: 'Smith',
    employeeCode: 'EMP002',
    departmentName: 'Marketing',
    status: 'ACTIVE',
  },
  {
    id: 'emp-3',
    firstName: 'Bob',
    lastName: 'Brown',
    employeeCode: 'EMP003',
    departmentName: 'Engineering',
    status: 'INACTIVE',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
};

describe('OffboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGetEmployees).mockReturnValue({
      data: { employees: mockEmployees, total: 3 },
      isLoading: false,
    } as any);
    vi.mocked(useGetOffboardImpact).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);
    vi.mocked(useExecuteOffboard).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it('renders the wizard title', () => {
    render(<OffboardingWizard />, { wrapper: createWrapper() });
    expect(screen.getByText('Enterprise Offboarding Wizard')).toBeInTheDocument();
  });

  it('renders all 6 stepper steps', () => {
    render(<OffboardingWizard />, { wrapper: createWrapper() });
    expect(screen.getByText('Select Employee')).toBeInTheDocument();
    expect(screen.getByText('Impact Analysis')).toBeInTheDocument();
    expect(screen.getByText('Transfer People')).toBeInTheDocument();
    expect(screen.getByText('Projects & Tasks')).toBeInTheDocument();
    expect(screen.getByText('Leaves & Timesheets')).toBeInTheDocument();
    expect(screen.getByText('Review & Confirm')).toBeInTheDocument();
  });

  it('shows employee cards on step 0', () => {
    render(<OffboardingWizard />, { wrapper: createWrapper() });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('EMP001')).toBeInTheDocument();
    expect(screen.getByText('EMP002')).toBeInTheDocument();
  });

  it('does NOT show INACTIVE employee cards', () => {
    render(<OffboardingWizard />, { wrapper: createWrapper() });
    expect(screen.queryByText('Bob Brown')).not.toBeInTheDocument();
  });

  it('shows the search field on step 0', () => {
    render(<OffboardingWizard />, { wrapper: createWrapper() });
    const searchInput = screen.getByPlaceholderText(/search by name/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('filters employees by search input', () => {
    render(<OffboardingWizard />, { wrapper: createWrapper() });
    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'Jane' } });
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows "Next" button on step 0 but it should be disabled until employee selected', () => {
    render(<OffboardingWizard />, { wrapper: createWrapper() });
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
  });

  it('enables "Next" after selecting an employee', () => {
    render(<OffboardingWizard />, { wrapper: createWrapper() });
    const emp1Card = screen.getByText('John Doe').closest('[role="button"]')?.parentElement?.parentElement
      || screen.getByText('John Doe');
    fireEvent.click(emp1Card);
    const nextButton = screen.getByText('Next');
    expect(nextButton).not.toBeDisabled();
  });

  it('navigates to step 1 when Next is clicked', () => {
    render(<OffboardingWizard />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText('John Doe'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getAllByText('Impact Analysis').length).toBeGreaterThanOrEqual(2);
  });

  it('shows Back button after moving past step 0', () => {
    render(<OffboardingWizard />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText('John Doe'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getAllByText('Back').length).toBeGreaterThanOrEqual(2);
  });

  it('shows impact analysis loading state', () => {
    vi.mocked(useGetOffboardImpact).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(<OffboardingWizard />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText('John Doe'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText(/analysing dependencies/i)).toBeInTheDocument();
  });

  it('renders impact cards when impact data is available', () => {
    vi.mocked(useGetOffboardImpact).mockReturnValue({
      data: {
        employeeId: 'emp-1',
        employeeName: 'John Doe',
        currentStatus: 'ACTIVE',
        directReports: {
          count: 2,
          items: [{ id: 'r1', name: 'Report A' }, { id: 'r2', name: 'Report B' }],
        },
        teamsLed: { count: 1, items: [{ id: 't1', name: 'Team X' }] },
        departmentsHeaded: { count: 0, items: [] },
        projectsAsPm: { count: 3, items: [] },
        activeTasks: { count: 5, items: [] },
        pendingLeaves: { count: 1, items: [] },
        pendingTimeEntries: { count: 0, items: [] },
        projectMemberships: { count: 2, items: [] },
        warnings: [],
      },
      isLoading: false,
    } as any);

    render(<OffboardingWizard />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText('John Doe'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Direct Reports')).toBeInTheDocument();
    expect(screen.getByText('Teams Led')).toBeInTheDocument();
    expect(screen.getByText('Projects as PM')).toBeInTheDocument();
  });

  it('shows alert with success when no impact warnings', () => {
    vi.mocked(useGetOffboardImpact).mockReturnValue({
      data: {
        employeeId: 'emp-1',
        employeeName: 'John Doe',
        currentStatus: 'ACTIVE',
        directReports: { count: 0, items: [] },
        teamsLed: { count: 0, items: [] },
        departmentsHeaded: { count: 0, items: [] },
        projectsAsPm: { count: 0, items: [] },
        activeTasks: { count: 0, items: [] },
        pendingLeaves: { count: 0, items: [] },
        pendingTimeEntries: { count: 0, items: [] },
        projectMemberships: { count: 0, items: [] },
        warnings: [],
      },
      isLoading: false,
    } as any);

    render(<OffboardingWizard />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText('John Doe'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText(/No critical dependencies detected/i)).toBeInTheDocument();
  });

  it('shows warning alerts when impact has warnings', () => {
    vi.mocked(useGetOffboardImpact).mockReturnValue({
      data: {
        employeeId: 'emp-1',
        employeeName: 'John Doe',
        currentStatus: 'ACTIVE',
        directReports: { count: 0, items: [] },
        teamsLed: { count: 0, items: [] },
        departmentsHeaded: { count: 0, items: [] },
        projectsAsPm: { count: 0, items: [] },
        activeTasks: { count: 0, items: [] },
        pendingLeaves: { count: 0, items: [] },
        pendingTimeEntries: { count: 0, items: [] },
        projectMemberships: { count: 0, items: [] },
        warnings: [{ severity: 'warning', message: 'Employee has critical dependencies' }],
      },
      isLoading: false,
    } as any);

    render(<OffboardingWizard />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText('John Doe'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Employee has critical dependencies')).toBeInTheDocument();
  });

  it('renders Transfer People step with alerts when no transfers needed', () => {
    vi.mocked(useGetOffboardImpact).mockReturnValue({
      data: {
        employeeId: 'emp-1',
        employeeName: 'John Doe',
        currentStatus: 'ACTIVE',
        directReports: { count: 0, items: [] },
        teamsLed: { count: 0, items: [] },
        departmentsHeaded: { count: 0, items: [] },
        projectsAsPm: { count: 0, items: [] },
        activeTasks: { count: 0, items: [] },
        pendingLeaves: { count: 0, items: [] },
        pendingTimeEntries: { count: 0, items: [] },
        projectMemberships: { count: 0, items: [] },
        warnings: [],
      },
      isLoading: false,
    } as any);

    render(<OffboardingWizard />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText('John Doe'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText(/No people transfers required/i)).toBeInTheDocument();
  });

  it('shows help text describing the wizard purpose on step 0', () => {
    render(<OffboardingWizard />, { wrapper: createWrapper() });
    expect(screen.getByText(/choose employee to offboard/i)).toBeInTheDocument();
    expect(screen.getByText(/only active employees are shown/i)).toBeInTheDocument();
  });

  it('navigates back to employees on "Back" button click in header', () => {
    render(<OffboardingWizard />, { wrapper: createWrapper() });
    const backButtons = screen.getAllByText('Back');
    const headerBack = backButtons[0];
    fireEvent.click(headerBack);
    expect(mockNavigate).toHaveBeenCalledWith('/hr/employees');
  });
});
