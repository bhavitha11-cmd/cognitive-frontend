export interface Task {
  id: string;
  taskCode: string;
  title: string;
  description?: string;
  projectId: string;
  projectName?: string;
  parentTaskId?: string;
  scopeOfWorkId?: string;
  scopeName?: string;
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  departmentCategory?: 'CAD' | 'CAM' | 'GEN' | 'SALES' | 'ADMIN' | 'MKRT' | 'SUPRT';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'REOPENED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedHours: number;
  actualHours: number;
  progress: number; // 0.0 to 1.0
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  receivedDate?: string;
  plannedDeliveryDate?: string;
  actualDeliveryDate?: string;
  remarks?: string;
  isActive: boolean;
  assignments: TaskAssignment[];
  assigneeCount: number;
  reworkCount?: number;
  totalReworkHours?: number;
  originalEstimatedHours?: number;
  createdAt?: string;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  assignedHours: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedAt?: string;
}

export interface ScopeOfWork {
  id: string;
  code: string;
  name: string;
  departmentCategory: string;
  isActive: boolean;
}

export interface TaskCreate {
  taskCode: string;
  projectId: string;
  title: string;
  description?: string;
  scopeOfWorkId?: string;
  teamId?: string;
  departmentCategory?: string;
  status?: string;
  priority?: string;
  estimatedHours?: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  receivedDate?: string;
  plannedDeliveryDate?: string;
  remarks?: string;
  assignedEmployeeId?: string;
}
