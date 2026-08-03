export type CurrentStatus = 'IN' | 'OUT' | 'NOT_PUNCHED';

export interface LiveAttendanceRecord {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department_name?: string;
  current_status: CurrentStatus;
  last_punch_time?: string;
  last_punch_type?: string;
  device_name?: string;
  device_id?: string;
  verification_mode?: string;
  branch?: string;
}
