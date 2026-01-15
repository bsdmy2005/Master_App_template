import type { UseCase, ScheduleStatus } from "@/types/planning-types"

// Configuration for schedule status thresholds
export const SCHEDULE_THRESHOLDS = {
  aheadThreshold: 10, // More than 10% ahead of expected
  behindThreshold: 10, // More than 10% behind expected
  atRiskThreshold: 25, // More than 25% behind expected
  staleUpdateDays: 7 // Flag if not updated in 7 days
}

/**
 * Check if a date is a business day (Monday-Friday)
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6 // 0 = Sunday, 6 = Saturday
}

/**
 * Count business days between two dates (inclusive of start, exclusive of end)
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)

  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  while (current < end) {
    if (isBusinessDay(current)) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}

/**
 * Add business days to a date
 */
export function addBusinessDays(startDate: Date, businessDays: number): Date {
  const result = new Date(startDate)
  let daysAdded = 0

  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1)
    if (isBusinessDay(result)) {
      daysAdded++
    }
  }

  return result
}

/**
 * Calculate expected progress percentage based on position in timeline
 *
 * @param startDate - When the use case started
 * @param endDate - When the use case is expected to end (capacity-adjusted)
 * @param manDays - Fallback: raw man-days if no end date provided
 * @param asOfDate - The date to calculate progress as of (defaults to today)
 *
 * If endDate is provided, calculates based on calendar position in the timeline.
 * Otherwise falls back to business days / man-days calculation.
 */
export function calculateExpectedProgress(
  startDate: string | undefined,
  endDate: Date | string | undefined | null,
  manDays: number,
  asOfDate: Date = new Date()
): number {
  if (!startDate || manDays <= 0) {
    return 0
  }

  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  const now = new Date(asOfDate)
  now.setHours(0, 0, 0, 0)

  // If we haven't started yet
  if (now < start) {
    return 0
  }

  // If we have an end date (capacity-adjusted), use calendar position
  if (endDate) {
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)

    // If we're past the end date, expected progress is 100%
    if (now >= end) {
      return 100
    }

    // Calculate based on calendar days position in the timeline
    const totalDays = end.getTime() - start.getTime()
    const elapsedDays = now.getTime() - start.getTime()

    if (totalDays <= 0) {
      return 100
    }

    const expectedProgress = (elapsedDays / totalDays) * 100
    return Math.min(100, Math.round(expectedProgress * 10) / 10)
  }

  // Fallback: use business days / man-days (less accurate without capacity info)
  const elapsedBusinessDays = countBusinessDays(start, now)
  const expectedProgress = (elapsedBusinessDays / manDays) * 100

  // Cap at 100%
  return Math.min(100, Math.round(expectedProgress * 10) / 10)
}

/**
 * Determine schedule status by comparing actual vs expected progress
 *
 * @param useCase - The use case to check
 * @param endDate - The capacity-adjusted end date (from timeline calculation)
 * @param asOfDate - The date to calculate status as of (defaults to today)
 */
export function getScheduleStatus(
  useCase: UseCase,
  endDate?: Date | string | null,
  asOfDate: Date = new Date()
): ScheduleStatus {
  const actualProgress = useCase.progressPercent ?? 0

  // Check if completed
  if (useCase.status === "completed" || actualProgress >= 100) {
    return "completed"
  }

  // Check if truly not started (no start date, or start date is in the future)
  if (!useCase.startDate) {
    return "not-started"
  }

  const startDate = new Date(useCase.startDate)
  startDate.setHours(0, 0, 0, 0)
  const now = new Date(asOfDate)
  now.setHours(0, 0, 0, 0)

  // If start date is in the future, it's not started yet
  if (startDate > now) {
    return "not-started"
  }

  // Start date is in the past - calculate expected progress
  // Pass the capacity-adjusted end date for accurate calculation
  const expectedProgress = calculateExpectedProgress(
    useCase.startDate,
    endDate,
    useCase.manDays,
    asOfDate
  )

  const progressDifference = actualProgress - expectedProgress

  if (progressDifference >= SCHEDULE_THRESHOLDS.aheadThreshold) {
    return "ahead"
  } else if (progressDifference <= -SCHEDULE_THRESHOLDS.atRiskThreshold) {
    return "at-risk"
  } else if (progressDifference <= -SCHEDULE_THRESHOLDS.behindThreshold) {
    return "behind"
  } else {
    return "on-track"
  }
}

/**
 * Check if progress update is stale (not updated recently)
 */
export function isProgressStale(
  lastProgressUpdate: string | undefined,
  asOfDate: Date = new Date()
): boolean {
  if (!lastProgressUpdate) {
    return true
  }

  const lastUpdate = new Date(lastProgressUpdate)
  const now = new Date(asOfDate)
  const daysDifference = Math.floor(
    (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return daysDifference > SCHEDULE_THRESHOLDS.staleUpdateDays
}

/**
 * Get days since last progress update
 */
export function daysSinceLastUpdate(
  lastProgressUpdate: string | undefined,
  asOfDate: Date = new Date()
): number | null {
  if (!lastProgressUpdate) {
    return null
  }

  const lastUpdate = new Date(lastProgressUpdate)
  const now = new Date(asOfDate)
  return Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Get schedule status display info (label, color, icon)
 */
export function getScheduleStatusInfo(status: ScheduleStatus): {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
} {
  switch (status) {
    case "ahead":
      return {
        label: "Ahead",
        color: "text-green-700 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        borderColor: "border-green-500",
        icon: "trending-up"
      }
    case "on-track":
      return {
        label: "On Track",
        color: "text-blue-700 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        borderColor: "border-blue-500",
        icon: "check-circle"
      }
    case "behind":
      return {
        label: "Behind",
        color: "text-orange-700 dark:text-orange-400",
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
        borderColor: "border-orange-500",
        icon: "alert-triangle"
      }
    case "at-risk":
      return {
        label: "At Risk",
        color: "text-red-700 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900/30",
        borderColor: "border-red-500",
        icon: "alert-circle"
      }
    case "completed":
      return {
        label: "Completed",
        color: "text-emerald-700 dark:text-emerald-400",
        bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
        borderColor: "border-emerald-500",
        icon: "check"
      }
    case "not-started":
    default:
      return {
        label: "Not Started",
        color: "text-gray-600 dark:text-gray-400",
        bgColor: "bg-gray-100 dark:bg-gray-800",
        borderColor: "border-gray-400",
        icon: "clock"
      }
  }
}

/**
 * Calculate progress summary statistics for a set of use cases
 */
export function calculateProgressSummary(useCases: UseCase[]): {
  total: number
  notStarted: number
  ahead: number
  onTrack: number
  behind: number
  atRisk: number
  completed: number
  staleUpdates: number
  averageProgress: number
} {
  const summary = {
    total: useCases.length,
    notStarted: 0,
    ahead: 0,
    onTrack: 0,
    behind: 0,
    atRisk: 0,
    completed: 0,
    staleUpdates: 0,
    averageProgress: 0
  }

  let totalProgress = 0

  for (const useCase of useCases) {
    const status = getScheduleStatus(useCase)

    // Map status to summary property name
    switch (status) {
      case "not-started":
        summary.notStarted++
        break
      case "on-track":
        summary.onTrack++
        break
      case "at-risk":
        summary.atRisk++
        break
      case "ahead":
        summary.ahead++
        break
      case "behind":
        summary.behind++
        break
      case "completed":
        summary.completed++
        break
    }

    if (isProgressStale(useCase.lastProgressUpdate) && status !== "completed" && status !== "not-started") {
      summary.staleUpdates++
    }

    totalProgress += useCase.progressPercent ?? 0
  }

  summary.averageProgress = useCases.length > 0
    ? Math.round((totalProgress / useCases.length) * 10) / 10
    : 0

  return summary
}

/**
 * Format progress for display
 */
export function formatProgress(percent: number | undefined): string {
  if (percent === undefined || percent === null) {
    return "—"
  }
  return `${Math.round(percent)}%`
}

/**
 * Calculate expected end date based on start date and man-days
 */
export function calculateExpectedEndDate(
  startDate: string | undefined,
  manDays: number
): Date | null {
  if (!startDate || manDays <= 0) {
    return null
  }

  const start = new Date(startDate)
  return addBusinessDays(start, manDays)
}
