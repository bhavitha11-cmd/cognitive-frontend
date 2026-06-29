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
  partNumber: string
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

// --- Executive Dashboard Types ---
export interface ExecutiveSummary {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  delayedProjects: number
  plannedHours: number
  actualHours: number
  remainingHours: number
  companyUtilizationPercentage: number
  employeesWorkingToday: number
  pendingTimesheetsCount: number
}

export interface ProjectStatusCount {
  status: string
  count: number
}

export interface DepartmentPerf {
  departmentName: string
  estimatedHours: number
  actualHours: number
  taskCount: number
}

export interface BurnTrendPoint {
  date: string
  hoursLogged: number
}

export interface EmployeeUtilPoint {
  employeeId: string
  employeeName: string
  utilizationPercentage: number
}

export interface ExecutiveCharts {
  projectStatuses: ProjectStatusCount[]
  departmentPerformances: DepartmentPerf[]
  plannedVsActual: Array<{
    projectName: string
    projectCode: string
    plannedHours: number
    actualHours: number
    overrunHours: number
  }>
  hoursBurnTrend: BurnTrendPoint[]
  employeeUtilization: EmployeeUtilPoint[]
}

export interface DashboardAlert {
  id: string
  level: 'info' | 'warning' | 'error'
  type: string
  message: string
  referenceId?: string
}

export interface ExecutiveAlerts {
  alerts: DashboardAlert[]
}

export interface RecentActivity {
  id: string
  action: string
  performedByName: string
  entityType: string
  entityCode: string
  timestamp: string
}

export interface ExecutiveRecentActivities {
  activities: RecentActivity[]
}

// --- Project Dashboard Types ---
export interface ProjectSummary {
  id: string
  projectCode: string
  name: string
  customerName?: string
  departmentName?: string
  projectManagerName?: string
  plannedHours: number
  actualHours: number
  remainingHours: number
  completionPercentage: number
  deliveryDate?: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
}

export interface BurnCurvePoint {
  date: string
  plannedCumulativeHours: number
  actualCumulativeHours: number
}

export interface DailyProgressPoint {
  date: string
  hoursLogged: number
}

export interface TaskTimeSummary {
  id: string
  taskCode: string
  title: string
  actualHours: number
  estimatedHours: number
}

export interface ProjectCharts {
  taskStatuses: Array<{ status: string; count: number }>
  burnCurve: BurnCurvePoint[]
  dailyProgress: DailyProgressPoint[]
  topTimeConsumingTasks: TaskTimeSummary[]
}

// --- Team Leader Dashboard Types ---
export interface TeamMemberAttendance {
  employeeId: string
  employeeName: string
  status: string
  clockIn?: string
  clockOut?: string
}

export interface TeamLeadSummary {
  totalTeamMembers: number
  todayAttendanceCount: number
  pendingApprovalsCount: number
  tasksInProgressCount: number
  delayedTasksCount: number
  overloadedEmployeesCount: number
  underutilizedEmployeesCount: number
}

export interface TeamWorkloadPoint {
  employeeId: string
  employeeName: string
  assignedHours: number
  availableHours: number
  utilizationPercentage: number
}

export interface TeamLeadCharts {
  employeeWorkload: TeamWorkloadPoint[]
  employeeProductivity: Array<{ employeeName: string; productivityPercentage: number }>
  taskCompletionsWeekly: Array<{ weekLabel: string; completedCount: number }>
  timesheetCompliance: Array<{ weekLabel: string; compliancePercentage: number }>
}

// --- Employee Dashboard Types ---
export interface EmployeeSummary {
  todayTasksCount: number
  upcomingTasksCount: number
  completedTasksCount: number
  pendingTasksCount: number
  todayHours: number
  weeklyHours: number
  monthlyHours: number
  remainingHours: number
  personalProductivityPercentage: number
}

export interface EmployeeCharts {
  dailyHours: Array<{ date: string; hoursLogged: number }>
  weeklyTrend: Array<{ weekLabel: string; hoursLogged: number }>
  hoursDistributionByProject: Array<{ projectName: string; hoursLogged: number }>
  timesheetStatusSummary: Array<{ status: string; count: number }>
}

// --- Employee Performance Dashboard Types ---
export interface EmployeePerformanceRow {
  employeeId: string
  employeeCode: string
  employeeName: string
  departmentName?: string
  teamName?: string
  utilizationPercentage: number
  plannedHours: number
  actualHours: number
  varianceHours: number
  taskCompletionPercentage: number
  averageHoursPerTask: number
  averageDelayDays: number
  reworkHours: number
  productivityScore: number
  efficiencyScore: number
  timesheetComplianceScore: number
  performanceRank: number
}

export interface PerformanceRankingsResponse {
  rankings: EmployeePerformanceRow[]
}

