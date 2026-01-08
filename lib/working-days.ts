/**
 * Working days utility functions
 * Only Monday through Friday count as working days
 * Saturday and Sunday are excluded from all calculations
 */

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // 0 = Sunday, 6 = Saturday
}

/**
 * Get the next working day (Monday) if the date is a weekend
 * Otherwise returns the same date
 */
export function getNextWorkingDay(date: Date): Date {
  const result = new Date(date)
  
  // If it's Saturday, move to Monday (add 2 days)
  if (result.getDay() === 6) {
    result.setDate(result.getDate() + 2)
  }
  // If it's Sunday, move to Monday (add 1 day)
  else if (result.getDay() === 0) {
    result.setDate(result.getDate() + 1)
  }
  
  return result
}

/**
 * Add N working days to a date, skipping weekends
 * @param startDate - Starting date
 * @param workingDays - Number of working days to add
 * @returns New date after adding working days
 */
export function addWorkingDays(startDate: Date, workingDays: number): Date {
  if (workingDays <= 0) {
    return new Date(startDate)
  }

  const result = new Date(startDate)
  let daysAdded = 0
  let currentDay = 0

  // Start from a working day
  if (isWeekend(result)) {
    result.setTime(getNextWorkingDay(result).getTime())
  }

  // Add working days, skipping weekends
  while (daysAdded < workingDays) {
    // Check if current day is a working day
    if (!isWeekend(result)) {
      daysAdded++
    } else {
      // Skip to next Monday if we hit a weekend
      if (result.getDay() === 6) {
        // Saturday - jump to Monday
        result.setDate(result.getDate() + 2)
      } else if (result.getDay() === 0) {
        // Sunday - jump to Monday
        result.setDate(result.getDate() + 1)
      }
      continue
    }

    // If we haven't added enough days yet, move to next day
    if (daysAdded < workingDays) {
      result.setDate(result.getDate() + 1)
    }
  }

  return result
}

/**
 * Count the number of working days between two dates (inclusive)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of working days between the dates
 */
export function getWorkingDaysBetween(
  startDate: Date,
  endDate: Date
): number {
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Normalize to start of day
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  if (start > end) {
    return 0
  }

  let workingDays = 0
  const current = new Date(start)

  while (current <= end) {
    if (!isWeekend(current)) {
      workingDays++
    }
    current.setDate(current.getDate() + 1)
  }

  return workingDays
}

/**
 * Subtract N working days from a date, skipping weekends
 * @param startDate - Starting date
 * @param workingDays - Number of working days to subtract
 * @returns New date after subtracting working days
 */
export function subtractWorkingDays(
  startDate: Date,
  workingDays: number
): Date {
  if (workingDays <= 0) {
    return new Date(startDate)
  }

  const result = new Date(startDate)
  let daysSubtracted = 0

  // Start from a working day
  if (isWeekend(result)) {
    // If weekend, go back to previous Friday
    if (result.getDay() === 6) {
      // Saturday - go back 1 day to Friday
      result.setDate(result.getDate() - 1)
    } else if (result.getDay() === 0) {
      // Sunday - go back 2 days to Friday
      result.setDate(result.getDate() - 2)
    }
  }

  // Subtract working days, skipping weekends
  while (daysSubtracted < workingDays) {
    // Check if current day is a working day
    if (!isWeekend(result)) {
      daysSubtracted++
    } else {
      // Skip to previous Friday if we hit a weekend
      if (result.getDay() === 6) {
        // Saturday - jump back to Friday
        result.setDate(result.getDate() - 1)
      } else if (result.getDay() === 0) {
        // Sunday - jump back to Friday
        result.setDate(result.getDate() - 2)
      }
      continue
    }

    // If we haven't subtracted enough days yet, move to previous day
    if (daysSubtracted < workingDays) {
      result.setDate(result.getDate() - 1)
    }
  }

  return result
}

