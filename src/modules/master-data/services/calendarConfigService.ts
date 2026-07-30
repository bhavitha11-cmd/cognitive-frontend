import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import type {
  Holiday,
  HolidayCreate,
  HolidayUpdate,
  CompanyEvent,
  CompanyEventCreate,
  CompanyEventUpdate,
  CalendarSettings,
} from '../types';

// ── Holiday Mappings ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapHolidayBackendToFrontend = (h: any): Holiday => ({
  id: h.id,
  name: h.name,
  date: h.date,
  holidayType: h.holiday_type || 'PUBLIC',
  description: h.description || undefined,
  isActive: h.is_active ?? true,
  affectsWorkingDays: h.affects_working_days ?? true,
});

const mapHolidayFrontendToBackend = (data: any) => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.date !== undefined) payload.date = data.date;
  if (data.holidayType !== undefined) payload.holiday_type = data.holidayType;
  if (data.description !== undefined) payload.description = data.description || null;
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  if (data.affectsWorkingDays !== undefined) payload.affects_working_days = data.affectsWorkingDays;
  return payload;
};

// ── Company Event Mappings ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapCompanyEventBackendToFrontend = (e: any): CompanyEvent => ({
  id: e.id,
  title: e.title,
  description: e.description || undefined,
  eventType: e.event_type || 'COMPANY_EVENT',
  eventSubtype: e.event_subtype || undefined,
  startDate: e.start_date,
  endDate: e.end_date || undefined,
  startTime: e.start_time || undefined,
  endTime: e.end_time || undefined,
  isAllDay: e.is_all_day ?? true,
  color: e.color || undefined,
  textColor: e.text_color || e.textColor || undefined,
  isActive: e.is_active ?? true,
  affectsWorkingDays: e.affects_working_days ?? false,
});

const mapCompanyEventFrontendToBackend = (data: any) => {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description || null;
  if (data.eventType !== undefined) payload.event_type = data.eventType;
  if (data.eventSubtype !== undefined) payload.event_subtype = data.eventSubtype || null;
  if (data.startDate !== undefined) payload.start_date = data.startDate;
  if (data.endDate !== undefined) payload.end_date = data.endDate || null;
  if (data.startTime !== undefined) payload.start_time = data.startTime || null;
  if (data.endTime !== undefined) payload.end_time = data.endTime || null;
  if (data.isAllDay !== undefined) payload.is_all_day = data.isAllDay;
  if (data.color !== undefined) payload.color = data.color || null;
  if (data.textColor !== undefined) payload.text_color = data.textColor || null;
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  if (data.affectsWorkingDays !== undefined) payload.affects_working_days = data.affectsWorkingDays;
  return payload;
};

// ── Settings Mappings ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSettingsBackendToFrontend = (s: any): CalendarSettings => ({
  workingDays: s.working_days || 'MON,TUE,WED,THU,FRI,SAT',
  weekendDays: s.weekend_days || 'SUN',
  weeklyOffRules: s.weekly_off_rules || null,
  officeStartTime: s.office_start_time || '09:00',
  officeEndTime: s.office_end_time || '18:00',
  defaultDailyHours: s.default_daily_hours ?? 8.0,
  workingHoursPerDay: s.working_hours_per_day ?? 8.0,
  enableBirthdays: s.enable_birthdays ?? true,
  enableCompanyEvents: s.enable_company_events ?? true,
  enableHolidays: s.enable_holidays ?? true,
  enableTaskEvents: s.enable_task_events ?? true,
  enableProjectEvents: s.enable_project_events ?? true,
  colorHoliday: s.color_holiday || '#EF4444',
  colorBirthday: s.color_birthday || '#EC4899',
  colorTask: s.color_task || '#3B82F6',
  colorProject: s.color_project || '#10B981',
  colorCompanyEvent: s.color_company_event || '#8B5CF6',
});

const mapSettingsFrontendToBackend = (s: Partial<CalendarSettings>) => {
  const payload: Record<string, unknown> = {};
  if (s.workingDays !== undefined) payload.working_days = s.workingDays;
  if (s.weekendDays !== undefined) payload.weekend_days = s.weekendDays;
  if (s.weeklyOffRules !== undefined) payload.weekly_off_rules = s.weeklyOffRules;
  if (s.officeStartTime !== undefined) payload.office_start_time = s.officeStartTime;
  if (s.officeEndTime !== undefined) payload.office_end_time = s.officeEndTime;
  if (s.defaultDailyHours !== undefined) payload.default_daily_hours = s.defaultDailyHours;
  if (s.workingHoursPerDay !== undefined) payload.working_hours_per_day = s.workingHoursPerDay;
  if (s.enableBirthdays !== undefined) payload.enable_birthdays = s.enableBirthdays;
  if (s.enableCompanyEvents !== undefined) payload.enable_company_events = s.enableCompanyEvents;
  if (s.enableHolidays !== undefined) payload.enable_holidays = s.enableHolidays;
  if (s.enableTaskEvents !== undefined) payload.enable_task_events = s.enableTaskEvents;
  if (s.enableProjectEvents !== undefined) payload.enable_project_events = s.enableProjectEvents;
  if (s.colorHoliday !== undefined) payload.color_holiday = s.colorHoliday;
  if (s.colorBirthday !== undefined) payload.color_birthday = s.colorBirthday;
  if (s.colorTask !== undefined) payload.color_task = s.colorTask;
  if (s.colorProject !== undefined) payload.color_project = s.colorProject;
  if (s.colorCompanyEvent !== undefined) payload.color_company_event = s.colorCompanyEvent;
  return payload;
};

// ── Holiday Hooks ────────────────────────────────────────────────────────────

export interface HolidayListParams {
  skip?: number;
  limit?: number;
  year?: number;
  holidayType?: string;
  isActive?: boolean;
  search?: string;
}

export const useGetHolidays = (params?: HolidayListParams) => {
  return useQuery({
    queryKey: ['holidays', params],
    queryFn: async () => {
      const queryParams: Record<string, unknown> = {};
      if (params?.skip !== undefined) queryParams.skip = params.skip;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.year !== undefined) queryParams.year = params.year;
      if (params?.holidayType) queryParams.holiday_type = params.holidayType;
      if (params?.isActive !== undefined) queryParams.is_active = params.isActive;
      if (params?.search) queryParams.search = params.search;

      const response = await api.get('/holidays', { params: queryParams });
      const data = response.data?.data || response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any[] = data?.holidays || [];
      return {
        holidays: raw.map(mapHolidayBackendToFrontend),
        total: data?.total ?? raw.length,
        skip: data?.skip ?? 0,
        limit: data?.limit ?? raw.length,
      };
    },
  });
};

export const useCreateHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: HolidayCreate) => {
      const payload = mapHolidayFrontendToBackend(data);
      const response = await api.post('/holidays', payload);
      const raw = response.data?.data?.holiday || response.data?.data || response.data;
      return mapHolidayBackendToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'calendar-events'] });
    },
  });
};

export const useUpdateHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: HolidayUpdate }) => {
      const payload = mapHolidayFrontendToBackend(data);
      const response = await api.put(`/holidays/${id}`, payload);
      const raw = response.data?.data?.holiday || response.data?.data || response.data;
      return mapHolidayBackendToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'calendar-events'] });
    },
  });
};

export const useToggleHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/holidays/${id}/toggle`);
      const raw = response.data?.data?.holiday || response.data?.data || response.data;
      return mapHolidayBackendToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'calendar-events'] });
    },
  });
};

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/holidays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'calendar-events'] });
    },
  });
};

// ── Company Event Hooks ──────────────────────────────────────────────────────

export interface CompanyEventListParams {
  skip?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
  isActive?: boolean;
}

export const useGetCompanyEvents = (params?: CompanyEventListParams) => {
  return useQuery({
    queryKey: ['company-events', params],
    queryFn: async () => {
      const queryParams: Record<string, unknown> = {};
      if (params?.skip !== undefined) queryParams.skip = params.skip;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.fromDate) queryParams.from_date = params.fromDate;
      if (params?.toDate) queryParams.to_date = params.toDate;
      if (params?.isActive !== undefined) queryParams.is_active = params.isActive;

      const response = await api.get('/company-events', { params: queryParams });
      const data = response.data?.data || response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any[] = data?.events || [];
      return {
        events: raw.map(mapCompanyEventBackendToFrontend),
        total: data?.total ?? raw.length,
        skip: data?.skip ?? 0,
        limit: data?.limit ?? raw.length,
      };
    },
  });
};

export const useCreateCompanyEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CompanyEventCreate) => {
      const payload = mapCompanyEventFrontendToBackend(data);
      const response = await api.post('/company-events', payload);
      const raw = response.data?.data?.event || response.data?.data || response.data;
      return mapCompanyEventBackendToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'calendar-events'] });
    },
  });
};

export const useUpdateCompanyEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyEventUpdate }) => {
      const payload = mapCompanyEventFrontendToBackend(data);
      const response = await api.put(`/company-events/${id}`, payload);
      const raw = response.data?.data?.event || response.data?.data || response.data;
      return mapCompanyEventBackendToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'calendar-events'] });
    },
  });
};

export const useDeleteCompanyEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/company-events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'calendar-events'] });
    },
  });
};

// ── Calendar Settings Hooks ──────────────────────────────────────────────────

export const useGetCalendarSettings = () => {
  return useQuery<CalendarSettings>({
    queryKey: ['calendar-settings'],
    queryFn: async () => {
      const response = await api.get('/calendar/settings');
      const raw = response.data?.data || response.data;
      return mapSettingsBackendToFrontend(raw);
    },
  });
};

export const useUpdateCalendarSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CalendarSettings>) => {
      const payload = mapSettingsFrontendToBackend(data);
      const response = await api.put('/calendar/settings', payload);
      const raw = response.data?.data || response.data;
      return mapSettingsBackendToFrontend(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-settings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'calendar-events'] });
    },
  });
};

export const useGetCalendarConfigEvents = (fromDate: string, toDate: string) => {
  return useQuery<any[]>({
    queryKey: ['calendar-config', 'events', fromDate, toDate],
    enabled: !!fromDate && !!toDate,
    queryFn: async () => {
      const response = await api.get('/calendar/events', {
        params: { from_date: fromDate, to_date: toDate },
      });
      const data = response.data?.data || response.data;
      return data?.events || [];
    },
  });
};
