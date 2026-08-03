export interface DeviceHealth {
  id: string;
  device_id: string;
  device_name?: string;
  firmware_version?: string;
  storage_used_pct?: number;
  registered_users_count?: number;
  connection_status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN';
  last_successful_sync_at?: string;
  last_error?: string;
  last_checked_at: string;
  response_time_ms?: number;
}

export interface ConnectionTestResult {
  status: 'connected' | 'failed';
  device_model?: string;
  firmware_version?: string;
  device_time?: string;
  registered_users?: number;
  last_attendance_time?: string;
  response_time_ms?: number;
  error_code?: string;
  message: string;
  suggestions: string[];
}
