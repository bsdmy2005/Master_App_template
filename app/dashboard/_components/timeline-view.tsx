"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import type { PlanningData, TimeScale } from "@/types/planning-types"
import { writePlanningDataWithFallback } from "@/lib/storage-db"
import { toast } from "sonner"
import { TimelineChart } from "./timeline-chart"
import { getOptimalTimeScale } from "@/lib/timeline-scale"
import { calculateTimelines } from "@/lib/timeline-calculator"

interface TimelineViewProps {
  data: PlanningData
}

export function TimelineView({ data }: TimelineViewProps) {
  const [projectStartDate, setProjectStartDate] = useState(
    data.projectStartDate || new Date().toISOString().split("T")[0]
  )

  // Calculate optimal time scale based on timeline data
  const timelineResult = calculateTimelines(data)
  const timelines = timelineResult.timelines
  const defaultTimeScale: TimeScale = timelines.length > 0
    ? (() => {
        const timelineStart = new Date(Math.min(...timelines.map((t) => t.startDate.getTime())))
        const timelineEnd = new Date(Math.max(...timelines.map((t) => t.endDate.getTime())))
        return getOptimalTimeScale(timelineStart, timelineEnd)
      })()
    : "week"

  const [timeScale, setTimeScale] = useState<TimeScale>(defaultTimeScale)

  const handleProjectStartDateChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newDate = e.target.value
    setProjectStartDate(newDate)

    const updatedData: PlanningData = {
      ...data,
      projectStartDate: newDate
    }

    const result = await writePlanningDataWithFallback(updatedData)
    if (result.success) {
      toast.success("Project start date updated")
    } else {
      toast.error("Failed to update project start date")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Timeline View</h2>
        <p className="text-muted-foreground">
          Visualize use cases over time with calculated timelines based on developer assignments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="project-start-date">Project Start Date</Label>
            <Input
              id="project-start-date"
              type="date"
              value={projectStartDate}
              onChange={handleProjectStartDateChange}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <CardTitle>Timeline Chart</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="timeline-scale" className="text-sm whitespace-nowrap">
                Time Scale:
              </Label>
              <Select value={timeScale} onValueChange={(value) => setTimeScale(value as TimeScale)}>
                <SelectTrigger id="timeline-scale" className="w-[140px]">
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
          </div>
        </CardHeader>
        <CardContent>
          <TimelineChart data={data} timeScale={timeScale} />
        </CardContent>
      </Card>
    </div>
  )
}

