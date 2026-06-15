export interface DashboardStats {
  totalClients: number
  activeClients: number
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalTasks: number
  pendingTasks: number
  inProgressTasks: number
  completedTasks: number
  overdueTasks: number
  totalEmployees: number
  activeEmployees: number
  presentToday: number
  totalEstimatedHours: number
  totalActualHours: number
  overrunPercentage: number
}

export interface PlanVsActualProject {
  id: string
  projectCode: string
  name: string
  clientName?: string
  status: string
  estimatedHours: number
  actualHours: number
  overrunHours: number
  overrunPercentage: number
  taskCount: number
  completedTaskCount: number
  plannedEndDate?: string
}

export interface PlanVsActualData {
  projects: PlanVsActualProject[]
  totalEstimated: number
  totalActual: number
  totalOverrun: number
  overallOverrunPct: number
}

export interface EmployeeUtil {
  id: string
  employeeCode: string
  employeeName: string
  departmentName?: string
  totalHoursLogged: number
  billableHours: number
  taskCount: number
  lateDays: number
  absenceDays: number
  utilizationPercentage: number
}

export interface UtilizationData {
  employees: EmployeeUtil[]
  periodStart: string
  periodEnd: string
  totalHoursCompany: number
}

export interface DepartmentLoad {
  department: string
  estimatedHours: number
  actualHours: number
  taskCount: number
  overrunPercentage: number
}

export interface OverdueTask {
  id: string
  taskCode: string
  title: string
  projectId: string
  projectName: string
  status: string
  priority: string
  plannedDeliveryDate?: string
  estimatedHours: number
  actualHours: number
  daysOverdue: number
  assigneeName?: string
}

export interface ClientPerf {
  id: string
  name: string
  totalProjects: number
  activeProjects: number
  completedProjects: number
  delayedProjects: number
  totalEstimatedHours: number
  totalActualHours: number
  onTimeDeliveryPct: number
}

export interface ClientPerfData {
  clients: ClientPerf[]
}

export interface ScopeDist {
  scopeCode?: string
  scopeName?: string
  departmentCategory?: string
  estimatedHours: number
  actualHours: number
  taskCount: number
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  allDay: boolean
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps?: {
    type: string
    status?: string
    project?: string
    task_code?: string
    overdue?: boolean
  }
}
