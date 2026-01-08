import type { UseCase, Developer, PlanningData } from "@/types/planning-types"
import {
  addWorkingDays,
  getWorkingDaysBetween,
  getNextWorkingDay
} from "@/lib/working-days"

export interface UseCaseTimeline {
  useCaseId: string
  startDate: Date
  endDate: Date
  duration: number // in working days - dynamically calculated considering developer allocation and concurrency
  calendarDays: number // total calendar days (including weekends)
  effectiveCapacity: number // effective man-days per working day
  manDays: number // raw effort from use case (for reference)
}

export interface TimelineResult {
  timelines: UseCaseTimeline[]
  conflicts: Array<{
    useCaseIds: string[]
    developers: string[]
    period: { start: Date; end: Date }
  }>
}

interface TimelineSegment {
  startDate: Date
  endDate: Date
  effectiveCapacity: number // Capacity for this use case in this segment (man-days per day)
  concurrentUseCases: string[] // IDs of other use cases active in this segment
  workDone: number // Man-days completed in this segment
}

interface UseCasePeriod {
  useCase: UseCase
  startDate: Date
  endDate: Date
  assignedDeveloperIds: string[]
}

/**
 * Get all concurrency change points (start/end dates of all use cases)
 */
function getConcurrencyChangePoints(useCasePeriods: UseCasePeriod[]): Date[] {
  const points = new Set<number>()
  for (const period of useCasePeriods) {
    points.add(period.startDate.getTime())
    points.add(period.endDate.getTime())
  }
  return Array.from(points)
    .sort((a, b) => a - b)
    .map((time) => new Date(time))
}

/**
 * Calculate timeline for a use case using segment-based approach
 * Breaks the timeline into segments where concurrency is constant
 */
function calculateUseCaseTimelineWithSegments(
  useCasePeriod: UseCasePeriod,
  allPeriods: UseCasePeriod[],
  developers: Developer[]
): { endDate: Date; segments: TimelineSegment[] } {
  const segments: TimelineSegment[] = []
  const changePoints = getConcurrencyChangePoints(allPeriods)
  
  // Filter change points to only those within or after this use case's period
  const relevantPoints = changePoints.filter(
    (point) => point.getTime() >= useCasePeriod.startDate.getTime()
  )
  
  // If no relevant points, use the current end date as the only point
  if (relevantPoints.length === 0) {
    relevantPoints.push(new Date(useCasePeriod.endDate))
  }
  
  // Create segments between change points
  let segmentStart = useCasePeriod.startDate
  let totalWorkDone = 0
  const targetManDays = useCasePeriod.useCase.manDays
  
  for (let i = 0; i < relevantPoints.length; i++) {
    const segmentEnd = new Date(relevantPoints[i])
    
    // Skip if segment end is before segment start
    if (segmentEnd <= segmentStart) continue
    
    // Find all use cases active in this segment
    // A use case is active if it overlaps with the segment period
    // Use strict inequality to exclude tasks that end exactly at segment start
    const activeInSegment = allPeriods.filter((other) => {
      if (other.useCase.id === useCasePeriod.useCase.id) return true
      // Task is active if: starts before segment ends AND ends after segment starts
      // This ensures tasks that finish don't affect subsequent segments
      return (
        other.startDate < segmentEnd && other.endDate > segmentStart
      )
    })
    
    // Calculate effective capacity for this use case in this segment
    let totalEffectiveCapacity = 0
    const concurrentUseCaseIds: string[] = []
    
    for (const devId of useCasePeriod.assignedDeveloperIds) {
      const developer = developers.find((d) => d.id === devId)
      if (!developer) continue
      
      // Count how many use cases in this segment share this developer
      const concurrentCount = activeInSegment.filter((uc) =>
        uc.assignedDeveloperIds.includes(devId)
      ).length
      
      if (concurrentCount > 1) {
        // Track which use cases are concurrent
        activeInSegment.forEach((uc) => {
          if (
            uc.useCase.id !== useCasePeriod.useCase.id &&
            uc.assignedDeveloperIds.includes(devId) &&
            !concurrentUseCaseIds.includes(uc.useCase.id)
          ) {
            concurrentUseCaseIds.push(uc.useCase.id)
          }
        })
      }
      
      // Effective capacity = developer capacity / concurrent count
      const dailyCapacity = developer.capacity / 5 // 5 working days per week
      const effectiveDailyCapacity = dailyCapacity / concurrentCount
      totalEffectiveCapacity += effectiveDailyCapacity
    }
    
    // Convert to man-days per day (8 hours = 1 man-day)
    const effectiveManDaysPerDay = totalEffectiveCapacity / 8
    
    // If no capacity, skip this segment
    if (effectiveManDaysPerDay <= 0) {
      segmentStart = segmentEnd
      continue
    }
    
    // Calculate working days in this segment
    const segmentWorkingDays = getWorkingDaysBetween(segmentStart, segmentEnd)
    
    // Calculate how much work we can do in this segment
    const segmentWorkCapacity = segmentWorkingDays * effectiveManDaysPerDay
    const workRemaining = targetManDays - totalWorkDone
    
    // If this segment can complete all remaining work, calculate exact end date
    if (segmentWorkCapacity >= workRemaining) {
      const daysNeeded = workRemaining / effectiveManDaysPerDay
      const exactEndDate = addWorkingDays(segmentStart, Math.ceil(daysNeeded))
      
      segments.push({
        startDate: new Date(segmentStart),
        endDate: exactEndDate,
        effectiveCapacity: effectiveManDaysPerDay,
        concurrentUseCases: [...concurrentUseCaseIds],
        workDone: workRemaining
      })
      
      return { endDate: exactEndDate, segments }
    }
    
    // Otherwise, use the full segment
    segments.push({
      startDate: new Date(segmentStart),
      endDate: new Date(segmentEnd),
      effectiveCapacity: effectiveManDaysPerDay,
      concurrentUseCases: [...concurrentUseCaseIds],
      workDone: segmentWorkCapacity
    })
    
    totalWorkDone += segmentWorkCapacity
    segmentStart = segmentEnd
  }
  
  // If we haven't completed all work, extend beyond the last change point
  // Recalculate capacity for the extended period (tasks may have ended)
  if (totalWorkDone < targetManDays && segments.length > 0) {
    const remainingWork = targetManDays - totalWorkDone
    const lastSegment = segments[segments.length - 1]
    const extensionStart = lastSegment.endDate
    
    // Find all use cases still active after the last change point
    // Only include tasks that haven't ended yet
    const stillActive = allPeriods.filter((other) => {
      if (other.useCase.id === useCasePeriod.useCase.id) return true
      // Task is still active if it ends after the extension start
      return other.endDate > extensionStart
    })
    
    // Recalculate effective capacity for the extended period
    let totalEffectiveCapacity = 0
    const concurrentUseCaseIds: string[] = []
    
    for (const devId of useCasePeriod.assignedDeveloperIds) {
      const developer = developers.find((d) => d.id === devId)
      if (!developer) continue
      
      // Count how many use cases still active share this developer
      const concurrentCount = stillActive.filter((uc) =>
        uc.assignedDeveloperIds.includes(devId)
      ).length
      
      if (concurrentCount > 1) {
        stillActive.forEach((uc) => {
          if (
            uc.useCase.id !== useCasePeriod.useCase.id &&
            uc.assignedDeveloperIds.includes(devId) &&
            !concurrentUseCaseIds.includes(uc.useCase.id)
          ) {
            concurrentUseCaseIds.push(uc.useCase.id)
          }
        })
      }
      
      const dailyCapacity = developer.capacity / 5
      const effectiveDailyCapacity = dailyCapacity / concurrentCount
      totalEffectiveCapacity += effectiveDailyCapacity
    }
    
    const effectiveManDaysPerDay = totalEffectiveCapacity / 8
    
    if (effectiveManDaysPerDay > 0) {
      const daysNeeded = remainingWork / effectiveManDaysPerDay
      const extendedEndDate = addWorkingDays(extensionStart, Math.ceil(daysNeeded))

      segments.push({
        startDate: new Date(extensionStart),
        endDate: extendedEndDate,
        effectiveCapacity: effectiveManDaysPerDay,
        concurrentUseCases: [...concurrentUseCaseIds],
        workDone: remainingWork
      })
      
      return { endDate: extendedEndDate, segments }
    }
  }
  
  // Fallback: if no segments were created or work couldn't be completed
  // Use a simple calculation based on current capacity
  if (segments.length === 0) {
    // Calculate with no concurrency as fallback
    let totalDailyCapacity = 0
    for (const devId of useCasePeriod.assignedDeveloperIds) {
      const developer = developers.find((d) => d.id === devId)
      if (developer) {
        totalDailyCapacity += developer.capacity / 5
      }
    }
    const manDaysPerDay = totalDailyCapacity / 8
    if (manDaysPerDay > 0) {
      const duration = targetManDays / manDaysPerDay
      const fallbackEndDate = addWorkingDays(useCasePeriod.startDate, Math.ceil(duration))
      return { endDate: fallbackEndDate, segments: [] }
    }
  }
  
  // Final fallback: use the last change point or current end date
  const finalEndDate =
    relevantPoints.length > 0
      ? new Date(relevantPoints[relevantPoints.length - 1])
      : useCasePeriod.endDate
  
  return { endDate: finalEndDate, segments }
}

/**
 * Calculate timeline for use cases based on developer assignments and concurrent work
 * 
 * Uses segment-based iterative approach:
 * 1. Calculate initial timelines assuming no concurrency
 * 2. Break each use case into segments where concurrency is constant
 * 3. Calculate work done per segment based on effective capacity
 * 4. Sum segments to determine end dates
 * 5. Iterate until timelines stabilize (or max iterations)
 * 
 * Formula:
 * - If a developer is on N concurrent use cases, each gets 1/N of their capacity
 * - Each segment has constant concurrency
 * - Work done in segment = (segment duration in working days) × (effective capacity)
 * - Total work = sum of all segment work
 * - End date = when total work >= useCase.manDays
 */
export function calculateTimelines(
  data: PlanningData
): TimelineResult {
  const timelines: UseCaseTimeline[] = []
  const conflicts: TimelineResult["conflicts"] = []

  // Filter use cases with start dates and assigned developers
  const useCasesWithDates = data.useCases.filter(
    (uc) =>
      uc.startDate &&
      uc.assignedDeveloperIds &&
      uc.assignedDeveloperIds.length > 0
  )

  if (useCasesWithDates.length === 0) {
    return { timelines, conflicts }
  }

  // Initialize timelines with optimistic estimates (no concurrency)
  let useCasePeriods: UseCasePeriod[] = useCasesWithDates.map((uc) => {
    let startDate = new Date(uc.startDate!)
    
    // Ensure start date is a working day (move to next Monday if weekend)
    startDate = getNextWorkingDay(startDate)
    
    // Calculate initial duration assuming full developer capacity
    let totalDailyCapacity = 0
    for (const devId of uc.assignedDeveloperIds!) {
      const developer = data.developers.find((d) => d.id === devId)
      if (developer) {
        totalDailyCapacity += developer.capacity / 5 // hours per day (5 working days)
      }
    }
    
    // Convert to man-days per day (8 hours = 1 man-day)
    const manDaysPerDay = totalDailyCapacity / 8
    const initialDuration = uc.manDays / manDaysPerDay
    
    // Add working days, skipping weekends
    const endDate = addWorkingDays(startDate, Math.ceil(initialDuration))

    return {
      useCase: uc,
      startDate,
      endDate,
      assignedDeveloperIds: uc.assignedDeveloperIds!
    }
  })

  // Iterative calculation: recalculate until stable (max 10 iterations)
  const maxIterations = 10
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let changed = false
    const newPeriods: UseCasePeriod[] = []

    for (const useCasePeriod of useCasePeriods) {
      // Use segment-based calculation to account for partial overlaps
      const { endDate: newEndDate } = calculateUseCaseTimelineWithSegments(
        useCasePeriod,
        useCasePeriods,
        data.developers
      )

      // Check if end date changed
      if (newEndDate.getTime() !== useCasePeriod.endDate.getTime()) {
        changed = true
      }

      newPeriods.push({
        ...useCasePeriod,
        endDate: newEndDate
      })

      // Track conflicts - find all use cases that overlap with this one
      const overlappingUseCases = useCasePeriods.filter((other) => {
        if (other.useCase.id === useCasePeriod.useCase.id) return false
        return (
          other.startDate <= newEndDate && other.endDate >= useCasePeriod.startDate
        )
      })

      if (overlappingUseCases.length > 0) {
        const conflictingDevelopers = useCasePeriod.assignedDeveloperIds.filter(
          (devId) =>
            overlappingUseCases.some((uc) =>
              uc.assignedDeveloperIds.includes(devId)
            )
        )

        if (conflictingDevelopers.length > 0) {
          // Check if conflict already exists
          const existingConflict = conflicts.find(
            (c) =>
              c.useCaseIds.includes(useCasePeriod.useCase.id) &&
              c.developers.some((d) => conflictingDevelopers.includes(d))
          )

          if (!existingConflict) {
            conflicts.push({
              useCaseIds: [
                useCasePeriod.useCase.id,
                ...overlappingUseCases.map((uc) => uc.useCase.id)
              ],
              developers: conflictingDevelopers,
              period: {
                start: useCasePeriod.startDate,
                end: newEndDate
              }
            })
          }
        }
      }
    }

    useCasePeriods = newPeriods

    // If no changes, we've converged
    if (!changed) {
      break
    }
  }

  // Convert to timeline format
  for (const period of useCasePeriods) {
    // Calculate duration in working days
    const duration = getWorkingDaysBetween(period.startDate, period.endDate)

    // Calculate calendar days (total days including weekends)
    const calendarDays = Math.ceil(
      (period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1 // +1 to include both start and end days

    // Calculate effective capacity for final timeline (in man-days per working day)
    const concurrentUseCases = useCasePeriods.filter((other) => {
      if (other.useCase.id === period.useCase.id) return false
      return (
        other.startDate <= period.endDate && other.endDate >= period.startDate
      )
    })

    let totalEffectiveHoursPerDay = 0
    for (const devId of period.assignedDeveloperIds) {
      const developer = data.developers.find((d) => d.id === devId)
      if (!developer) continue

      const concurrentCount =
        1 +
        concurrentUseCases.filter((uc) =>
          uc.assignedDeveloperIds.includes(devId)
        ).length

      // Developer capacity is hours per week, divide by 5 to get hours per day
      const dailyCapacity = developer.capacity / 5
      // Split capacity across concurrent use cases
      const effectiveDailyCapacity = dailyCapacity / concurrentCount
      totalEffectiveHoursPerDay += effectiveDailyCapacity
    }

    // Convert to man-days per day (8 hours = 1 man-day)
    const effectiveManDaysPerDay = totalEffectiveHoursPerDay / 8

    timelines.push({
      useCaseId: period.useCase.id,
      startDate: period.startDate,
      endDate: period.endDate,
      duration, // Duration in working days
      calendarDays, // Duration in calendar days (including weekends)
      effectiveCapacity: effectiveManDaysPerDay, // Man-days per working day
      manDays: period.useCase.manDays // Raw effort requirement
    })
  }

  return { timelines, conflicts }
}

/**
 * Get timeline for a specific use case
 */
export function getUseCaseTimeline(
  useCaseId: string,
  data: PlanningData
): UseCaseTimeline | null {
  const result = calculateTimelines(data)
  return result.timelines.find((t) => t.useCaseId === useCaseId) || null
}

