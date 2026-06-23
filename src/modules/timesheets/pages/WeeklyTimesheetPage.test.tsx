import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';

// Mock the API module
vi.mock('../../../utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  parseError: (err: any) => err?.message || 'Unknown error',
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import { WeeklyTimesheetPage } from './WeeklyTimesheetPage';
import { api } from '../../../utils/api';

// ==========================================
// TEST HELPERS
// ==========================================

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
};

describe('WeeklyTimesheetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    // Set up a mock user profile
    localStorageMock.setItem('cognitive_profile', JSON.stringify({
      id: 'emp-1',
      employee_id: 'emp-1',
      name: 'Test User',
      roles: ['Engineer'],
    }));
  });

  it('renders the page title', () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { tasks: [], items: [] } } });

    render(<WeeklyTimesheetPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Weekly Timesheet')).toBeInTheDocument();
  });

  it('shows week navigation controls', () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { tasks: [], items: [] } } });

    render(<WeeklyTimesheetPage />, { wrapper: createWrapper() });

    // Check for navigation buttons and today button
    const buttons = screen.getAllByRole('button');
    const navButtons = buttons.filter(b =>
      b.querySelector('svg') || b.textContent?.includes('List View')
    );
    expect(navButtons.length).toBeGreaterThan(0);
  });

  it('shows "List View" button to switch views', () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { tasks: [], items: [] } } });

    render(<WeeklyTimesheetPage />, { wrapper: createWrapper() });

    expect(screen.getByText('List View')).toBeInTheDocument();
  });

  it('shows Save button', () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { tasks: [], items: [] } } });

    render(<WeeklyTimesheetPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('calls API to fetch tasks on mount', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { tasks: [], items: [] } } });

    render(<WeeklyTimesheetPage />, { wrapper: createWrapper() });

    // Should have called GET /tasks with assigned_to param
    await vi.waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/tasks', expect.objectContaining({
        params: expect.objectContaining({ assigned_to: 'emp-1' }),
      }));
    });
  });

  it('renders assigned tasks in the grid', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: {
          tasks: [
            { id: 't1', task_code: 'TASK-001', title: 'Design Review', project_id: 'p1', project_name: 'Project A', department_category: 'CAD', is_active: true },
          ],
          items: [],
        },
      },
    });

    render(<WeeklyTimesheetPage />, { wrapper: createWrapper() });

    await vi.waitFor(() => {
      expect(screen.getByText('TASK-001')).toBeInTheDocument();
      expect(screen.getByText('Design Review')).toBeInTheDocument();
    });
  });

  it('shows empty state when no tasks', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { tasks: [], items: [] } } });

    render(<WeeklyTimesheetPage />, { wrapper: createWrapper() });

    await vi.waitFor(() => {
      expect(screen.getByText(/No assigned tasks found/i)).toBeInTheDocument();
    });
  });
});
