export type MappingMethod = 'MANUAL' | 'AUTO' | 'BULK';

export interface EmployeeMapping {
  id: string;
  employee_id: string;
  device_id: string;
  biometric_user_id: string;
  mapping_method: MappingMethod;
  is_active: boolean;
  mapped_at: string;
  created_at: string;
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  device_name?: string;
}

export interface BulkMappingItem {
  employee_code: string;
  biometric_user_id: string;
  device_serial: string;
}
