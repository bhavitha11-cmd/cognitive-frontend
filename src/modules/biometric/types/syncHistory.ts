export type SyncStatus = 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';
export type SyncType = 'MANUAL' | 'SCHEDULED' | 'INCREMENTAL' | 'RETRY';

export interface SyncHistory {
  id: string;
  device_id: string;
  device_name?: string;
  sync_type: SyncType;
  started_at: string;
  ended_at?: string;
  records_read: number;
  records_saved: number;
  duplicates_found: number;
  errors_count: number;
  status: SyncStatus;
  error_message?: string;
  retry_count: number;
  duration_seconds?: number;
}
