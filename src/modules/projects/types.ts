export interface Project {
  id: string;
  projectCode: string;
  name: string;
  description?: string;
  clientId: string;
  clientName?: string;
  projectManagerId?: string;
  projectManagerName?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  billingType: 'FIXED' | 'TIME_AND_MATERIAL' | 'RETAINER' | 'INTERNAL';
  isBillable: boolean;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedHours: number;
  contractHours?: number;
  invoiceStatus: 'PENDING' | 'INVOICED' | 'PARTIALLY_INVOICED' | 'NOT_APPLICABLE';
  tokForm?: string;
  feedbackStatus: 'PENDING' | 'RECEIVED' | 'POSITIVE' | 'NEGATIVE' | 'NA';
  isActive: boolean;
  taskCount: number;
  completedTaskCount: number;
  actualHours: number;
  createdAt?: string;
}

export interface ProjectCreate {
  projectCode: string;
  name: string;
  description?: string;
  clientId: string;
  projectManagerId?: string;
  status?: string;
  priority?: string;
  billingType?: string;
  isBillable?: boolean;
  plannedStartDate?: string;
  plannedEndDate?: string;
  estimatedHours?: number;
  contractHours?: number;
  invoiceStatus?: string;
  tokForm?: string;
  feedbackStatus?: string;
}

export interface ProjectUpdate extends Partial<ProjectCreate> {}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  skip: number;
  limit: number;
}

export interface ProjectListParams {
  skip?: number;
  limit?: number;
  search?: string;
  clientId?: string;
  status?: string;
}
