export type DeviceStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type DeviceVendor = 'ESSL' | 'ZKTECO' | 'MATRIX' | 'SUPREMA' | 'REALTIME' | 'MANTRA';
export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN';

export interface BiometricDevice {
  id: string;
  device_name: string;
  vendor: DeviceVendor;
  model?: string;
  serial_number?: string;
  organization_id: string;
  branch?: string;
  timezone: string;
  status: DeviceStatus;
  description?: string;
  is_active: boolean;
  last_sync_at?: string;
  last_seen_at?: string;
  connection_status?: ConnectionStatus;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceListResponse {
  devices: BiometricDevice[];
  total: number;
  page: number;
  page_size: number;
}

export interface DeviceCreatePayload {
  device_name: string;
  vendor: string;
  model?: string;
  serial_number?: string;
  organization_id: string;
  branch?: string;
  timezone?: string;
  status?: string;
  description?: string;
}
