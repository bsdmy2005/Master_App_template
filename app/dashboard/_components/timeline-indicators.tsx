"use client"

import { useMemo } from "react"
import type { PlanningData, UseCaseTimeline } from "@/types/planning-types"
import { calculateDatePosition } from "@/lib/timeline-scale"
import { isWeekend } from "@/lib/working-days"
import type { TimeScale } from "@/types/planning-types"

interface TimelineIndicatorsProps {
  timelines: UseCaseTimeline[]
  data: PlanningData
  timelineStart: Date
  timelineEnd: Date
  timeScale: TimeScale
  width: number
  hideWeekendMarkers?: boolean
}

export function TimelineIndicators({
  timelines,
  data,
  timelineStart,
  timelineEnd,
  timeScale,
  width,
  hideWeekendMarkers = false
}: TimelineIndicatorsProps) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // Today indicator position
  const todayPosition = useMemo(() => {
    if (today < timelineStart || today > timelineEnd) return null
    return calculateDatePosition(today, timelineStart, timelineEnd, timeScale, width)
  }, [today, timelineStart, timelineEnd, timeScale, width])

  // Dependency arrows
  const dependencyArrows = useMemo(() => {
    const arrows: Array<{
      from: { useCaseId: string; position: number }
      to: { useCaseId: string; position: number }
      type: string
    }> = []

    for (const dependency of data.dependencies) {
      // Find use cases by useCaseId (the dependency uses useCaseId like "US-1")
      const fromUseCase = data.useCases.find(
        (uc) => uc.useCaseId === dependency.fromUseCaseId
      )
      const toUseCase = data.useCases.find(
        (uc) => uc.useCaseId === dependency.toUseCaseId
      )

      if (!fromUseCase || !toUseCase) continue

      // Timeline uses internal id, not useCaseId
      const fromTimeline = timelines.find((t) => t.useCaseId === fromUseCase.id)
      const toTimeline = timelines.find((t) => t.useCaseId === toUseCase.id)

      if (fromTimeline && toTimeline) {
        const fromPosition = calculateDatePosition(
          fromTimeline.endDate,
          timelineStart,
          timelineEnd,
          timeScale,
          width
        )
        const toPosition = calculateDatePosition(
          toTimeline.startDate,
          timelineStart,
          timelineEnd,
          timeScale,
          width
        )

        // Only show arrow if positions are valid and different
        if (fromPosition >= 0 && toPosition >= 0 && fromPosition !== toPosition) {
          arrows.push({
            from: { useCaseId: dependency.fromUseCaseId, position: fromPosition },
            to: { useCaseId: dependency.toUseCaseId, position: toPosition },
            type: dependency.type
          })
        }
      }
    }

    return arrows
  }, [timelines, data.dependencies, data.useCases, timelineStart, timelineEnd, timeScale, width])

  // Weekend markers (for day/week scale)
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
          width
        )
        markers.push({ date: new Date(current), position })
      }
      current.setDate(current.getDate() + 1)
    }

    return markers
  }, [timelineStart, timelineEnd, timeScale, width])

  return (
    <>
      {/* Today indicator */}
      {todayPosition !== null && (
        <div
          className="absolute top-0 bottom-0 w-1 bg-red-600 dark:bg-red-500 z-5 pointer-events-none shadow-lg"
          style={{ 
            left: `${todayPosition}%`,
            boxShadow: "0 0 8px rgba(239, 68, 68, 0.5)"
          }}
        >
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-red-600 dark:bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-md whitespace-nowrap z-30 shadow-md border-2 border-white dark:border-gray-900">
            Today
          </div>
        </div>
      )}

      {/* Weekend markers */}
      {!hideWeekendMarkers && weekendMarkers.map((marker, index) => (
        <div
          key={`weekend-${index}`}
          className="absolute top-0 bottom-0 w-full bg-gray-100 dark:bg-gray-800 opacity-30 z-0 pointer-events-none"
          style={{
            left: `${marker.position}%`,
            width: "2%"
          }}
        />
      ))}

      {/* Dependency arrows - simplified for now, can be enhanced with actual bar positions */}
      {dependencyArrows.length > 0 && (
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-5"
          style={{ height: "100%" }}
        >
          <defs>
            {dependencyArrows.map((_, index) => {
              const arrowColorHex =
                dependencyArrows[index].type === "blocks"
                  ? "#ef4444"
                  : dependencyArrows[index].type === "depends-on"
                  ? "#3b82f6"
                  : dependencyArrows[index].type === "covered-by"
                  ? "#10b981"
                  : "#6b7280"
              
              return (
                <marker
                  key={`arrowhead-${index}`}
                  id={`arrowhead-${index}`}
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 12 3, 0 6"
                    fill={arrowColorHex}
                    stroke={arrowColorHex}
                    strokeWidth="1"
                  />
                </marker>
              )
            })}
          </defs>
          {dependencyArrows.map((arrow, index) => {
            const fromY = 100
            const toY = 100
            const midX = (arrow.from.position + arrow.to.position) / 2
            const arrowColorHex =
              arrow.type === "blocks"
                ? "#ef4444"
                : arrow.type === "depends-on"
                ? "#3b82f6"
                : arrow.type === "covered-by"
                ? "#10b981"
                : "#6b7280"
            
            const typeLabel = arrow.type === "blocks" ? "blocks" 
              : arrow.type === "depends-on" ? "depends on"
              : arrow.type === "covered-by" ? "covered by"
              : "related to"

            return (
              <g key={`arrow-${index}`}>
                <path
                  d={`M ${arrow.from.position}% ${fromY} Q ${midX}% ${fromY - 30} ${arrow.to.position}% ${toY}`}
                  fill="none"
                  strokeWidth="2.5"
                  stroke={arrowColorHex}
                  strokeDasharray={arrow.type === "related-to" ? "6,4" : "0"}
                  markerEnd={`url(#arrowhead-${index})`}
                  opacity="0.8"
                />
                {/* Dependency type label */}
                <g transform={`translate(${midX}%, ${fromY - 35})`}>
                  <rect
                    x="-25"
                    y="-8"
                    width="50"
                    height="16"
                    fill="white"
                    fillOpacity="0.95"
                    stroke={arrowColorHex}
                    strokeWidth="1.5"
                    rx="4"
                  />
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fontSize="9"
                    fill={arrowColorHex}
                    fontWeight="600"
                  >
                    {typeLabel}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>
      )}
      
      {/* Milestone markers - show for completed use cases */}
      {timelines
        .filter((t) => {
          const useCase = data.useCases.find((uc) => uc.id === t.useCaseId)
          return useCase?.status === "completed"
        })
        .map((timeline) => {
          const milestonePosition = calculateDatePosition(
            timeline.endDate,
            timelineStart,
            timelineEnd,
            timeScale,
            width
          )
          
          if (milestonePosition < 0 || milestonePosition > width) return null
          
          return (
            <div
              key={`milestone-${timeline.useCaseId}`}
              className="absolute top-0 z-10 pointer-events-none"
              style={{ left: `${milestonePosition}%`, transform: "translateX(-50%)" }}
            >
              <div className="relative">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-green-600 dark:border-b-green-500" />
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-600 dark:bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-md">
                  ✓
                </div>
              </div>
            </div>
          )
        })}
    </>
  )
}

