"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { Calendar } from "lucide-react"
import type { PlanningData, TimeScale, GanttFilters } from "@/types/planning-types"
import { calculateTimelines, type UseCaseTimeline } from "@/lib/timeline-calculator"
import { TimelineControls } from "./timeline-controls"
import { TimelineIndicators } from "./timeline-indicators"
import {
  generateDateLabels,
  calculateDatePosition,
  getOptimalTimeScale,
  formatDateForScale,
  extendTimelineEnd
} from "@/lib/timeline-scale"
import { getWorkingDaysBetween, addWorkingDays, getNextWorkingDay, isWeekend } from "@/lib/working-days"

interface GanttChartViewProps {
  data: PlanningData
}

const statusColors: Record<string, string> = {
  "high-level definition": "bg-gray-600 dark:bg-gray-500",
  groomed: "bg-blue-600 dark:bg-blue-500",
  defined: "bg-yellow-600 dark:bg-yellow-500",
  "in development": "bg-orange-600 dark:bg-orange-500",
  completed: "bg-green-600 dark:bg-green-500"
}

const priorityHeights: Record<string, string> = {
  high: "h-6",
  medium: "h-5",
  low: "h-4"
}

const priorityBorderWidths: Record<string, string> = {
  high: "border-l-4",
  medium: "border-l-2",
  low: "border-l"
}

// Work type detection from title/description
function detectWorkType(title: string, description?: string): string {
  const text = `${title} ${description || ""}`.toLowerCase()
  if (text.includes("integration") || text.includes("integrate")) return "integration"
  if (text.includes("ui") || text.includes("ux") || text.includes("interface") || text.includes("design")) return "ux"
  if (text.includes("infra") || text.includes("infrastructure") || text.includes("deploy")) return "infra"
  if (text.includes("ai") || text.includes("ml") || text.includes("machine learning") || text.includes("model")) return "ai"
  if (text.includes("api") || text.includes("endpoint")) return "api"
  return "general"
}

const workTypeColors: Record<string, string> = {
  integration: "border-l-blue-500",
  ux: "border-l-purple-500",
  infra: "border-l-gray-500",
  ai: "border-l-pink-500",
  api: "border-l-cyan-500",
  general: "border-l-slate-500"
}

// Calculate progress from tasks
function calculateProgress(useCaseId: string, tasks: PlanningData["tasks"]): number {
  const useCaseTasks = tasks.filter((t) => t.useCaseId === useCaseId)
  if (useCaseTasks.length === 0) return 0
  
  const totalHours = useCaseTasks.reduce((sum, t) => sum + t.estimatedHours, 0)
  const completedHours = useCaseTasks
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + t.estimatedHours, 0)
  
  return totalHours > 0 ? (completedHours / totalHours) * 100 : 0
}

// Calculate risk level based on gap and complexity
function calculateRiskLevel(gap: string, complexity: string): "low" | "medium" | "high" {
  const gapRisk = gap === "custom-implementation" ? 3 : gap === "significant-extension" ? 2 : gap === "moderate-extension" ? 1 : 0
  const complexityRisk = complexity === "high" ? 2 : complexity === "medium" ? 1 : 0
  const totalRisk = gapRisk + complexityRisk
  
  if (totalRisk >= 4) return "high"
  if (totalRisk >= 2) return "medium"
  return "low"
}

export function GanttChartView({ data }: GanttChartViewProps) {
  // State management
  const [timeScale, setTimeScale] = useState<TimeScale>("week")
  const [zoomLevel, setZoomLevel] = useState(1)
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>()
  const [filters, setFilters] = useState<GanttFilters>({
    clientIds: [],
    useCaseIds: []
  })
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set())

  // Calculate timelines
  const timelineResult = useMemo(() => {
    return calculateTimelines(data)
  }, [data])

  // Filter timelines based on filters
  const filteredTimelines = useMemo(() => {
    let result = timelineResult.timelines

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
  }, [timelineResult.timelines, filters, data])

  // Calculate timeline range (with date range filter if set)
  // When custom range is set, use it directly
  // When not set, extend timeline based on scale to show future periods
  const timelineStart = useMemo(() => {
    if (dateRange) return dateRange.start
    if (filteredTimelines.length === 0) {
      // If no data, start from today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return today
    }
    return new Date(Math.min(...filteredTimelines.map((t) => t.startDate.getTime())))
  }, [filteredTimelines, dateRange])

  const timelineEnd = useMemo(() => {
    if (dateRange) return dateRange.end
    
    if (filteredTimelines.length === 0) {
      // If no data, extend from today based on scale
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return extendTimelineEnd(today, timeScale)
    }
    
    // Get the latest end date from data
    const dataEnd = new Date(Math.max(...filteredTimelines.map((t) => t.endDate.getTime())))
    
    // Extend based on time scale to show future periods
    return extendTimelineEnd(dataEnd, timeScale)
  }, [filteredTimelines, dateRange, timeScale])

  // Auto-select optimal time scale on mount
  const hasInitializedScale = useRef(false)
  useEffect(() => {
    if (filteredTimelines.length > 0 && !hasInitializedScale.current) {
      const optimal = getOptimalTimeScale(timelineStart, timelineEnd)
      setTimeScale(optimal)
      hasInitializedScale.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Group filtered timelines by client
  const timelinesByClient = useMemo(() => {
    const grouped: Record<
      string,
      Array<{ timeline: UseCaseTimeline; useCase: PlanningData["useCases"][0] }>
    > = {}

    for (const timeline of filteredTimelines) {
      const useCase = data.useCases.find((uc) => uc.id === timeline.useCaseId)
      if (!useCase) continue

      const client = data.clients.find((c) => c.id === useCase.clientId)
      if (!client) continue

      // Apply client filter
      if (filters.clientIds.length > 0 && !filters.clientIds.includes(client.id)) {
        continue
      }

      if (!grouped[client.id]) {
        grouped[client.id] = []
      }

      grouped[client.id].push({ timeline, useCase })
    }

    return grouped
  }, [filteredTimelines, data, filters])

  // Weekend markers for full-height background (only for day/week scale)
  const weekendMarkers = useMemo(() => {
    if (timeScale !== "day" && timeScale !== "week") return []
    
    const markers: Array<{ date: Date; position: number }> = []
    const current = new Date(timelineStart)
    current.setHours(0, 0, 0, 0)
    const end = new Date(timelineEnd)
    end.setHours(0, 0, 0, 0)

    while (current <= end) {
      if (isWeekend(current)) {
        const position = calculateDatePosition(
          current,
          timelineStart,
          timelineEnd,
          timeScale,
          100 * zoomLevel
        )
        markers.push({ date: new Date(current), position })
      }
      current.setDate(current.getDate() + 1)
    }

    return markers
  }, [timelineStart, timelineEnd, timeScale, zoomLevel])

  // Calculate bar position using new scale utilities
  // Positions are calculated based on the zoomed width, then converted to percentage
  const getBarPosition = useCallback(
    (timeline: UseCaseTimeline) => {
      const scaledWidth = 100 * zoomLevel
      
      const left = calculateDatePosition(
        timeline.startDate,
        timelineStart,
        timelineEnd,
        timeScale,
        scaledWidth
      )
      const right = calculateDatePosition(
        timeline.endDate,
        timelineStart,
        timelineEnd,
        timeScale,
        scaledWidth
      )

      // Handle bars that are completely outside the visible range
      if (right < 0 || left > scaledWidth) {
        // Bar is completely outside visible range
        return { left: -100, width: 0, isVisible: false as const }
      }

      // Clip bars that extend beyond the visible range
      const clippedLeft = Math.max(0, left)
      const clippedRight = Math.min(scaledWidth, right)
      const clippedWidth = clippedRight - clippedLeft

      // Convert absolute positions to percentage of the zoomed container
      return {
        left: (clippedLeft / scaledWidth) * 100,
        width: Math.max(1, (clippedWidth / scaledWidth) * 100),
        isVisible: true as const
      }
    },
    [timelineStart, timelineEnd, timeScale, zoomLevel]
  )

  // Generate date labels based on time scale
  const dateLabels = useMemo(() => {
    return generateDateLabels(timelineStart, timelineEnd, timeScale, 100)
  }, [timelineStart, timelineEnd, timeScale])

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(5, prev + 0.1))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(0.5, prev - 0.1))
  }, [])

  const handleReset = useCallback(() => {
    setTimeScale(getOptimalTimeScale(timelineStart, timelineEnd))
    setZoomLevel(1)
    setDateRange(undefined)
    setFilters({ clientIds: [], useCaseIds: [] })
  }, [timelineStart, timelineEnd])

  // Fit to content - calculate optimal zoom to show all tasks
  const handleFitToContent = useCallback(() => {
    if (filteredTimelines.length === 0) return
    
    const earliestStart = Math.min(...filteredTimelines.map((t) => t.startDate.getTime()))
    const latestEnd = Math.max(...filteredTimelines.map((t) => t.endDate.getTime()))
    const totalDays = (latestEnd - earliestStart) / (1000 * 60 * 60 * 24)
    
    // Calculate optimal zoom to fit content with some padding
    const optimalZoom = Math.max(0.5, Math.min(5, 100 / totalDays * 1.2))
    setZoomLevel(optimalZoom)
    setDateRange({
      start: new Date(earliestStart),
      end: new Date(latestEnd)
    })
  }, [filteredTimelines])

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        if (e.deltaY < 0) {
          handleZoomIn()
        } else {
          handleZoomOut()
        }
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: false })
    return () => window.removeEventListener("wheel", handleWheel)
  }, [handleZoomIn, handleZoomOut])

  if (timelineResult.timelines.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Gantt Chart</h2>
          <p className="text-muted-foreground">
            Visual timeline of use cases with calculated timelines
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No use cases with start dates and assigned developers
            </p>
            <p className="text-sm text-muted-foreground">
              Add start dates and assign developers to use cases to see them on the Gantt chart
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (filteredTimelines.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Gantt Chart</h2>
          <p className="text-muted-foreground">
            Visual timeline of use cases with calculated timelines based on developer assignments
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No data matches the current filters</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters to see more use cases
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full h-screen flex flex-col relative -mx-6 -my-6">
      <div className="px-6 pt-6 pb-4 relative shrink-0">
        <div>
          <h2 className="text-3xl font-bold">Gantt Chart</h2>
          <p className="text-muted-foreground">
            Visual timeline of use cases with calculated timelines based on developer assignments
          </p>
        </div>
        
        {/* Conflicts warning - small transparent overlay in top right */}
        {timelineResult.conflicts.length > 0 && (
          <div className="absolute top-6 right-6 z-10 bg-yellow-50/80 dark:bg-yellow-900/30 backdrop-blur-sm border border-yellow-200/50 dark:border-yellow-800/50 rounded-lg p-2 max-w-xs shadow-sm">
            <div className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
              Capacity Conflicts
            </div>
            <div className="text-[10px] text-yellow-700 dark:text-yellow-300 space-y-0.5 max-h-32 overflow-y-auto">
              {timelineResult.conflicts.map((conflict, index) => (
                <div key={index} className="leading-tight">
                  {conflict.developers
                    .map((d) => {
                      const dev = data.developers.find((dev) => dev.id === d)
                      return dev?.name || d
                    })
                    .join(", ")}{" "}
                  → {conflict.useCaseIds
                    .map((id) => {
                      const uc = data.useCases.find((uc) => uc.id === id)
                      return uc?.useCaseId || id
                    })
                    .join(", ")}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-4 shrink-0">
        {/* Timeline Controls */}
        <TimelineControls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          filters={filters}
          onFiltersChange={setFilters}
          data={data}
          onReset={handleReset}
          onFitToContent={handleFitToContent}
          onJumpToToday={() => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const weekFromToday = new Date(today)
            weekFromToday.setDate(weekFromToday.getDate() + 7)
            setDateRange({ start: today, end: weekFromToday })
          }}
        />
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overflow-x-auto px-6 pb-6">
        <div className="space-y-6" style={{ minWidth: `${100 * zoomLevel}%` }}>
          {/* Timeline header with date axis */}
          <div className="relative border-b pb-8 pl-24">
            <div className="relative h-8">
              {generateDateLabels(timelineStart, timelineEnd, timeScale, 100 * zoomLevel).map((label, index, array) => {
                // Position is already calculated for the scaled width, convert to percentage
                const positionPercent = (label.position / (100 * zoomLevel)) * 100
                // Determine if this is a major period boundary (first of month/quarter/year)
                const isMajorBoundary = index === 0 || 
                  (timeScale === "month" && label.date.getDate() === 1) ||
                  (timeScale === "quarter" && label.date.getDate() === 1 && [0, 3, 6, 9].includes(label.date.getMonth())) ||
                  (timeScale === "year" && label.date.getMonth() === 0 && label.date.getDate() === 1)
                
                return (
                  <div
                    key={index}
                    className={`absolute top-0 h-full border-l ${
                      label.isWeekend 
                        ? "border-gray-300 dark:border-gray-700 opacity-20" 
                        : isMajorBoundary
                          ? "border-gray-700 dark:border-gray-300 border-l-2"
                          : "border-gray-500 dark:border-gray-400 opacity-50"
                    }`}
                    style={{ left: `${positionPercent}%` }}
                  >
                    {!label.isWeekend && (
                      <div className="absolute -bottom-7 left-0 transform -translate-x-1/2 text-sm font-semibold text-foreground whitespace-nowrap bg-background/95 border border-border/50 px-1.5 py-0.5 rounded shadow-sm">
                        {label.label}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Gantt bars grouped by client */}
          <div className="space-y-4 pl-24 relative">
            {/* Weekend markers - background layer */}
            {weekendMarkers.length > 0 && (
              <div className="absolute inset-0 pointer-events-none z-0">
                {weekendMarkers.map((marker, index) => (
                  <div
                    key={`weekend-${index}`}
                    className="absolute top-0 bottom-0 bg-gray-100 dark:bg-gray-800 opacity-30"
                    style={{
                      left: `${marker.position}%`,
                      width: "2%"
                    }}
                  />
                ))}
              </div>
            )}

            {Object.entries(timelinesByClient).map(([clientId, clientTimelines]) => {
              const client = data.clients.find((c) => c.id === clientId)
              if (!client || clientTimelines.length === 0) return null

              return (
                <div key={clientId} className="space-y-2 relative">
                  <h3 className="font-semibold text-base text-foreground">{client.name}</h3>
                  
                  {/* Timeline Indicators for this client */}
                  <div className="relative" style={{ minHeight: `${clientTimelines.length * 32}px` }}>
                    <TimelineIndicators
                      timelines={clientTimelines.map((ct) => ct.timeline)}
                      data={data}
                      timelineStart={timelineStart}
                      timelineEnd={timelineEnd}
                      timeScale={timeScale}
                      width={100 * zoomLevel}
                      hideWeekendMarkers={true}
                    />

                    {clientTimelines.map(({ timeline, useCase }, index) => {
                        const position = getBarPosition(timeline)
                        const { left, width, isVisible } = position
                        
                        // Skip bars that are completely outside visible range
                        if (isVisible === false) return null
                        
                        const statusColor = statusColors[useCase.status] || "bg-gray-500"
                        
                        // Calculate progress
                        const progress = calculateProgress(useCase.id, data.tasks)
                        
                        // Detect work type
                        const workType = detectWorkType(useCase.title, useCase.description)
                        const workTypeColor = workTypeColors[workType] || workTypeColors.general
                        
                        // Calculate risk level
                        const riskLevel = calculateRiskLevel(useCase.gap, useCase.complexity)
                        
                        // Get priority height and border
                        const priorityHeight = priorityHeights[useCase.priority] || priorityHeights.medium
                        const priorityBorder = priorityBorderWidths[useCase.priority] || priorityBorderWidths.medium
                        
                        // Check for capacity conflicts
                        const hasCapacityConflict = timelineResult.conflicts.some(
                          (conflict) => conflict.useCaseIds.includes(useCase.id)
                        )

                        // Get assigned developers
                        const assignedDevelopers =
                          useCase.assignedDeveloperIds
                            ?.map((devId) =>
                              data.developers.find((d) => d.id === devId)
                            )
                            .filter(Boolean) || []

                        // Calculate working days (dynamic duration - adjusted for allocation and concurrency)
                        const workingDays = getWorkingDaysBetween(
                          timeline.startDate,
                          timeline.endDate
                        )
                        const calendarDays = Math.ceil(
                          (timeline.endDate.getTime() - timeline.startDate.getTime()) /
                            (1000 * 60 * 60 * 24)
                        )

                        // Calculate non-dynamic duration (adjusted for weekends only, no concurrency)
                        // This is the duration assuming full developer capacity, only adjusted for weekends
                        let nonDynamicDuration = useCase.manDays
                        if (assignedDevelopers.length > 0) {
                          // Calculate total daily capacity assuming full capacity (no concurrency)
                          let totalDailyCapacity = 0
                          for (const dev of assignedDevelopers) {
                            if (dev) {
                              totalDailyCapacity += dev.capacity / 5 // hours per day (5 working days)
                            }
                          }
                          // Convert to man-days per day (8 hours = 1 man-day)
                          const manDaysPerDay = totalDailyCapacity / 8
                          if (manDaysPerDay > 0) {
                            const initialDuration = useCase.manDays / manDaysPerDay
                            // Calculate end date with working days only
                            const nonDynamicEndDate = addWorkingDays(timeline.startDate, Math.ceil(initialDuration))
                            // Get working days between start and end
                            nonDynamicDuration = getWorkingDaysBetween(timeline.startDate, nonDynamicEndDate)
                          }
                        }

                        // Format dates for annotations
                        const startDateLabel = formatDateForScale(timeline.startDate, timeScale)
                        const endDateLabel = formatDateForScale(timeline.endDate, timeScale)
                        
                        // Duration label for annotation (dynamic duration)
                        const durationLabel = `${timeline.duration} days`
                        
                        // Check if start/end dates are within visible range for annotation positioning
                        const startInRange = timeline.startDate >= timelineStart && timeline.startDate <= timelineEnd
                        const endInRange = timeline.endDate >= timelineStart && timeline.endDate <= timelineEnd
                        
                        // Determine if dates should be shown inside or outside bar
                        // Calculate approximate pixel width based on container
                        const containerWidth = 100 * zoomLevel // percentage-based width
                        const barWidthPx = (width / 100) * containerWidth
                        const showDatesInside = barWidthPx > 120
                        const showDatesAtAll = barWidthPx > 60
                        const showDurationInside = barWidthPx > 100
                        
                        // For very small tasks (< 1 day or < 20px), use special visual treatment
                        const isVerySmallTask = barWidthPx < 20
                        const isLessThanOneDay = workingDays < 1

                        return (
                          <TooltipProvider key={useCase.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative h-8 cursor-pointer" style={{ marginTop: index > 0 ? "8px" : "0" }}>
                                  {/* Start date annotation (outside bar if narrow) */}
                                  {showDatesAtAll && !showDatesInside && startInRange && (
                                    <div
                                      className="absolute text-xs text-muted-foreground whitespace-nowrap bg-background/80 px-1 rounded z-20"
                                      style={{
                                        left: `${left}%`,
                                        top: "-22px",
                                        transform: "translateX(-50%)"
                                      }}
                                    >
                                      {startDateLabel}
                                    </div>
                                  )}
                                  
                                  {isVerySmallTask || isLessThanOneDay ? (
                                    // Special visual treatment for very small tasks
                                    <div
                                      className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${statusColor} shadow-md hover:scale-125 transition-transform cursor-pointer z-10 border-2 border-white dark:border-gray-900`}
                                      style={{
                                        left: `${left}%`,
                                        transform: "translateY(-50%)"
                                      }}
                                      title={`${useCase.useCaseId}: ${useCase.title} (${workingDays} working days)`}
                                    />
                                  ) : (
                                    <div
                                      className={`absolute top-1/2 -translate-y-1/2 ${priorityHeight} rounded ${statusColor} ${workTypeColor} ${priorityBorder} flex items-center px-1.5 text-xs text-white shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer relative overflow-visible z-10 ${
                                        hasCapacityConflict ? "ring-2 ring-yellow-400 ring-opacity-75" : ""
                                      }`}
                                      style={{
                                        left: `${left}%`,
                                        width: `${width}%`,
                                        minWidth: "60px"
                                      }}
                                    >
                                      {/* Progress bar overlay */}
                                      {progress > 0 && (
                                        <div
                                          className="absolute left-0 top-0 h-full bg-green-400/40 rounded-l"
                                          style={{ width: `${progress}%` }}
                                        />
                                      )}
                                      
                                      {/* Priority indicator badge */}
                                      {useCase.priority === "high" && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900 z-20" />
                                      )}
                                      
                                      {/* Risk indicator */}
                                      {riskLevel === "high" && (
                                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-orange-500 rounded-full border border-white dark:border-gray-900 z-20" />
                                      )}
                                      
                                      {/* Capacity conflict badge */}
                                      {hasCapacityConflict && (
                                        <div className="absolute -top-1 right-2 bg-yellow-500 text-yellow-900 text-[8px] font-bold px-1 rounded z-20">
                                          !
                                        </div>
                                      )}
                                      
                                      <div className="flex items-center gap-2 truncate w-full z-10 relative">
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] shrink-0 bg-white/20 text-white border-white/30 font-semibold"
                                        >
                                          {useCase.useCaseId}
                                        </Badge>
                                        <span className="truncate text-[11px] font-medium">
                                          {useCase.title}
                                        </span>
                                      </div>
                                      
                                      {/* Developer avatars/initials */}
                                      {assignedDevelopers.length > 0 && (
                                        <div className="absolute right-1 top-0.5 flex gap-0.5 z-20">
                                          {assignedDevelopers.slice(0, 3).map((dev) => {
                                            if (!dev) return null
                                            return (
                                              <div
                                                key={dev.id}
                                                className="w-3 h-3 rounded-full bg-white/30 text-[8px] flex items-center justify-center font-bold text-white border border-white/50"
                                                title={dev.name}
                                              >
                                                {dev.name.charAt(0).toUpperCase()}
                                              </div>
                                            )
                                          })}
                                          {assignedDevelopers.length > 3 && (
                                            <div className="w-3 h-3 rounded-full bg-white/30 text-[8px] flex items-center justify-center font-bold text-white border border-white/50">
                                              +{assignedDevelopers.length - 3}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    
                                    {/* Start date annotation (inside bar if wide enough) - positioned after useCaseId badge */}
                                    {showDatesInside && startInRange && (
                                      <div className="absolute left-12 top-0.5 text-[10px] font-medium opacity-90 bg-black/20 px-1 rounded z-20">
                                        {startDateLabel}
                                      </div>
                                    )}
                                    
                                    {/* End date annotation (inside bar if wide enough) */}
                                    {showDatesInside && endInRange && (
                                      <div className="absolute right-2 top-0.5 text-[10px] font-medium opacity-90 bg-black/20 px-1 rounded z-20">
                                        {endDateLabel}
                                      </div>
                                    )}
                                    
                                    {/* Duration annotation (inside bar if wide enough) - only show if dates are not shown to avoid overlap */}
                                    {showDurationInside && !showDatesInside && (
                                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-semibold opacity-95 bg-black/30 px-1.5 py-0.5 rounded whitespace-nowrap z-20">
                                        {durationLabel}
                                      </div>
                                    )}
                                  </div>
                                  )}
                                  
                                  {/* End date annotation (outside bar if narrow) */}
                                  {showDatesAtAll && !showDatesInside && endInRange && (
                                    <div
                                      className="absolute text-xs text-muted-foreground whitespace-nowrap bg-background/80 px-1 rounded z-20"
                                      style={{
                                        left: `calc(${left}% + ${width}% - 4px)`,
                                        top: "-22px"
                                      }}
                                    >
                                      {endDateLabel}
                                    </div>
                                  )}
                                  
                                  {/* Duration annotation (outside bar if narrow) - position below end date to avoid overlap */}
                                  {!showDurationInside && showDatesAtAll && !showDatesInside && (
                                    <div
                                      className="absolute text-xs font-medium text-muted-foreground whitespace-nowrap bg-background/90 px-1.5 py-0.5 rounded border z-20"
                                      style={{
                                        left: `calc(${left}% + ${width}% / 2)`,
                                        top: "28px",
                                        transform: "translateX(-50%)"
                                      }}
                                    >
                                      {durationLabel}
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-sm">
                                <div className="space-y-3">
                                  <div>
                                    <div className="font-semibold text-base">
                                      {useCase.useCaseId}: {useCase.title}
                                    </div>
                                    {useCase.description && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {useCase.description}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Progress indicator */}
                                  {progress > 0 && (
                                    <div>
                                      <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="font-medium">Progress</span>
                                        <span>{progress.toFixed(0)}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                          className="bg-green-500 h-2 rounded-full transition-all"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="text-xs space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium w-24">Start:</span>
                                      <span>{timeline.startDate.toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium w-24">End:</span>
                                      <span>{timeline.endDate.toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium w-24">Duration:</span>
                                      <span>{workingDays} working days ({calendarDays} calendar days)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium w-24">Status:</span>
                                      <Badge variant="outline" className="text-xs">
                                        {useCase.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium w-24">Priority:</span>
                                      <Badge variant={useCase.priority === "high" ? "destructive" : useCase.priority === "medium" ? "default" : "secondary"} className="text-xs">
                                        {useCase.priority}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium w-24">Risk:</span>
                                      <Badge variant={riskLevel === "high" ? "destructive" : riskLevel === "medium" ? "default" : "secondary"} className="text-xs">
                                        {riskLevel}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium w-24">Work Type:</span>
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {workType}
                                      </Badge>
                                    </div>
                                    {assignedDevelopers.length > 0 && (
                                      <div>
                                        <span className="font-medium">Developers:</span>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {assignedDevelopers.map((d) => {
                                            if (!d) return null
                                            return (
                                              <Badge key={d.id} variant="secondary" className="text-xs">
                                                {d.name}
                                              </Badge>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium w-24">Initial Mandays:</span>
                                      <span>{useCase.manDays}</span>
                                    </div>
                                    {nonDynamicDuration !== useCase.manDays && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium w-24">Non-Dynamic:</span>
                                        <span>{nonDynamicDuration.toFixed(1)} working days</span>
                                      </div>
                                    )}
                                    {hasCapacityConflict && (
                                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                                        <div className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                                          ⚠️ Capacity Conflict Detected
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
  )
}
