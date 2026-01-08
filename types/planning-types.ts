export type Complexity = "low" | "medium" | "high"

export type Priority = "low" | "medium" | "high"

export type GapLevel =
  | "sdk-native"
  | "minor-extension"
  | "moderate-extension"
  | "significant-extension"
  | "custom-implementation"

export type UseCaseStatus =
  | "high-level definition"
  | "groomed"
  | "defined"
  | "in development"
  | "completed"

export type TaskStatus = "todo" | "in-progress" | "done"

export type UseCaseDependencyType = "blocks" | "covered-by" | "depends-on" | "related-to"

export interface Developer {
  id: string
  name: string
  email: string
  capacity: number // hours per week
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  name: string
  description?: string
  systems?: string[]
  createdAt: string
  updatedAt: string
}

export interface UseCase {
  id: string
  clientId: string
  useCaseId: string // e.g., "US-1"
  title: string
  description?: string
  complexity: Complexity
  gap: GapLevel // 5-level system: 1=no gap, 5=very far
  manDays: number // calculated from complexity + gap
  sdkGaps?: string
  status: UseCaseStatus
  priority: Priority
  startDate?: string // ISO date string
  assignedDeveloperIds?: string[] // array of developer IDs - multiple developers per use case
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  useCaseId: string
  title: string
  description?: string
  estimatedHours: number
  assignedDeveloperIds: string[] // array of developer IDs - multiple developers per task
  status: TaskStatus
  dependencies: string[] // array of task IDs
  createdAt: string
  updatedAt: string
}

export interface UseCaseDependency {
  fromUseCaseId: string
  toUseCaseId: string
  type: UseCaseDependencyType
}

export interface PlanningData {
  developers: Developer[]
  clients: Client[]
  useCases: UseCase[]
  tasks: Task[]
  dependencies: UseCaseDependency[]
  projectStartDate?: string // ISO date string
}

// Timeline-related types
export type TimeScale = "day" | "week" | "month" | "quarter" | "year"

export interface GanttFilters {
  clientIds: string[] // Empty array = all clients
  useCaseIds: string[] // Empty array = all use cases
}

export interface TimelineViewState {
  timeScale: TimeScale
  zoomLevel: number // 0.5 to 5
  dateRange?: {
    start: Date
    end: Date
  }
  viewportPosition: number // For panning
}

export interface TimelineIndicator {
  type: "milestone" | "dependency" | "status" | "progress" | "today"
  date?: Date
  useCaseId?: string
  fromUseCaseId?: string
  toUseCaseId?: string
  label?: string
}

// Effort Configuration Types
export interface ComplexityWeights {
  low: number
  medium: number
  high: number
}

export interface GapWeights {
  "sdk-native": number
  "minor-extension": number
  "moderate-extension": number
  "significant-extension": number
  "custom-implementation": number
}

export interface FormulaParams {
  base: number
  multiplier: number
}

export interface EffortConfig {
  complexityWeights: ComplexityWeights
  gapWeights: GapWeights
  formulaParams: {
    low: FormulaParams
    medium: FormulaParams
    high: FormulaParams
  }
}

