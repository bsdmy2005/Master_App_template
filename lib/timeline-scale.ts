import { getWorkingDaysBetween } from "@/lib/working-days"

export type TimeScale = "day" | "week" | "month" | "quarter" | "year"

export interface DateLabel {
  date: Date
  position: number
  label: string
  isWeekend?: boolean
}

/**
 * Get the start of a week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

/**
 * Get the start of a month for a given date
 */
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Get the start of a quarter for a given date
 */
function getQuarterStart(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3)
  return new Date(date.getFullYear(), quarter * 3, 1)
}

/**
 * Get the start of a year for a given date
 */
function getYearStart(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1)
}

/**
 * Generate date labels for day scale
 */
export function generateDayLabels(
  startDate: Date,
  endDate: Date,
  width: number
): DateLabel[] {
  const labels: DateLabel[] = []
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  const totalDays = getWorkingDaysBetween(startDate, endDate)
  if (totalDays === 0) return labels

  let workingDaysCount = 0
  while (current <= end) {
    const isWeekend = current.getDay() === 0 || current.getDay() === 6
    const position = (workingDaysCount / totalDays) * width

    // Only show labels for weekdays or every few days
    if (!isWeekend || current.getDate() % 7 === 0) {
      labels.push({
        date: new Date(current),
        position,
        label: current.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric"
        }),
        isWeekend
      })
    }

    if (!isWeekend) {
      workingDaysCount++
    }
    current.setDate(current.getDate() + 1)
  }

  return labels
}

/**
 * Generate date labels for week scale
 */
export function generateWeekLabels(
  startDate: Date,
  endDate: Date,
  width: number
): DateLabel[] {
  const labels: DateLabel[] = []
  const current = getWeekStart(startDate)
  const end = new Date(endDate)

  const totalWeeks = Math.ceil(
    getWorkingDaysBetween(startDate, endDate) / 5
  )
  if (totalWeeks === 0) return labels

  let weekIndex = 0
  while (current <= end) {
    const weekEnd = new Date(current)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const position = (weekIndex / totalWeeks) * width
    labels.push({
      date: new Date(current),
      position,
      label: `Week ${weekIndex + 1} (${current.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      })})`
    })

    current.setDate(current.getDate() + 7)
    weekIndex++
  }

  return labels
}

/**
 * Generate date labels for month scale
 */
export function generateMonthLabels(
  startDate: Date,
  endDate: Date,
  width: number
): DateLabel[] {
  const labels: DateLabel[] = []
  const current = getMonthStart(startDate)
  const end = getMonthStart(endDate)
  // Add one more month to include the end month
  end.setMonth(end.getMonth() + 1)

  const totalMonths =
    (end.getFullYear() - current.getFullYear()) * 12 +
    (end.getMonth() - current.getMonth())

  let monthIndex = 0
  const maxIterations = 1000 // Safety limit
  let iterations = 0
  
  while (current < end && iterations < maxIterations) {
    const position = totalMonths > 0 ? (monthIndex / totalMonths) * width : 0
    labels.push({
      date: new Date(current),
      position,
      label: current.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric"
      })
    })

    current.setMonth(current.getMonth() + 1)
    monthIndex++
    iterations++
  }

  return labels
}

/**
 * Generate date labels for quarter scale
 */
export function generateQuarterLabels(
  startDate: Date,
  endDate: Date,
  width: number
): DateLabel[] {
  const labels: DateLabel[] = []
  const current = getQuarterStart(startDate)
  const end = getQuarterStart(endDate)
  // Add one more quarter to include the end quarter
  end.setMonth(end.getMonth() + 3)

  const startQuarter = Math.floor(current.getMonth() / 3)
  const endQuarter = Math.floor(end.getMonth() / 3)
  const totalQuarters =
    (end.getFullYear() - current.getFullYear()) * 4 +
    (endQuarter - startQuarter)

  let quarterIndex = 0
  const maxIterations = 100 // Safety limit
  let iterations = 0
  
  while (current < end && iterations < maxIterations) {
    const quarter = Math.floor(current.getMonth() / 3) + 1
    const position = totalQuarters > 0 ? (quarterIndex / totalQuarters) * width : 0
    labels.push({
      date: new Date(current),
      position,
      label: `Q${quarter} ${current.getFullYear()}`
    })

    current.setMonth(current.getMonth() + 3)
    quarterIndex++
    iterations++
  }

  return labels
}

/**
 * Generate date labels for year scale
 */
export function generateYearLabels(
  startDate: Date,
  endDate: Date,
  width: number
): DateLabel[] {
  const labels: DateLabel[] = []
  const current = getYearStart(startDate)
  const end = getYearStart(endDate)
  // Add one more year to include the end year
  end.setFullYear(end.getFullYear() + 1)

  const totalYears = end.getFullYear() - current.getFullYear()

  let yearIndex = 0
  const maxIterations = 100 // Safety limit
  let iterations = 0
  
  while (current < end && iterations < maxIterations) {
    const position = totalYears > 0 ? (yearIndex / totalYears) * width : 0
    labels.push({
      date: new Date(current),
      position,
      label: current.getFullYear().toString()
    })

    current.setFullYear(current.getFullYear() + 1)
    yearIndex++
    iterations++
  }

  return labels
}

/**
 * Generate date labels based on time scale
 */
export function generateDateLabels(
  startDate: Date,
  endDate: Date,
  scale: TimeScale,
  width: number = 100
): DateLabel[] {
  switch (scale) {
    case "day":
      return generateDayLabels(startDate, endDate, width)
    case "week":
      return generateWeekLabels(startDate, endDate, width)
    case "month":
      return generateMonthLabels(startDate, endDate, width)
    case "quarter":
      return generateQuarterLabels(startDate, endDate, width)
    case "year":
      return generateYearLabels(startDate, endDate, width)
    default:
      return generateWeekLabels(startDate, endDate, width)
  }
}

/**
 * Calculate position of a date on the timeline based on scale
 */
export function calculateDatePosition(
  date: Date,
  startDate: Date,
  endDate: Date,
  scale: TimeScale,
  width: number = 100
): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const target = new Date(date)

  switch (scale) {
    case "day": {
      const totalWorkingDays = getWorkingDaysBetween(start, end)
      const workingDaysFromStart = getWorkingDaysBetween(start, target)
      return totalWorkingDays > 0
        ? (workingDaysFromStart / totalWorkingDays) * width
        : 0
    }
    case "week": {
      // Use working days for proportional positioning within weeks
      const totalWorkingDays = getWorkingDaysBetween(start, end)
      const workingDaysFromStart = getWorkingDaysBetween(start, target)
      return totalWorkingDays > 0
        ? (workingDaysFromStart / totalWorkingDays) * width
        : 0
    }
    case "month": {
      // Calculate position based on actual calendar days for proportional positioning
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const daysFromStart = Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return totalDays > 0 ? (daysFromStart / totalDays) * width : 0
    }
    case "quarter": {
      // Calculate position based on actual calendar days for proportional positioning
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const daysFromStart = Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return totalDays > 0 ? (daysFromStart / totalDays) * width : 0
    }
    case "year": {
      // Calculate position based on actual calendar days for proportional positioning
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const daysFromStart = Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return totalDays > 0 ? (daysFromStart / totalDays) * width : 0
    }
    default:
      return 0
  }
}

/**
 * Determine optimal time scale based on date range
 */
export function getOptimalTimeScale(
  startDate: Date,
  endDate: Date
): TimeScale {
  const totalDays = getWorkingDaysBetween(startDate, endDate)
  const totalWeeks = totalDays / 5
  const totalMonths =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) +
    1

  if (totalDays <= 14) {
    return "day"
  } else if (totalWeeks <= 12) {
    return "week"
  } else if (totalMonths <= 12) {
    return "month"
  } else if (totalMonths <= 48) {
    return "quarter"
  } else {
    return "year"
  }
}

/**
 * Format date based on time scale for display on bars
 */
export function formatDateForScale(date: Date, scale: TimeScale): string {
  switch (scale) {
    case "day":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      })
    case "week":
      // For week scale, show date (week number calculation would require week start logic)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      })
    case "month":
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric"
      })
    case "quarter":
      const quarter = Math.floor(date.getMonth() / 3) + 1
      return `Q${quarter} ${date.getFullYear()}`
    case "year":
      return date.getFullYear().toString()
    default:
      return date.toLocaleDateString("en-US")
  }
}

/**
 * Extend timeline end date based on time scale to show future periods
 */
export function extendTimelineEnd(
  endDate: Date,
  scale: TimeScale
): Date {
  const extended = new Date(endDate)
  switch (scale) {
    case "day":
    case "week":
      extended.setDate(extended.getDate() + 28) // 4 weeks
      break
    case "month":
      extended.setMonth(extended.getMonth() + 3) // 3 months
      break
    case "quarter":
      extended.setMonth(extended.getMonth() + 6) // 2 quarters
      break
    case "year":
      extended.setFullYear(extended.getFullYear() + 1) // 1 year
      break
  }
  return extended
}

