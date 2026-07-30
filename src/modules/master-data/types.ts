export interface TaskTemplate {
  id: string;
  templateCode: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTemplateCreate {
  title: string;
  description?: string;
}

export interface TaskTemplateUpdate {
  title?: string;
  description?: string;
  isActive?: boolean;
}

export interface TaskTemplateSearchItem {
  id: string;
  templateCode: string;
  title: string;
  description?: string;
}

export interface TaskTemplateListResponse {
  templates: TaskTemplate[];
  total: number;
  skip: number;
  limit: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  holidayType: string;
  description?: string;
  isActive: boolean;
  affectsWorkingDays: boolean;
}

export interface HolidayCreate {
  name: string;
  date: string;
  holidayType: string;
  description?: string;
  affectsWorkingDays?: boolean;
}

export interface HolidayUpdate {
  name?: string;
  date?: string;
  holidayType?: string;
  description?: string;
  isActive?: boolean;
  affectsWorkingDays?: boolean;
}

export interface CompanyEvent {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  eventSubtype?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  color?: string;
  textColor?: string;
  isActive: boolean;
  affectsWorkingDays: boolean;
}

export interface CompanyEventCreate {
  title: string;
  description?: string;
  eventType?: string;
  eventSubtype?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  color?: string;
  textColor?: string;
  affectsWorkingDays?: boolean;
}

export interface CompanyEventUpdate {
  title?: string;
  description?: string;
  eventSubtype?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  color?: string;
  textColor?: string;
  isActive?: boolean;
  affectsWorkingDays?: boolean;
}

export interface CalendarSettings {
  workingDays: string;
  weekendDays: string;
  weeklyOffRules: Record<string, number[]> | null;
  officeStartTime: string;
  officeEndTime: string;
  defaultDailyHours: number;
  workingHoursPerDay: number;
  enableBirthdays: boolean;
  enableCompanyEvents: boolean;
  enableHolidays: boolean;
  enableTaskEvents: boolean;
  enableProjectEvents: boolean;
  colorHoliday: string;
  colorBirthday: string;
  colorTask: string;
  colorProject: string;
  colorCompanyEvent: string;
}

