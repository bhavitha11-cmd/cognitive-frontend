export interface TimeEntry {
  id: string
  employeeId: string
  employeeName?: string
  employeeCode?: string
  taskId: string
  taskCode?: string
  taskTitle?: string
  projectId: string
  projectName?: string
  date: string // ISO date string "YYYY-MM-DD"
  hoursSpent: number
  description?: string
  entryType: 'REGULAR' | 'OVERTIME' | 'CORRECTION'
  isBillable: boolean
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  submittedAt?: string
  approvedBy?: string
  approvedByName?: string
  approvedAt?: string
  rejectionReason?: string
  createdAt?: string
}

export interface TimeEntryCreate {
  employeeId?: string
  taskId: string
  date: string
  hoursSpent: number
  description?: string
  entryType?: string
  isBillable?: boolean
}

export interface TimesheetSummary {
  employeeId: string
  employeeName: string
  periodStart: string
  periodEnd: string
  totalHours: number
  billableHours: number
  approvedHours: number
  byProject: Array<{ projectId: string; projectName: string; hours: number }>
  byTask: Array<{ taskId: string; taskCode: string; taskTitle: string; hours: number }>
}

export interface TimeEntryListResponse {
  entries: TimeEntry[]
  total: number
  skip: number
  limit: number
}

// ==========================================
// LEAVE MANAGEMENT TYPES
// ==========================================

export interface LeaveType {
  id: string
  code: string
  name: string
  daysPerYear: number
  isPaid: boolean
  isCarryForward: boolean
  maxCarryForwardDays: number
  requiresApproval: boolean
  color: string
  description?: string
  isActive: boolean
  requiresDocument: boolean
}

export interface LeaveBalance {
  id: string
  employeeId: string
  employeeName?: string
  leaveTypeId: string
  leaveTypeName?: string
  leaveTypeCode?: string
  year: number
  totalAllowed: number
  used: number
  carriedForward: number
  remaining: number
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName?: string
  employeeCode?: string
  leaveTypeId: string
  leaveTypeName?: string
  leaveTypeCode?: string
  fromDate: string
  toDate: string
  totalDays: number
  reason?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  appliedAt?: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  hrNotes?: string
  approvalSteps?: any[]
  documentUrl?: string
  isHalfDay: boolean
  halfDaySession?: string
}

export interface LeaveRequestCreate {
  leaveTypeId: string
  fromDate: string
  toDate: string
  reason?: string
  documentUrl?: string
  isHalfDay?: boolean
  halfDaySession?: string
}
