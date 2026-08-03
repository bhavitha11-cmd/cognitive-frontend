export type ConnectionType = 'DIRECT' | 'DATABASE' | 'REST_API' | 'ADMS_PUSH';

export interface DirectDeviceConfig {
  connection_type: 'DIRECT';
  ip_address: string;
  port: number;
  password: string;
  timeout_seconds: number;
  auto_sync: boolean;
  sync_interval_minutes: number;
}

export interface DatabaseConfig {
  connection_type: 'DATABASE';
  db_type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  use_ssl: boolean;
}

export interface RestAPIConfig {
  connection_type: 'REST_API';
  base_url: string;
  auth_type: string;
  token: string;
  custom_headers: Record<string, string>;
}

export type ConnectionConfig = DirectDeviceConfig | DatabaseConfig | RestAPIConfig;

export interface ConnectionProfile {
  id: string;
  device_id: string;
  connection_type: ConnectionType;
  is_primary: boolean;
  is_active: boolean;
  config_summary?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
