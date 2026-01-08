"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  CalendarDays,
  ChevronLeft,
  GripVertical,
  Maximize2,
  Minimize2,
  Loader2
} from "lucide-react"
import type { PlanningData, TimeScale, GanttFilters } from "@/types/planning-types"
import { calculateTimelines, type UseCaseTimeline } from "@/lib/timeline-calculator"
import { writePlanningDataWithFallback } from "@/lib/storage-db"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Constants for layout
const ROW_HEIGHT = 48 // Height of each Gantt row in pixels
const SIDEBAR_WIDTH = 240 // Width of the fixed left sidebar (compact, tooltips show details)
const HEADER_HEIGHT = 72 // Height of the timeline header (two tiers)
const MIN_BAR_WIDTH = 4 // Minimum bar width in pixels
const MAJOR_TIER_HEIGHT = 28 // Height of major labels tier
const MINOR_TIER_HEIGHT = 44 // Height of minor labels tier
const MIN_LABEL_SPACING = 80 // Minimum pixels between label centers

// Status colors - using modern, accessible colors
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "high-level definition": { bg: "bg-slate-500", text: "text-white", border: "border-slate-600" },
  groomed: { bg: "bg-blue-500", text: "text-white", border: "border-blue-600" },
  defined: { bg: "bg-amber-500", text: "text-white", border: "border-amber-600" },
  "in development": { bg: "bg-orange-500", text: "text-white", border: "border-orange-600" },
  completed: { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600" }
}

// Priority indicators
const PRIORITY_STYLES: Record<string, string> = {
  high: "ring-2 ring-red-400 ring-offset-1",
  medium: "",
  low: "opacity-80"
}

interface GanttChartModernProps {
  data: PlanningData
  setData?: (data: PlanningData) => void
}

// Helper functions
function getDaysBetween(start: Date, end: Date): number {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
}

function formatDate(date: Date, scale: TimeScale): string {
  switch (scale) {
    case "day":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    case "week":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    case "month":
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    case "quarter":
      const q = Math.floor(date.getMonth() / 3) + 1
      return `Q${q} '${date.getFullYear().toString().slice(-2)}`
    case "year":
      return date.getFullYear().toString()
    default:
      return date.toLocaleDateString()
  }
}

// Calculate pixels per day based on scale
function getPixelsPerDay(scale: TimeScale): number {
  switch (scale) {
    case "day": return 40
    case "week": return 16
    case "month": return 4
    case "quarter": return 1.5
    case "year": return 0.4
    default: return 16
  }
}

// Types for two-tier labels
interface MajorLabel {
  date: Date
  endDate: Date
  label: string
  position: number
  width: number
}

interface MinorLabel {
  date: Date
  label: string
  position: number
  showLabel: boolean // Whether to show the text label (hidden if too crowded)
}

// Generate two-tier timeline labels (major = top row, minor = bottom row with grid lines)
function generateTwoTierLabels(
  start: Date,
  end: Date,
  scale: TimeScale,
  pixelsPerDay: number
): { major: MajorLabel[]; minor: MinorLabel[] } {
  const major: MajorLabel[] = []
  const minor: MinorLabel[] = []

  const startDate = new Date(start)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(end)
  endDate.setHours(23, 59, 59, 999)

  const totalDays = getDaysBetween(startDate, endDate)

  switch (scale) {
    case "day": {
      // Major: Months, Minor: Days
      const current = new Date(startDate)
      let lastMonth = -1
      let monthStart: Date | null = null

      while (current <= endDate) {
        const position = getDaysBetween(startDate, current) * pixelsPerDay

        // Track month changes for major labels
        if (current.getMonth() !== lastMonth) {
          if (monthStart !== null && lastMonth !== -1) {
            const monthEnd = new Date(current)
            monthEnd.setDate(monthEnd.getDate() - 1)
            const monthStartPos = getDaysBetween(startDate, monthStart) * pixelsPerDay
            const monthEndPos = getDaysBetween(startDate, monthEnd) * pixelsPerDay
            major.push({
              date: new Date(monthStart),
              endDate: monthEnd,
              label: monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
              position: monthStartPos,
              width: Math.max(60, monthEndPos - monthStartPos)
            })
          }
          monthStart = new Date(current)
          lastMonth = current.getMonth()
        }

        // Minor labels: every day
        const isWeekend = current.getDay() === 0 || current.getDay() === 6
        minor.push({
          date: new Date(current),
          label: current.getDate().toString(),
          position,
          showLabel: !isWeekend // Hide weekend labels if cramped
        })

        current.setDate(current.getDate() + 1)
      }

      // Add final month
      if (monthStart !== null) {
        const monthStartPos = getDaysBetween(startDate, monthStart) * pixelsPerDay
        const monthEndPos = totalDays * pixelsPerDay
        major.push({
          date: monthStart,
          endDate: new Date(endDate),
          label: monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          position: monthStartPos,
          width: Math.max(60, monthEndPos - monthStartPos)
        })
      }
      break
    }

    case "week": {
      // Major: Months, Minor: Weeks (Monday start)
      const current = new Date(startDate)
      // Align to Monday
      const dayOfWeek = current.getDay()
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      current.setDate(current.getDate() + daysToMonday)

      let lastMonth = -1
      let monthStart: Date | null = null

      while (current <= endDate) {
        const position = Math.max(0, getDaysBetween(startDate, current) * pixelsPerDay)

        // Track month changes for major labels
        if (current.getMonth() !== lastMonth) {
          if (monthStart !== null && lastMonth !== -1) {
            const monthStartPos = Math.max(0, getDaysBetween(startDate, monthStart) * pixelsPerDay)
            const monthWidth = position - monthStartPos
            if (monthWidth > 0) {
              major.push({
                date: new Date(monthStart),
                endDate: new Date(current),
                label: monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
                position: monthStartPos,
                width: Math.max(60, monthWidth)
              })
            }
          }
          monthStart = new Date(current)
          lastMonth = current.getMonth()
        }

        // Minor labels: each week
        const weekNum = Math.ceil(current.getDate() / 7)
        minor.push({
          date: new Date(current),
          label: `${current.toLocaleDateString("en-US", { month: "short" })} ${current.getDate()}`,
          position,
          showLabel: true
        })

        current.setDate(current.getDate() + 7)
      }

      // Add final month
      if (monthStart !== null) {
        const monthStartPos = Math.max(0, getDaysBetween(startDate, monthStart) * pixelsPerDay)
        const monthEndPos = totalDays * pixelsPerDay
        if (monthEndPos > monthStartPos) {
          major.push({
            date: monthStart,
            endDate: new Date(endDate),
            label: monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            position: monthStartPos,
            width: Math.max(60, monthEndPos - monthStartPos)
          })
        }
      }
      break
    }

    case "month": {
      // Major: Years, Minor: Months
      const current = new Date(startDate)
      current.setDate(1)

      let lastYear = -1
      let yearStart: Date | null = null

      while (current <= endDate) {
        const position = getDaysBetween(startDate, current) * pixelsPerDay

        // Track year changes for major labels
        if (current.getFullYear() !== lastYear) {
          if (yearStart !== null && lastYear !== -1) {
            const yearStartPos = Math.max(0, getDaysBetween(startDate, yearStart) * pixelsPerDay)
            const yearWidth = position - yearStartPos
            if (yearWidth > 0) {
              major.push({
                date: new Date(yearStart),
                endDate: new Date(current),
                label: yearStart.getFullYear().toString(),
                position: yearStartPos,
                width: Math.max(40, yearWidth)
              })
            }
          }
          yearStart = new Date(current)
          lastYear = current.getFullYear()
        }

        // Minor labels: each month
        minor.push({
          date: new Date(current),
          label: current.toLocaleDateString("en-US", { month: "short" }),
          position,
          showLabel: true
        })

        current.setMonth(current.getMonth() + 1)
      }

      // Add final year
      if (yearStart !== null) {
        const yearStartPos = Math.max(0, getDaysBetween(startDate, yearStart) * pixelsPerDay)
        const yearEndPos = totalDays * pixelsPerDay
        if (yearEndPos > yearStartPos) {
          major.push({
            date: yearStart,
            endDate: new Date(endDate),
            label: yearStart.getFullYear().toString(),
            position: yearStartPos,
            width: Math.max(40, yearEndPos - yearStartPos)
          })
        }
      }
      break
    }

    case "quarter": {
      // Major: Years, Minor: Quarters
      const current = new Date(startDate)
      const qMonth = Math.floor(current.getMonth() / 3) * 3
      current.setMonth(qMonth, 1)

      let lastYear = -1
      let yearStart: Date | null = null

      while (current <= endDate) {
        const position = Math.max(0, getDaysBetween(startDate, current) * pixelsPerDay)

        // Track year changes for major labels
        if (current.getFullYear() !== lastYear) {
          if (yearStart !== null && lastYear !== -1) {
            const yearStartPos = Math.max(0, getDaysBetween(startDate, yearStart) * pixelsPerDay)
            const yearWidth = position - yearStartPos
            if (yearWidth > 0) {
              major.push({
                date: new Date(yearStart),
                endDate: new Date(current),
                label: yearStart.getFullYear().toString(),
                position: yearStartPos,
                width: Math.max(40, yearWidth)
              })
            }
          }
          yearStart = new Date(current)
          lastYear = current.getFullYear()
        }

        // Minor labels: each quarter
        const q = Math.floor(current.getMonth() / 3) + 1
        minor.push({
          date: new Date(current),
          label: `Q${q}`,
          position,
          showLabel: true
        })

        current.setMonth(current.getMonth() + 3)
      }

      // Add final year
      if (yearStart !== null) {
        const yearStartPos = Math.max(0, getDaysBetween(startDate, yearStart) * pixelsPerDay)
        const yearEndPos = totalDays * pixelsPerDay
        if (yearEndPos > yearStartPos) {
          major.push({
            date: yearStart,
            endDate: new Date(endDate),
            label: yearStart.getFullYear().toString(),
            position: yearStartPos,
            width: Math.max(40, yearEndPos - yearStartPos)
          })
        }
      }
      break
    }

    case "year": {
      // Major: Decades (or just years as major), Minor: Years
      const current = new Date(startDate)
      current.setMonth(0, 1)

      while (current <= endDate) {
        const position = Math.max(0, getDaysBetween(startDate, current) * pixelsPerDay)

        // For year scale, years ARE the minor labels
        minor.push({
          date: new Date(current),
          label: current.getFullYear().toString(),
          position,
          showLabel: true
        })

        current.setFullYear(current.getFullYear() + 1)
      }

      // No major labels for year scale (or could add decades)
      break
    }
  }

  // Filter out minor labels that are too close together
  const filteredMinor = filterOverlappingLabels(minor, MIN_LABEL_SPACING)

  return { major, minor: filteredMinor }
}

// Filter out labels that would overlap based on minimum spacing
function filterOverlappingLabels(labels: MinorLabel[], minSpacing: number): MinorLabel[] {
  if (labels.length === 0) return labels

  const result: MinorLabel[] = []
  let lastShownPosition = -Infinity

  for (const label of labels) {
    // Always include the label for grid line purposes
    const shouldShowLabel = label.showLabel && (label.position - lastShownPosition >= minSpacing)

    result.push({
      ...label,
      showLabel: shouldShowLabel
    })

    if (shouldShowLabel) {
      lastShownPosition = label.position
    }
  }

  return result
}

// Get optimal scale based on date range
function getOptimalScale(start: Date, end: Date): TimeScale {
  const days = getDaysBetween(start, end)
  if (days <= 14) return "day"
  if (days <= 90) return "week"
  if (days <= 365) return "month"
  if (days <= 730) return "quarter"
  return "year"
}

export function GanttChartModern({ data, setData }: GanttChartModernProps) {
  // State
  const [timeScale, setTimeScale] = useState<TimeScale>("week")
  const [filters, setFilters] = useState<GanttFilters>({ clientIds: [], useCaseIds: [] })
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set())
  const [zoomLevel, setZoomLevel] = useState(1)

  // Timeline navigation - null means auto (1 week before today)
  const [viewStartDate, setViewStartDate] = useState<Date | null>(null)

  // Drag state
  const [dragState, setDragState] = useState<{
    useCaseId: string
    initialX: number
    initialLeft: number
    currentX: number
  } | null>(null)

  // Full-screen mode
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Recalculating state - shows visual feedback during timeline recalculation
  const [isRecalculating, setIsRecalculating] = useState(false)

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Calculate timelines
  const timelineResult = useMemo(() => calculateTimelines(data), [data])

  // Filter timelines
  const filteredTimelines = useMemo(() => {
    let result = timelineResult.timelines

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((t) => {
        const useCase = data.useCases.find((uc) => uc.id === t.useCaseId)
        if (!useCase) return false
        return (
          useCase.title.toLowerCase().includes(query) ||
          useCase.useCaseId.toLowerCase().includes(query) ||
          useCase.description?.toLowerCase().includes(query)
        )
      })
    }

    // Filter by use cases
    if (filters.useCaseIds.length > 0) {
      result = result.filter((t) => filters.useCaseIds.includes(t.useCaseId))
    }

    // Filter by clients
    if (filters.clientIds.length > 0) {
      result = result.filter((t) => {
        const useCase = data.useCases.find((uc) => uc.id === t.useCaseId)
        return useCase && filters.clientIds.includes(useCase.clientId)
      })
    }

    return result
  }, [timelineResult.timelines, filters, searchQuery, data])

  // Calculate timeline bounds
  // If viewStartDate is set, use that as the start; otherwise auto-calculate
  const { timelineStart, timelineEnd, dataStartDate, dataEndDate } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find the earliest start date and latest end date from data
    let dataStart = new Date(today)
    let dataEnd = new Date(today)
    if (filteredTimelines.length > 0) {
      dataStart = new Date(Math.min(...filteredTimelines.map((t) => t.startDate.getTime())))
      dataEnd = new Date(Math.max(...filteredTimelines.map((t) => t.endDate.getTime())))
    }

    // Use viewStartDate if set, otherwise auto (1 week before today or data start, whichever is earlier)
    let start: Date
    if (viewStartDate) {
      start = new Date(viewStartDate)
    } else {
      // Auto: start from 1 week before today, or data start if earlier
      const weekBeforeToday = new Date(today)
      weekBeforeToday.setDate(weekBeforeToday.getDate() - 7)
      start = new Date(Math.min(weekBeforeToday.getTime(), dataStart.getTime()))
    }
    start.setHours(0, 0, 0, 0)

    // Extend timeline based on scale to show future periods
    const extendedEnd = new Date(dataEnd)
    switch (timeScale) {
      case "day":
        extendedEnd.setDate(extendedEnd.getDate() + 14)
        break
      case "week":
        extendedEnd.setDate(extendedEnd.getDate() + 28)
        break
      case "month":
        extendedEnd.setMonth(extendedEnd.getMonth() + 2)
        break
      case "quarter":
        extendedEnd.setMonth(extendedEnd.getMonth() + 3)
        break
      case "year":
        extendedEnd.setFullYear(extendedEnd.getFullYear() + 1)
        break
    }

    return {
      timelineStart: start,
      timelineEnd: extendedEnd,
      dataStartDate: dataStart,
      dataEndDate: dataEnd
    }
  }, [filteredTimelines, timeScale, viewStartDate])

  // Auto-set optimal scale on data change
  useEffect(() => {
    if (filteredTimelines.length > 0) {
      const optimal = getOptimalScale(timelineStart, timelineEnd)
      setTimeScale(optimal)
    }
  }, []) // Only on mount

  // Group timelines by client
  const groupedTimelines = useMemo(() => {
    const groups: Map<string, { client: PlanningData["clients"][0]; items: Array<{ timeline: UseCaseTimeline; useCase: PlanningData["useCases"][0] }> }> = new Map()

    for (const timeline of filteredTimelines) {
      const useCase = data.useCases.find((uc) => uc.id === timeline.useCaseId)
      if (!useCase) continue

      const client = data.clients.find((c) => c.id === useCase.clientId)
      if (!client) continue

      if (!groups.has(client.id)) {
        groups.set(client.id, { client, items: [] })
      }

      groups.get(client.id)!.items.push({ timeline, useCase })
    }

    // Sort items within each group by their original order in data.useCases (stable order)
    // This prevents reordering when start dates change during drag-and-drop
    for (const group of groups.values()) {
      group.items.sort((a, b) => {
        const indexA = data.useCases.findIndex((uc) => uc.id === a.useCase.id)
        const indexB = data.useCases.findIndex((uc) => uc.id === b.useCase.id)
        return indexA - indexB
      })
    }

    return groups
  }, [filteredTimelines, data])

  // Calculate timeline width
  const totalDays = getDaysBetween(timelineStart, timelineEnd)
  const pixelsPerDay = getPixelsPerDay(timeScale) * zoomLevel
  const timelineWidth = Math.max(800, totalDays * pixelsPerDay)

  // Generate two-tier labels
  const { major: majorLabels, minor: minorLabels } = useMemo(
    () => generateTwoTierLabels(timelineStart, timelineEnd, timeScale, pixelsPerDay),
    [timelineStart, timelineEnd, timeScale, pixelsPerDay]
  )

  // Today position
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayPosition = useMemo(() => {
    if (today < timelineStart || today > timelineEnd) return null
    const daysFromStart = getDaysBetween(timelineStart, today)
    return daysFromStart * pixelsPerDay
  }, [today, timelineStart, timelineEnd, pixelsPerDay])

  // Calculate bar position
  const getBarPosition = useCallback(
    (timeline: UseCaseTimeline) => {
      const startOffset = getDaysBetween(timelineStart, timeline.startDate)
      const duration = getDaysBetween(timeline.startDate, timeline.endDate)

      const left = startOffset * pixelsPerDay
      const width = Math.max(MIN_BAR_WIDTH, duration * pixelsPerDay)

      return { left, width }
    },
    [timelineStart, pixelsPerDay]
  )

  // Track which element initiated the scroll to prevent loops
  const isScrollingSyncRef = useRef(false)

  // Sync scroll between timeline and header/sidebar
  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isScrollingSyncRef.current) return
    isScrollingSyncRef.current = true

    const scrollLeft = e.currentTarget.scrollLeft
    const scrollTop = e.currentTarget.scrollTop

    if (headerRef.current) {
      headerRef.current.scrollLeft = scrollLeft
    }
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = scrollTop
    }

    requestAnimationFrame(() => {
      isScrollingSyncRef.current = false
    })
  }, [])

  // Sync scroll from sidebar to timeline
  const handleSidebarScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isScrollingSyncRef.current) return
    isScrollingSyncRef.current = true

    const scrollTop = e.currentTarget.scrollTop

    if (timelineRef.current) {
      timelineRef.current.scrollTop = scrollTop
    }

    requestAnimationFrame(() => {
      isScrollingSyncRef.current = false
    })
  }, [])

  // Toggle client collapse
  const toggleClientCollapse = (clientId: string) => {
    setCollapsedClients((prev) => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(3, prev + 0.25))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.25, prev - 0.25))
  const handleReset = () => {
    setZoomLevel(1)
    setTimeScale(getOptimalScale(timelineStart, timelineEnd))
    setFilters({ clientIds: [], useCaseIds: [] })
    setSearchQuery("")
    setCollapsedClients(new Set())
    setViewStartDate(null) // Reset to auto
  }

  // Jump to today
  const jumpToToday = () => {
    if (timelineRef.current && todayPosition !== null) {
      timelineRef.current.scrollLeft = todayPosition - timelineRef.current.clientWidth / 2
    }
  }

  // Timeline navigation
  const navigateTimeline = (direction: "back" | "forward") => {
    const current = viewStartDate || timelineStart
    const newDate = new Date(current)

    // Amount to move depends on scale
    switch (timeScale) {
      case "day":
        newDate.setDate(newDate.getDate() + (direction === "back" ? -7 : 7))
        break
      case "week":
        newDate.setDate(newDate.getDate() + (direction === "back" ? -28 : 28))
        break
      case "month":
        newDate.setMonth(newDate.getMonth() + (direction === "back" ? -3 : 3))
        break
      case "quarter":
        newDate.setMonth(newDate.getMonth() + (direction === "back" ? -6 : 6))
        break
      case "year":
        newDate.setFullYear(newDate.getFullYear() + (direction === "back" ? -1 : 1))
        break
    }

    setViewStartDate(newDate)
  }

  // Jump to data start (earliest use case)
  const jumpToDataStart = () => {
    if (filteredTimelines.length > 0) {
      const earliest = new Date(Math.min(...filteredTimelines.map((t) => t.startDate.getTime())))
      earliest.setDate(earliest.getDate() - 7) // A bit of buffer
      setViewStartDate(earliest)
    }
  }

  // Drag handlers for rescheduling
  const handleDragStart = (useCaseId: string, e: React.MouseEvent) => {
    if (!setData) return // Can't drag if no setData

    e.preventDefault()
    const bar = e.currentTarget as HTMLElement
    const barRect = bar.getBoundingClientRect()

    setDragState({
      useCaseId,
      initialX: e.clientX,
      initialLeft: bar.offsetLeft,
      currentX: e.clientX
    })

    // Add cursor style to body during drag
    document.body.style.cursor = "grabbing"
  }

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState) return

      setDragState((prev) => prev ? { ...prev, currentX: e.clientX } : null)
    },
    [dragState]
  )

  const handleDragEnd = useCallback(
    async (e: MouseEvent) => {
      if (!dragState || !setData) {
        setDragState(null)
        document.body.style.cursor = ""
        return
      }

      // Calculate new position
      const deltaX = dragState.currentX - dragState.initialX
      const newLeft = dragState.initialLeft + deltaX

      // Convert pixel position to date
      const daysFromStart = newLeft / pixelsPerDay
      const newStartDate = new Date(timelineStart)
      newStartDate.setDate(newStartDate.getDate() + Math.round(daysFromStart))
      newStartDate.setHours(0, 0, 0, 0)

      // Find the use case and update it
      const useCase = data.useCases.find((uc) => uc.id === dragState.useCaseId)
      if (!useCase) {
        setDragState(null)
        document.body.style.cursor = ""
        return
      }

      // Show recalculating state before updating
      setIsRecalculating(true)
      setDragState(null)
      document.body.style.cursor = ""

      // Small delay to show the recalculating state
      await new Promise(resolve => setTimeout(resolve, 50))

      // Update the use case with new start date
      const updatedUseCases = data.useCases.map((uc) =>
        uc.id === dragState.useCaseId
          ? { ...uc, startDate: newStartDate.toISOString().split("T")[0], updatedAt: new Date().toISOString() }
          : uc
      )

      const updatedData: PlanningData = {
        ...data,
        useCases: updatedUseCases
      }

      // Update local state
      setData(updatedData)

      // Brief delay to let React settle the new state, then reveal
      await new Promise(resolve => setTimeout(resolve, 150))
      setIsRecalculating(false)

      // Persist to storage
      try {
        await writePlanningDataWithFallback(updatedData)
        toast.success("Start date updated", {
          description: `${useCase.useCaseId} moved to ${newStartDate.toLocaleDateString()}`
        })
      } catch (error) {
        console.error("Failed to save:", error)
        toast.error("Failed to save changes")
      }
    },
    [dragState, pixelsPerDay, timelineStart, data, setData]
  )

  // Add/remove global mouse event listeners for dragging
  useEffect(() => {
    if (dragState) {
      window.addEventListener("mousemove", handleDragMove)
      window.addEventListener("mouseup", handleDragEnd)
      return () => {
        window.removeEventListener("mousemove", handleDragMove)
        window.removeEventListener("mouseup", handleDragEnd)
      }
    }
  }, [dragState, handleDragMove, handleDragEnd])

  // Full-screen keyboard shortcut (Ctrl/Cmd + Shift + F or Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with Ctrl/Cmd + Shift + F
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault()
        setIsFullScreen((prev) => !prev)
      }
      // Exit with Escape
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFullScreen])

  // Toggle full-screen mode
  const toggleFullScreen = () => setIsFullScreen((prev) => !prev)

  // Filter counts
  const hasActiveFilters = filters.clientIds.length > 0 || filters.useCaseIds.length > 0 || searchQuery.length > 0

  if (timelineResult.timelines.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12">
        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Timeline Data</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Add start dates and assign developers to use cases to see them on the Gantt chart.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-background",
        isFullScreen
          ? "fixed inset-0 z-50"
          : "h-full"
      )}
    >
      {/* Header Controls */}
      <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20 px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Title and scale */}
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Project Timeline</h2>
                {isRecalculating && (
                  <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Calculating...</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredTimelines.length} use cases across {groupedTimelines.size} clients
              </p>
            </div>

            {/* Scale selector */}
            <Select value={timeScale} onValueChange={(v) => setTimeScale(v as TimeScale)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search use cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Timeline Navigation */}
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateTimeline("back")}
                className="px-2"
                title="Go back in time"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={jumpToDataStart}
                className="px-2 text-xs"
                title="Jump to earliest use case"
              >
                Start
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={jumpToToday}
                disabled={todayPosition === null}
                className="px-2 text-xs"
                title="Jump to today"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateTimeline("forward")}
                className="px-2"
                title="Go forward in time"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center border rounded-md">
              <Button variant="ghost" size="sm" onClick={handleZoomOut} className="px-2">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm font-medium min-w-[4rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} className="px-2">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {filters.clientIds.length + filters.useCaseIds.length + (searchQuery ? 1 : 0)}
                </Badge>
              )}
            </Button>

            <Button variant="ghost" size="sm" onClick={handleReset} title="Reset view">
              <RotateCcw className="h-4 w-4" />
            </Button>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isFullScreen ? "default" : "outline"}
                    size="sm"
                    onClick={toggleFullScreen}
                  >
                    {isFullScreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-white text-gray-900 border border-gray-200 shadow-lg">
                  <p>{isFullScreen ? "Exit full screen" : "Full screen"}</p>
                  <p className="text-xs text-gray-500">
                    {isFullScreen ? "Esc" : "Ctrl+Shift+F"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t flex gap-6">
            {/* Client Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Clients</label>
              <div className="flex flex-wrap gap-2">
                {data.clients.map((client) => (
                  <label
                    key={client.id}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer text-sm transition-colors",
                      filters.clientIds.includes(client.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <Checkbox
                      checked={filters.clientIds.includes(client.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFilters({ ...filters, clientIds: [...filters.clientIds, client.id] })
                        } else {
                          setFilters({ ...filters, clientIds: filters.clientIds.filter((id) => id !== client.id) })
                        }
                      }}
                      className="hidden"
                    />
                    {client.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="self-end">
                Clear all
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Gantt Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed Sidebar */}
        <div
          className="shrink-0 border-r bg-muted/30 overflow-hidden"
          style={{ width: SIDEBAR_WIDTH }}
        >
          {/* Sidebar header */}
          <div
            className="border-b bg-muted/50 px-4 flex items-center font-medium text-sm text-muted-foreground"
            style={{ height: HEADER_HEIGHT }}
          >
            Use Case
          </div>

          {/* Sidebar content - synced scroll with timeline */}
          <div
            ref={sidebarRef}
            className="overflow-y-auto scrollbar-hide"
            style={{ height: `calc(100% - ${HEADER_HEIGHT}px)` }}
            onScroll={handleSidebarScroll}
          >
            <div>
              {Array.from(groupedTimelines.entries()).map(([clientId, group]) => {
                const isCollapsed = collapsedClients.has(clientId)

                return (
                  <div key={clientId}>
                    {/* Client header row */}
                    <div
                      className="flex items-center gap-2 px-3 bg-muted/60 border-b cursor-pointer hover:bg-muted transition-colors"
                      style={{ height: ROW_HEIGHT }}
                      onClick={() => toggleClientCollapse(clientId)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      )}
                      <span className="font-semibold truncate">{group.client.name}</span>
                      <Badge variant="secondary" className="ml-auto shrink-0">
                        {group.items.length}
                      </Badge>
                    </div>

                    {/* Use case rows */}
                    {!isCollapsed &&
                      group.items.map(({ useCase }) => (
                        <TooltipProvider key={useCase.id} delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="flex items-center gap-2 px-3 pl-8 border-b hover:bg-muted/40 transition-colors cursor-default"
                                style={{ height: ROW_HEIGHT }}
                              >
                                <Badge variant="outline" className="shrink-0 font-mono text-xs">
                                  {useCase.useCaseId}
                                </Badge>
                                <span className="truncate text-sm">
                                  {useCase.title}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="max-w-sm bg-white text-gray-900 border border-gray-200 shadow-lg"
                            >
                              <div className="space-y-1">
                                <div className="font-semibold">{useCase.useCaseId}: {useCase.title}</div>
                                {useCase.description && (
                                  <p className="text-xs text-gray-500">{useCase.description}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Timeline Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline Header (horizontal scroll synced) - Two Tier */}
          <div
            ref={headerRef}
            className="shrink-0 border-b bg-muted/30 overflow-hidden"
            style={{ height: HEADER_HEIGHT }}
          >
            <div className="relative" style={{ width: timelineWidth, height: "100%" }}>
              {/* Major labels row (top) - spanning labels like months/years */}
              <div
                className="absolute top-0 left-0 right-0 border-b border-border/50 bg-muted/50"
                style={{ height: MAJOR_TIER_HEIGHT }}
              >
                {majorLabels.map((label, idx) => (
                  <div
                    key={`major-${idx}`}
                    className="absolute top-0 h-full flex items-center justify-center border-l border-border/60 bg-muted/20 overflow-hidden"
                    style={{
                      left: label.position,
                      width: label.width
                    }}
                  >
                    <span className="text-xs font-semibold text-foreground truncate px-2">
                      {label.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Minor labels row (bottom) - individual time units */}
              <div
                className="absolute left-0 right-0"
                style={{ top: MAJOR_TIER_HEIGHT, height: MINOR_TIER_HEIGHT }}
              >
                {minorLabels.map((label, idx) => (
                  <div
                    key={`minor-${idx}`}
                    className="absolute top-0 h-full border-l border-border/30 flex items-center"
                    style={{ left: label.position }}
                  >
                    {label.showLabel && (
                      <span className="text-[11px] text-muted-foreground pl-1.5 whitespace-nowrap">
                        {label.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Today marker in header - aligned with grid */}
              {todayPosition !== null && (
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none"
                  style={{ left: todayPosition, transform: "translateX(-50%)" }}
                >
                  <div className="flex flex-col items-center h-full">
                    <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-b shadow-sm whitespace-nowrap">
                      TODAY
                    </div>
                    <div className="flex-1 w-0.5 bg-red-500" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Content (scrollable) */}
          <div
            ref={timelineRef}
            className="flex-1 overflow-auto"
            onScroll={handleTimelineScroll}
          >
            <div className="relative" style={{ width: timelineWidth, minHeight: "100%" }}>
              {/* Grid lines - use minor labels for consistent alignment */}
              {minorLabels.map((label, idx) => (
                <div
                  key={`grid-${idx}`}
                  className={cn(
                    "absolute top-0 bottom-0 border-l",
                    label.showLabel ? "border-border/30" : "border-border/15"
                  )}
                  style={{ left: label.position }}
                />
              ))}

              {/* Today line - centered on position to align with header */}
              {todayPosition !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{
                    left: todayPosition,
                    transform: "translateX(-50%)",
                    boxShadow: "0 0 6px rgba(239, 68, 68, 0.4)"
                  }}
                />
              )}

              {/* Gantt rows */}
              {Array.from(groupedTimelines.entries()).map(([clientId, group]) => {
                const isCollapsed = collapsedClients.has(clientId)

                return (
                  <div key={clientId}>
                    {/* Client header row - empty space in timeline */}
                    <div
                      className="border-b bg-muted/20"
                      style={{ height: ROW_HEIGHT }}
                    />

                    {/* Use case bars */}
                    {!isCollapsed &&
                      group.items.map(({ timeline, useCase }) => {
                        const { left: originalLeft, width } = getBarPosition(timeline)
                        const statusStyle = STATUS_COLORS[useCase.status] || STATUS_COLORS["high-level definition"]
                        const priorityStyle = PRIORITY_STYLES[useCase.priority] || ""

                        // Calculate progress
                        const tasks = data.tasks.filter((t) => t.useCaseId === useCase.id)
                        const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0)
                        const completedHours = tasks
                          .filter((t) => t.status === "done")
                          .reduce((sum, t) => sum + t.estimatedHours, 0)
                        const progress = totalHours > 0 ? (completedHours / totalHours) * 100 : 0

                        // Has conflict
                        const hasConflict = timelineResult.conflicts.some((c) =>
                          c.useCaseIds.includes(useCase.id)
                        )

                        // Check if this bar is being dragged
                        const isDragging = dragState?.useCaseId === useCase.id
                        const dragOffset = isDragging ? dragState.currentX - dragState.initialX : 0
                        const left = originalLeft + dragOffset

                        // Can this bar be dragged?
                        const canDrag = !!setData

                        return (
                          <div
                            key={useCase.id}
                            className="relative border-b"
                            style={{ height: ROW_HEIGHT }}
                          >
                            <TooltipProvider delayDuration={isDragging ? 9999 : 100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      "absolute top-1/2 -translate-y-1/2 rounded border",
                                      // Recalculating state - subtle pulse animation
                                      isRecalculating
                                        ? "animate-pulse opacity-60 pointer-events-none"
                                        : "transition-all duration-300 ease-out",
                                      !isRecalculating && canDrag && "cursor-grab hover:scale-[1.02] hover:shadow-lg",
                                      isDragging && "cursor-grabbing shadow-xl scale-105 z-50 ring-2 ring-primary",
                                      statusStyle.bg,
                                      statusStyle.border,
                                      priorityStyle,
                                      hasConflict && !isDragging && !isRecalculating && "ring-2 ring-yellow-400 ring-offset-1"
                                    )}
                                    style={{
                                      left,
                                      width,
                                      height: ROW_HEIGHT - 12
                                    }}
                                    onMouseDown={(e) => canDrag && !isRecalculating && handleDragStart(useCase.id, e)}
                                  >
                                    {/* Drag handle indicator */}
                                    {canDrag && (
                                      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
                                        <GripVertical className="h-3 w-3 text-white/70" />
                                      </div>
                                    )}

                                    {/* Man-days label on bar (when wide enough) */}
                                    {width > 60 && (
                                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className={cn(
                                          "text-xs font-semibold",
                                          statusStyle.text,
                                          "drop-shadow-sm"
                                        )}>
                                          {useCase.manDays}d
                                        </span>
                                      </div>
                                    )}

                                    {/* Progress overlay */}
                                    {progress > 0 && (
                                      <div
                                        className="absolute left-0 top-0 h-full bg-white/30 rounded-l"
                                        style={{ width: `${progress}%` }}
                                      />
                                    )}

                                    {/* Conflict indicator */}
                                    {hasConflict && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-bold text-yellow-900">
                                        !
                                      </div>
                                    )}

                                    {/* Priority indicator */}
                                    {useCase.priority === "high" && (
                                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
                                    )}

                                    {/* Drag preview - show new date */}
                                    {isDragging && (
                                      <div className="absolute -top-8 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                                        {(() => {
                                          const daysFromStart = left / pixelsPerDay
                                          const newDate = new Date(timelineStart)
                                          newDate.setDate(newDate.getDate() + Math.round(daysFromStart))
                                          return newDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-xs bg-white text-gray-900 border border-gray-200 shadow-lg"
                                >
                                  <div className="space-y-2">
                                    <div>
                                      <div className="font-semibold text-gray-900">{useCase.useCaseId}: {useCase.title}</div>
                                      {useCase.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                          {useCase.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-900">
                                      <div>
                                        <span className="text-gray-500">Start:</span>{" "}
                                        {formatDate(timeline.startDate, "day")}
                                      </div>
                                      <div>
                                        <span className="text-gray-500">End:</span>{" "}
                                        {formatDate(timeline.endDate, "day")}
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Effort:</span>{" "}
                                        <span className="font-medium">{useCase.manDays} man-days</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Working Days:</span>{" "}
                                        {timeline.duration}
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Calendar Days:</span>{" "}
                                        {timeline.calendarDays}
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Velocity:</span>{" "}
                                        {timeline.effectiveCapacity.toFixed(1)} man-days/day
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Progress:</span>{" "}
                                        {progress.toFixed(0)}%
                                      </div>
                                    </div>
                                    <div className="flex gap-1 flex-wrap">
                                      <Badge variant="outline" className="text-[10px] border-gray-300 text-gray-700">
                                        {useCase.status}
                                      </Badge>
                                      <Badge
                                        variant={useCase.priority === "high" ? "destructive" : "secondary"}
                                        className="text-[10px]"
                                      >
                                        {useCase.priority} priority
                                      </Badge>
                                    </div>
                                    {useCase.assignedDeveloperIds && useCase.assignedDeveloperIds.length > 0 && (
                                      <div className="text-xs text-gray-900">
                                        <span className="text-gray-500">Team:</span>{" "}
                                        {useCase.assignedDeveloperIds
                                          .map((id) => data.developers.find((d) => d.id === id)?.name)
                                          .filter(Boolean)
                                          .join(", ")}
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )
                      })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
