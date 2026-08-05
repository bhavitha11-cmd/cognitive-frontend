export type PunchType = 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT' | 'UNKNOWN';
export type VerificationType = 'FP' | 'CARD' | 'PIN' | 'FACE' | 'PALM' | 'UNKNOWN';
export type ProcessingStatus = 'PENDING' | 'PROCESSED' | 'ERROR';

export interface BiometricLog {
  id: string;
  raw_log_id: string;
  employee_id: string;
  device_id: string;
  punch_timestamp: string;
  punch_type: PunchType;
  verification_type?: VerificationType;
  normalized_at: string;
  processing_status: ProcessingStatus;
  error_message?: string;
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  device_name?: string;
}

export interface BiometricLogFilters {
  from_date?: string;
  to_date?: string;
  employee_id?: string;
  device_id?: string;
  department_id?: string;
  punch_type?: string;
  verification_type?: string;
  page?: number;
  page_size?: number;
}
