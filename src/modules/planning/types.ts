export interface EmployeeSchedule {
  id: string
  employeeId: string
  employeeName?: string
  employeeCode?: string
  weekStartDate: string
  availableHours: number
  createdAt?: string
}

export interface EmployeeScheduleCreate {
  employeeId: string
  weekStartDate: string
  availableHours: number
}

export interface TaskDependency {
  id: string
  taskId: string
  dependsOnTaskId: string
  taskCode?: string
  taskTitle?: string
  dependsOnTaskCode?: string
  dependsOnTaskTitle?: string
  dependencyType: string
  createdAt?: string
}

export interface TaskDependencyCreate {
  taskId: string
  dependsOnTaskId: string
  dependencyType?: string
}

export interface CapacityWeek {
  weekStartDate: string
  availableHours: number
  scheduledHours: number
  utilizationPct: number
}

export interface EmployeeCapacity {
  employeeId: string
  employeeName: string
  weeks: CapacityWeek[]
}

export interface GanttTask {
  id: string
  taskCode: string
  title: string
  scheduledStartDate?: string
  scheduledEndDate?: string
  plannedStartDate?: string
  plannedEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  progress: number
  estimatedHours: number
  actualHours: number
  status: string
  priority: string
  assignees: Array<{employeeId?: string; employeeName?: string; assignedHours: number}>
  projectId: string
}

export interface GanttDependency {
  id: string
  taskId: string
  dependsOnTaskId: string
  dependencyType: string
}

export interface GanttData {
  tasks: GanttTask[]
  dependencies: GanttDependency[]
}
