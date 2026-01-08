"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Users, AlertTriangle } from "lucide-react"
import type { PlanningData } from "@/types/planning-types"
import { writePlanningDataWithFallback } from "@/lib/storage-db"
import { calculateTimelines } from "@/lib/timeline-calculator"
import { toast } from "sonner"

interface DeveloperPlanningProps {
  data: PlanningData
  setData: (data: PlanningData) => void
}

export function DeveloperPlanning({
  data,
  setData
}: DeveloperPlanningProps) {
  const [selectedDeveloperIds, setSelectedDeveloperIds] = useState<Set<string>>(
    new Set(data.developers.map((d) => d.id))
  )

  const selectedDevelopers = useMemo(() => {
    return data.developers.filter((d) => selectedDeveloperIds.has(d.id))
  }, [data.developers, selectedDeveloperIds])

  const totalCapacity = useMemo(() => {
    return selectedDevelopers.reduce((sum, dev) => sum + dev.capacity, 0)
  }, [selectedDevelopers])

  // Calculate timelines for dynamic mandaya
  const timelineResult = useMemo(() => calculateTimelines(data), [data])
  const timelinesByUseCaseId = useMemo(() => {
    const map = new Map<string, typeof timelineResult.timelines[0]>()
    for (const timeline of timelineResult.timelines) {
      map.set(timeline.useCaseId, timeline)
    }
    return map
  }, [timelineResult.timelines])

  // Calculate total duration (working days) for use cases with timelines
  // For use cases without timelines, use initial mandays as fallback
  const totalDuration = useMemo(() => {
    return data.useCases.reduce((sum, uc) => {
      const timeline = timelinesByUseCaseId.get(uc.id)
      // Use duration (working days) if timeline exists, otherwise use initial mandays
      return sum + (timeline?.duration ?? uc.manDays)
    }, 0)
  }, [data.useCases, timelinesByUseCaseId])
  
  // Also calculate total initial mandays for reference
  const totalInitialManDays = useMemo(() => {
    return data.useCases.reduce((sum, uc) => sum + uc.manDays, 0)
  }, [data.useCases])

  const estimatedWeeks = useMemo(() => {
    if (totalCapacity === 0) return 0
    // Calculate based on total duration (working days)
    // Convert working days to weeks (5 working days per week)
    return Math.ceil(totalDuration / 5)
  }, [totalDuration, totalCapacity])

  // Check for capacity conflicts based on tasks
  const capacityConflicts = useMemo(() => {
    const conflicts: Array<{
      developerId: string
      useCaseIds: string[]
      message: string
    }> = []

    selectedDevelopers.forEach((developer) => {
      // Find all tasks assigned to this developer
      const assignedTasks = data.tasks.filter((task) =>
        task.assignedDeveloperIds.includes(developer.id)
      )

      if (assignedTasks.length > 1) {
        // Group tasks by use case
        const tasksByUseCase = new Map<string, typeof assignedTasks>()
        assignedTasks.forEach((task) => {
          const useCaseTasks = tasksByUseCase.get(task.useCaseId) || []
          useCaseTasks.push(task)
          tasksByUseCase.set(task.useCaseId, useCaseTasks)
        })

        // Check for overlapping time periods across use cases
        const overlapping: string[] = []
        const useCaseIds = Array.from(tasksByUseCase.keys())

        for (let i = 0; i < useCaseIds.length; i++) {
          for (let j = i + 1; j < useCaseIds.length; j++) {
            const uc1 = data.useCases.find((uc) => uc.id === useCaseIds[i])
            const uc2 = data.useCases.find((uc) => uc.id === useCaseIds[j])

            if (uc1 && uc2 && uc1.startDate && uc2.startDate) {
              // Calculate end dates based on tasks
              const tasks1 = tasksByUseCase.get(uc1.id) || []
              const tasks2 = tasksByUseCase.get(uc2.id) || []

              const totalHours1 = tasks1.reduce(
                (sum, t) => sum + t.estimatedHours,
                0
              )
              const totalHours2 = tasks2.reduce(
                (sum, t) => sum + t.estimatedHours,
                0
              )

              // Estimate duration: hours / (developer capacity per week / 5 days)
              const days1 = totalHours1 / (developer.capacity / 5)
              const days2 = totalHours2 / (developer.capacity / 5)

              const start1 = new Date(uc1.startDate)
              const end1 = new Date(start1)
              end1.setDate(end1.getDate() + days1)

              const start2 = new Date(uc2.startDate)
              const end2 = new Date(start2)
              end2.setDate(end2.getDate() + days2)

              if (
                (start1 <= end2 && start2 <= end1) ||
                (start2 <= end1 && start1 <= end2)
              ) {
                if (!overlapping.includes(uc1.id)) overlapping.push(uc1.id)
                if (!overlapping.includes(uc2.id)) overlapping.push(uc2.id)
              }
            }
          }
        }

        if (overlapping.length > 0) {
          conflicts.push({
            developerId: developer.id,
            useCaseIds: overlapping,
            message: `Developer has overlapping task assignments across use cases`
          })
        }
      }
    })

    return conflicts
  }, [selectedDevelopers, data.tasks, data.useCases])

  const toggleDeveloper = (developerId: string) => {
    const newSet = new Set(selectedDeveloperIds)
    if (newSet.has(developerId)) {
      newSet.delete(developerId)
    } else {
      newSet.add(developerId)
    }
    setSelectedDeveloperIds(newSet)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Developer Planning</h2>
        <p className="text-muted-foreground">
          Plan project timeline based on developer capacity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Developers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.developers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No developers in repository. Add developers first.
              </p>
            ) : (
              data.developers.map((developer) => (
                <div
                  key={developer.id}
                  className="flex items-center space-x-3 rounded-lg border p-3"
                >
                  <Checkbox
                    id={developer.id}
                    checked={selectedDeveloperIds.has(developer.id)}
                    onCheckedChange={() => toggleDeveloper(developer.id)}
                  />
                  <Label
                    htmlFor={developer.id}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{developer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {developer.capacity} hrs/week
                    </div>
                  </Label>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planning Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Duration
                </span>
                <div className="space-y-1">
                  <div>
                    <Badge variant="outline">{totalDuration.toFixed(1)} working days</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Initial: {totalInitialManDays.toFixed(1)} man-days
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Selected Developers
                </span>
                <Badge variant="outline">{selectedDevelopers.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Capacity
                </span>
                <Badge variant="outline">
                  {totalCapacity} hrs/week
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Estimated Duration
                </span>
                <Badge variant="secondary">
                  ~{estimatedWeeks} weeks
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {capacityConflicts.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              Capacity Conflicts Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {capacityConflicts.map((conflict, index) => {
                const developer = data.developers.find(
                  (d) => d.id === conflict.developerId
                )
                return (
                  <div key={index} className="rounded-lg border border-yellow-300 bg-white p-3 dark:bg-yellow-900">
                    <div className="font-medium">{developer?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {conflict.message}
                    </div>
                    <div className="mt-2 text-xs">
                      Affected use cases:{" "}
                      {conflict.useCaseIds
                        .map(
                          (id) =>
                            data.useCases.find((uc) => uc.id === id)?.useCaseId
                        )
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

