export type CurrentStatus = 'IN' | 'OUT' | 'NOT_PUNCHED';

export interface TodayPunchItem {
  punch_time: string;
  punch_type: string;
  verification_type?: string;
}

export interface LiveAttendanceRecord {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department_name?: string;
  current_status: CurrentStatus;
  first_in_time?: string;
  last_punch_time?: string;
  last_punch_type?: string;
  total_in_seconds?: number;
  total_in_time_formatted?: string;
  total_out_seconds?: number;
  total_out_time_formatted?: string;
  remaining_seconds?: number;
  remaining_time_formatted?: string;
  target_work_hours?: number;
  is_shift_completed?: boolean;
  today_punches_count?: number;
  today_punches_list?: TodayPunchItem[];
  device_name?: string;
  device_id?: string;
  verification_mode?: string;
  branch?: string;
}
