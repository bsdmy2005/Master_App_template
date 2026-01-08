"use client"

import { useMemo } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import type { PlanningData, TimeScale } from "@/types/planning-types"
import { calculateTimelines, type UseCaseTimeline } from "@/lib/timeline-calculator"
import { getWorkingDaysBetween } from "@/lib/working-days"
import { generateDateLabels, calculateDatePosition } from "@/lib/timeline-scale"

interface TimelineChartProps {
  data: PlanningData
  timeScale?: TimeScale
}

const statusColors: Record<string, string> = {
  "high-level definition": "bg-gray-500",
  groomed: "bg-blue-500",
  defined: "bg-yellow-500",
  "in development": "bg-orange-500",
  completed: "bg-green-500"
}

export function TimelineChart({ data, timeScale = "week" }: TimelineChartProps) {
  const timelineResult = useMemo(() => {
    return calculateTimelines(data)
  }, [data])

  const timelines = timelineResult.timelines

  if (timelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>No use cases with start dates and assigned developers</p>
        <p className="text-sm mt-2">
          Add start dates and assign developers to use cases to see them on the timeline
        </p>
      </div>
    )
  }

  // Calculate timeline range
  const timelineStart = useMemo(() => {
    if (timelines.length === 0) return new Date()
    return new Date(
      Math.min(...timelines.map((t) => t.startDate.getTime()))
    )
  }, [timelines])

  const timelineEnd = useMemo(() => {
    if (timelines.length === 0) return new Date()
    return new Date(
      Math.max(...timelines.map((t) => t.endDate.getTime()))
    )
  }, [timelines])

  const totalDays = useMemo(() => {
    return Math.ceil(
      (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
    )
  }, [timelineStart, timelineEnd])

  // Group timelines by client
  const timelinesByClient = useMemo(() => {
    const grouped: Record<string, Array<{ timeline: UseCaseTimeline; useCase: PlanningData["useCases"][0] }>> = {}
    
    for (const timeline of timelines) {
      const useCase = data.useCases.find((uc) => uc.id === timeline.useCaseId)
      if (!useCase) continue
      
      const client = data.clients.find((c) => c.id === useCase.clientId)
      if (!client) continue
      
      if (!grouped[client.id]) {
        grouped[client.id] = []
      }
      
      grouped[client.id].push({ timeline, useCase })
    }
    
    return grouped
  }, [timelines, data])

  // Calculate bar position using timeline scale utilities
  const getBarPosition = (timeline: UseCaseTimeline) => {
    const left = calculateDatePosition(
      timeline.startDate,
      timelineStart,
      timelineEnd,
      timeScale,
      100
    )
    const right = calculateDatePosition(
      timeline.endDate,
      timelineStart,
      timelineEnd,
      timeScale,
      100
    )

    return {
      left: Math.max(0, left),
      width: Math.max(1, right - left)
    }
  }

  // Generate date labels based on time scale
  const dateLabels = useMemo(() => {
    return generateDateLabels(timelineStart, timelineEnd, timeScale, 100)
  }, [timelineStart, timelineEnd, timeScale])

  return (
    <div className="space-y-6">
      {/* Timeline header with date axis */}
      <div className="relative border-b pb-8 pl-16">
        <div className="relative h-8">
          {dateLabels.map((label, index) => (
            <div
              key={index}
              className={`absolute top-0 h-full border-l ${
                label.isWeekend ? "border-gray-300 dark:border-gray-700 opacity-50" : "border-gray-400 dark:border-gray-600"
              }`}
              style={{ left: `${label.position}%` }}
            >
              {!label.isWeekend && (
                <div className="absolute -bottom-7 left-0 transform -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap font-medium">
                  {label.label}
              </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline bars grouped by client */}
      <div className="space-y-4 pl-16">
        {data.clients.map((client) => {
          const clientTimelines = timelinesByClient[client.id]
          if (!clientTimelines || clientTimelines.length === 0) return null

          return (
            <div key={client.id} className="space-y-2">
              <h3 className="font-semibold text-base">{client.name}</h3>
              <div className="space-y-1">
                {clientTimelines.map(({ timeline, useCase }) => {
                  const { left, width } = getBarPosition(timeline)
                  const statusColor = statusColors[useCase.status] || "bg-gray-500"
                  
                  // Get assigned developers
                  const assignedDevelopers = useCase.assignedDeveloperIds
                    ?.map((devId) => data.developers.find((d) => d.id === devId))
                    .filter(Boolean) || []

                  return (
                    <TooltipProvider key={useCase.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative h-8 cursor-pointer">
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 h-5 rounded ${statusColor} flex items-center px-1.5 text-xs text-white shadow-sm hover:shadow-md transition-shadow`}
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                minWidth: "60px"
                              }}
                            >
                              <div className="flex items-center gap-2 truncate w-full">
                                <Badge variant="outline" className="text-xs shrink-0 bg-white/20 text-white border-white/30">
                                  {useCase.useCaseId}
                                </Badge>
                                <span className="truncate font-medium">
                                  {useCase.title}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm">
                          <div className="space-y-2">
                            <div>
                              <div className="font-semibold">{useCase.useCaseId}: {useCase.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {useCase.description}
                              </div>
                            </div>
                            <div className="text-xs space-y-1">
                              <div>
                                <span className="font-medium">Start:</span>{" "}
                                {timeline.startDate.toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">End:</span>{" "}
                                {timeline.endDate.toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span>{" "}
                                {timeline.duration} working days
                              </div>
                              <div>
                                <span className="font-medium">Initial:</span>{" "}
                                {useCase.manDays.toFixed(1)} man-days
                              </div>
                              {assignedDevelopers.length > 0 && (
                                <div>
                                  <span className="font-medium">Developers:</span>{" "}
                                  {assignedDevelopers.map((d) => d?.name).filter(Boolean).join(", ")}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Status:</span>{" "}
                                <span className="capitalize">{useCase.status}</span>
                              </div>
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

      {/* Conflicts warning */}
      {timelineResult.conflicts.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Capacity Conflicts Detected
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            {timelineResult.conflicts.map((conflict, index) => (
              <div key={index}>
                Developers {conflict.developers.map((d) => {
                  const dev = data.developers.find((dev) => dev.id === d)
                  return dev?.name || d
                }).join(", ")} are assigned to multiple concurrent use cases:{" "}
                {conflict.useCaseIds.map((id) => {
                  const uc = data.useCases.find((uc) => uc.id === id)
                  return uc?.useCaseId || id
                }).join(", ")}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

