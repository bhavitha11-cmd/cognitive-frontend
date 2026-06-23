import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

import { api } from '../../../utils/api';
import {
  useGetTimeEntries,
  useCreateTimeEntry,
  useDeleteTimeEntry,
  useSubmitTimeEntry,
  useApproveTimeEntry,
  useRejectTimeEntry,
} from './timesheetService';

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
        {children}
      </QueryClientProvider>
    );
  };
};

// ==========================================
// TESTS
// ==========================================

describe('useGetTimeEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /time-entries with correct params', async () => {
    const mockResponse = {
      data: {
        data: {
          time_entries: [
            {
              id: '1',
              employee_id: 'emp-1',
              task_id: 'task-1',
              project_id: 'proj-1',
              date: '2026-06-15',
              hours_spent: 4.0,
              entry_type: 'REGULAR',
              is_billable: true,
              status: 'DRAFT',
            },
          ],
          total: 1,
          skip: 0,
          limit: 50,
        },
      },
    };
    vi.mocked(api.get).mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useGetTimeEntries({ dateFrom: '2026-06-15', dateTo: '2026-06-21', limit: 50 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/time-entries', {
      params: expect.objectContaining({
        date_from: '2026-06-15',
        date_to: '2026-06-21',
        limit: 50,
      }),
    });
    expect(result.current.data?.total).toBe(1);
    expect(result.current.data?.entries[0].hoursSpent).toBe(4.0);
  });

  it('handles empty response gracefully', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { time_entries: [], total: 0 } } });

    const { result } = renderHook(
      () => useGetTimeEntries({ limit: 10 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.entries).toEqual([]);
    expect(result.current.data?.total).toBe(0);
  });

  it('maps snake_case backend fields to camelCase', async () => {
    const mockResponse = {
      data: {
        data: {
          time_entries: [
            {
              id: '2',
              employee_id: 'emp-2',
              employee_name: 'John Doe',
              employee_code: 'EMP002',
              task_id: 'task-2',
              task_code: 'TASK-002',
              task_title: 'Test Task',
              project_id: 'proj-2',
              project_name: 'Test Project',
              date: '2026-06-16',
              hours_spent: 6.5,
              description: 'Worked on feature',
              entry_type: 'OVERTIME',
              is_billable: false,
              status: 'SUBMITTED',
              submitted_at: '2026-06-16T10:00:00Z',
            },
          ],
          total: 1,
        },
      },
    };
    vi.mocked(api.get).mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useGetTimeEntries({}),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const entry = result.current.data!.entries[0];
    expect(entry.employeeId).toBe('emp-2');
    expect(entry.employeeName).toBe('John Doe');
    expect(entry.taskCode).toBe('TASK-002');
    expect(entry.taskTitle).toBe('Test Task');
    expect(entry.projectName).toBe('Test Project');
    expect(entry.hoursSpent).toBe(6.5);
    expect(entry.entryType).toBe('OVERTIME');
    expect(entry.isBillable).toBe(false);
    expect(entry.status).toBe('SUBMITTED');
  });
});

describe('useCreateTimeEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /time-entries with mapped payload', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          time_entry: {
            id: '3',
            employee_id: 'emp-1',
            task_id: 'task-1',
            project_id: 'proj-1',
            date: '2026-06-15',
            hours_spent: 3.5,
            entry_type: 'REGULAR',
            is_billable: true,
            status: 'DRAFT',
          },
        },
      },
    });

    const { result } = renderHook(() => useCreateTimeEntry(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      taskId: 'task-1',
      date: '2026-06-15',
      hoursSpent: 3.5,
    });

    expect(api.post).toHaveBeenCalledWith('/time-entries', {
      employee_id: undefined,
      task_id: 'task-1',
      date: '2026-06-15',
      hours_spent: 3.5,
      description: null,
      entry_type: 'REGULAR',
      is_billable: true,
    });
  });
});

describe('useDeleteTimeEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /time-entries/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useDeleteTimeEntry(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync('entry-123');

    expect(api.delete).toHaveBeenCalledWith('/time-entries/entry-123');
  });
});

describe('useSubmitTimeEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /time-entries/:id/submit', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          entry: { id: '1', employee_id: 'e1', task_id: 't1', project_id: 'p1', date: '2026-06-15', hours_spent: 4.0, entry_type: 'REGULAR', is_billable: true, status: 'SUBMITTED' },
        },
      },
    });

    const { result } = renderHook(() => useSubmitTimeEntry(), {
      wrapper: createWrapper(),
    });

    const entry = await result.current.mutateAsync('entry-1');
    expect(entry.status).toBe('SUBMITTED');
    expect(api.post).toHaveBeenCalledWith('/time-entries/entry-1/submit');
  });
});

describe('useApproveTimeEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /time-entries/:id/approve', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { data: { entry: { id: '1', employee_id: 'e1', task_id: 't1', project_id: 'p1', date: '2026-06-15', hours_spent: 4.0, entry_type: 'REGULAR', is_billable: true, status: 'APPROVED' } } },
    });

    const { result } = renderHook(() => useApproveTimeEntry(), {
      wrapper: createWrapper(),
    });

    const entry = await result.current.mutateAsync('entry-1');
    expect(entry.status).toBe('APPROVED');
    expect(api.post).toHaveBeenCalledWith('/time-entries/entry-1/approve');
  });
});

describe('useRejectTimeEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /time-entries/:id/reject with reason', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { data: { entry: { id: '1', employee_id: 'e1', task_id: 't1', project_id: 'p1', date: '2026-06-15', hours_spent: 4.0, entry_type: 'REGULAR', is_billable: true, status: 'REJECTED' } } },
    });

    const { result } = renderHook(() => useRejectTimeEntry(), {
      wrapper: createWrapper(),
    });

    const entry = await result.current.mutateAsync({
      id: 'entry-1',
      reason: 'Insufficient detail',
    });
    expect(entry.status).toBe('REJECTED');
    expect(api.post).toHaveBeenCalledWith('/time-entries/entry-1/reject', {
      reason: 'Insufficient detail',
    });
  });
});
