export interface Project {
  id: string;
  partNumber: string;
  name: string;
  partName: string;
  description?: string;
  clientId: string;
  clientName?: string;
  projectManagerId?: string;
  projectManagerName?: string;
  departmentId: string;
  departmentName?: string;
  departmentCode?: string;
  status: 'Yet To Start' | 'In Progress' | 'Completed' | 'Cancelled' | 'On Hold';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
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
  statusReason?: string;
  isActive: boolean;
  taskCount: number;
  completedTaskCount: number;
  actualHours: number;
  createdAt?: string;
}

export interface ProjectCreate {
  partNumber: string;
  name: string;
  partName: string;
  description?: string;
  clientId: string;
  projectManagerId?: string;
  departmentId: string;
  status?: string;
  priority?: string;
  isBillable?: boolean;
  plannedStartDate?: string;
  plannedEndDate?: string;
  estimatedHours?: number;
  contractHours?: number;
  invoiceStatus?: string;
  tokForm?: string;
  feedbackStatus?: string;
  statusReason?: string;
}

export interface ProjectUpdate extends Partial<ProjectCreate> {}

export interface ParentProject {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  clientName?: string;
  projectManagerId?: string;
  projectManagerName?: string;
  departmentId: string;
  departmentName?: string;
  departmentCode?: string;
  isActive: boolean;
  partCount: number;
  status: string;
  progress: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedHours: number;
  actualHours: number;
  parts: Project[];
}

export interface ParentProjectCreate {
  name: string;
  description?: string;
  clientId: string;
  projectManagerId?: string;
  departmentId: string;
  parts: ProjectCreate[];
}

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

