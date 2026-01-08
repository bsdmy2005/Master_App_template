"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Calculator,
  Users,
  Calendar,
  Clock,
  ArrowRight,
  Play,
  RotateCcw,
  Github,
  Linkedin,
  Info,
  Zap,
  ChevronRight,
  Layers
} from "lucide-react"

// Types for demo
interface DemoTask {
  id: string
  name: string
  manDays: number
  startDay: number // Day offset from project start
  developerId: string
  color: string
}

interface DemoDeveloper {
  id: string
  name: string
  weeklyHours: number
}

interface Segment {
  startDay: number
  endDay: number
  activeTasks: string[]
  velocityPerTask: Record<string, number>
}

interface TaskTimeline {
  taskId: string
  startDay: number
  endDay: number
  segments: Array<{
    startDay: number
    endDay: number
    velocity: number
    workDone: number
  }>
}

// Demo data
const initialDevelopers: DemoDeveloper[] = [
  { id: "dev1", name: "Alice", weeklyHours: 40 },
  { id: "dev2", name: "Bob", weeklyHours: 40 }
]

const initialTasks: DemoTask[] = [
  { id: "task1", name: "Authentication System", manDays: 30, startDay: 0, developerId: "dev1", color: "bg-blue-500" },
  { id: "task2", name: "Dashboard UI", manDays: 20, startDay: 5, developerId: "dev1", color: "bg-green-500" },
  { id: "task3", name: "API Integration", manDays: 25, startDay: 0, developerId: "dev2", color: "bg-purple-500" }
]

// Calculate timelines using segment-based approach
function calculateTimelines(tasks: DemoTask[], developers: DemoDeveloper[]): TaskTimeline[] {
  // Get all change points (start days of all tasks)
  const changePoints = new Set<number>()
  tasks.forEach(t => changePoints.add(t.startDay))

  // Initial estimate: assume no concurrency
  const taskEndDays: Record<string, number> = {}
  tasks.forEach(task => {
    const dev = developers.find(d => d.id === task.developerId)
    const dailyCapacity = dev ? dev.weeklyHours / 5 / 8 : 1 // man-days per day
    const duration = Math.ceil(task.manDays / dailyCapacity)
    taskEndDays[task.id] = task.startDay + duration
    changePoints.add(taskEndDays[task.id])
  })

  // Sort change points
  const sortedPoints = Array.from(changePoints).sort((a, b) => a - b)

  // Iterate to convergence
  for (let iteration = 0; iteration < 10; iteration++) {
    let changed = false

    for (const task of tasks) {
      const dev = developers.find(d => d.id === task.developerId)
      if (!dev) continue

      const baseVelocity = dev.weeklyHours / 5 / 8 // man-days per working day
      let totalWorkDone = 0
      let currentDay = task.startDay
      const segments: TaskTimeline["segments"] = []

      // Process each segment
      for (let i = 0; i < sortedPoints.length - 1; i++) {
        const segStart = sortedPoints[i]
        const segEnd = sortedPoints[i + 1]

        if (segStart < task.startDay) continue
        if (totalWorkDone >= task.manDays) break

        // Count concurrent tasks for this developer in this segment
        const concurrentTasks = tasks.filter(t => {
          if (t.developerId !== task.developerId) return false
          const tEnd = taskEndDays[t.id]
          return t.startDay < segEnd && tEnd > segStart
        })

        const concurrentCount = concurrentTasks.length
        const effectiveVelocity = baseVelocity / concurrentCount

        // Calculate work done in this segment
        const segmentDays = segEnd - segStart
        const workCapacity = segmentDays * effectiveVelocity
        const workRemaining = task.manDays - totalWorkDone

        if (workCapacity >= workRemaining) {
          // Task completes in this segment
          const daysNeeded = Math.ceil(workRemaining / effectiveVelocity)
          segments.push({
            startDay: segStart,
            endDay: segStart + daysNeeded,
            velocity: effectiveVelocity,
            workDone: workRemaining
          })
          totalWorkDone = task.manDays
          currentDay = segStart + daysNeeded
          break
        } else {
          // Use full segment
          segments.push({
            startDay: segStart,
            endDay: segEnd,
            velocity: effectiveVelocity,
            workDone: workCapacity
          })
          totalWorkDone += workCapacity
          currentDay = segEnd
        }
      }

      // If work remains, extend beyond last change point
      if (totalWorkDone < task.manDays) {
        const remaining = task.manDays - totalWorkDone
        // Recalculate concurrency for extension period
        const stillActive = tasks.filter(t => {
          if (t.developerId !== task.developerId) return false
          if (t.id === task.id) return true
          return taskEndDays[t.id] > currentDay
        })
        const velocity = baseVelocity / stillActive.length
        const daysNeeded = Math.ceil(remaining / velocity)
        segments.push({
          startDay: currentDay,
          endDay: currentDay + daysNeeded,
          velocity,
          workDone: remaining
        })
        currentDay += daysNeeded
      }

      // Check if end day changed
      if (taskEndDays[task.id] !== currentDay) {
        changed = true
        taskEndDays[task.id] = currentDay
        // Update change points
        changePoints.add(currentDay)
      }
    }

    if (!changed) break
  }

  // Build final timelines
  return tasks.map(task => {
    const dev = developers.find(d => d.id === task.developerId)
    const baseVelocity = dev ? dev.weeklyHours / 5 / 8 : 1

    // Recalculate segments for final result
    let totalWorkDone = 0
    let currentDay = task.startDay
    const segments: TaskTimeline["segments"] = []
    const sortedPointsFinal = Array.from(changePoints).sort((a, b) => a - b)

    for (let i = 0; i < sortedPointsFinal.length - 1 && totalWorkDone < task.manDays; i++) {
      const segStart = sortedPointsFinal[i]
      const segEnd = sortedPointsFinal[i + 1]

      if (segStart < task.startDay) continue

      const concurrentTasks = tasks.filter(t => {
        if (t.developerId !== task.developerId) return false
        const tEnd = taskEndDays[t.id]
        return t.startDay < segEnd && tEnd > segStart
      })

      const velocity = baseVelocity / concurrentTasks.length
      const segmentDays = segEnd - segStart
      const workCapacity = segmentDays * velocity
      const workRemaining = task.manDays - totalWorkDone

      if (workCapacity >= workRemaining) {
        const daysNeeded = Math.ceil(workRemaining / velocity)
        segments.push({ startDay: segStart, endDay: segStart + daysNeeded, velocity, workDone: workRemaining })
        totalWorkDone = task.manDays
        currentDay = segStart + daysNeeded
      } else {
        segments.push({ startDay: segStart, endDay: segEnd, velocity, workDone: workCapacity })
        totalWorkDone += workCapacity
        currentDay = segEnd
      }
    }

    if (totalWorkDone < task.manDays) {
      const remaining = task.manDays - totalWorkDone
      const stillActive = tasks.filter(t => t.developerId === task.developerId && (t.id === task.id || taskEndDays[t.id] > currentDay))
      const velocity = baseVelocity / stillActive.length
      const daysNeeded = Math.ceil(remaining / velocity)
      segments.push({ startDay: currentDay, endDay: currentDay + daysNeeded, velocity, workDone: remaining })
      currentDay += daysNeeded
    }

    return {
      taskId: task.id,
      startDay: task.startDay,
      endDay: currentDay,
      segments
    }
  })
}

export default function DemoPage() {
  const [tasks, setTasks] = useState<DemoTask[]>(initialTasks)
  const [developers] = useState<DemoDeveloper[]>(initialDevelopers)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  // Calculate timelines
  const timelines = useMemo(() => calculateTimelines(tasks, developers), [tasks, developers])

  // Find max end day for chart scaling
  const maxEndDay = Math.max(...timelines.map(t => t.endDay), 60)
  const chartWidth = maxEndDay + 10

  // Update task
  const updateTask = (taskId: string, updates: Partial<DemoTask>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
  }

  // Reset to initial state
  const reset = () => {
    setTasks(initialTasks)
    setSelectedTask(null)
  }

  // Get timeline for a task
  const getTimeline = (taskId: string) => timelines.find(t => t.taskId === taskId)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Resource-Constrained Scheduling Demo</h1>
            <p className="text-sm text-muted-foreground">Interactive visualization of the RCPSP algorithm</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Introduction */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <Badge variant="secondary" className="text-sm">Operations Research + Computer Science</Badge>
          <h2 className="text-3xl font-bold">What happens when developers share tasks?</h2>
          <p className="text-muted-foreground">
            When multiple tasks compete for the same resource, velocity isn't constant—it changes
            based on what's active at any given moment. This demo shows how <strong>segment-based scheduling</strong> solves this.
          </p>
        </div>

        {/* Main Demo Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>Adjust tasks and see timelines update</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Developers */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Developers</h4>
                {developers.map(dev => (
                  <div key={dev.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="font-medium">{dev.name}</span>
                    <Badge variant="outline">{dev.weeklyHours} hrs/week</Badge>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Tasks */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Tasks</h4>
                {tasks.map(task => {
                  const timeline = getTimeline(task.id)
                  const isSelected = selectedTask === task.id

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedTask(isSelected ? null : task.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${task.color}`} />
                        <span className="font-medium text-sm">{task.name}</span>
                      </div>

                      {isSelected ? (
                        <div className="space-y-3 mt-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Effort (man-days)</Label>
                            <Input
                              type="number"
                              min={5}
                              max={100}
                              value={task.manDays}
                              onChange={e => updateTask(task.id, { manDays: parseInt(e.target.value) || 10 })}
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Start Day</Label>
                            <Input
                              type="number"
                              min={0}
                              max={30}
                              value={task.startDay}
                              onChange={e => updateTask(task.id, { startDay: parseInt(e.target.value) || 0 })}
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Assigned To</Label>
                            <Select
                              value={task.developerId}
                              onValueChange={v => updateTask(task.id, { developerId: v })}
                            >
                              <SelectTrigger onClick={e => e.stopPropagation()}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {developers.map(dev => (
                                  <SelectItem key={dev.id} value={dev.id}>{dev.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>{task.manDays} man-days</div>
                          <div>Day {task.startDay}</div>
                          <div>{developers.find(d => d.id === task.developerId)?.name}</div>
                        </div>
                      )}

                      {timeline && (
                        <div className="mt-2 pt-2 border-t text-xs">
                          <span className="text-muted-foreground">Duration: </span>
                          <span className="font-medium">{timeline.endDay - timeline.startDay} days</span>
                          <span className="text-muted-foreground"> (ends day {timeline.endDay})</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Visualization */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline Visualization
              </CardTitle>
              <CardDescription>Tasks are colored by segment velocity</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Gantt Chart */}
              <div className="space-y-4">
                {/* Day scale */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground pl-32">
                  {Array.from({ length: Math.ceil(chartWidth / 10) }, (_, i) => (
                    <div key={i} className="w-20 text-center">{i * 10}</div>
                  ))}
                </div>

                {/* Task bars */}
                <div className="space-y-3">
                  {tasks.map(task => {
                    const timeline = getTimeline(task.id)
                    if (!timeline) return null

                    return (
                      <div key={task.id} className="flex items-center gap-3">
                        <div className="w-28 text-sm truncate font-medium">{task.name}</div>
                        <div className="flex-1 relative h-10 bg-muted/30 rounded">
                          {/* Segments */}
                          {timeline.segments.map((seg, idx) => {
                            const left = (seg.startDay / chartWidth) * 100
                            const width = ((seg.endDay - seg.startDay) / chartWidth) * 100
                            // Color intensity based on velocity (higher = darker)
                            const opacity = 0.4 + (seg.velocity * 0.6)

                            return (
                              <div
                                key={idx}
                                className={`absolute top-1 bottom-1 ${task.color} rounded flex items-center justify-center text-white text-xs font-medium transition-all`}
                                style={{
                                  left: `${left}%`,
                                  width: `${Math.max(width, 2)}%`,
                                  opacity
                                }}
                                title={`Velocity: ${seg.velocity.toFixed(2)} | Work: ${seg.workDone.toFixed(1)} man-days`}
                              >
                                {width > 8 && seg.velocity.toFixed(1)}
                              </div>
                            )
                          })}

                          {/* Grid lines */}
                          {Array.from({ length: Math.ceil(chartWidth / 10) }, (_, i) => (
                            <div
                              key={i}
                              className="absolute top-0 bottom-0 border-l border-border/30"
                              style={{ left: `${(i * 10 / chartWidth) * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 text-xs text-muted-foreground pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded opacity-100" />
                    <span>Full velocity (1.0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded opacity-70" />
                    <span>Shared (0.5)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded opacity-50" />
                    <span>Lower velocity</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Algorithm Explanation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              How the Algorithm Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { step: 1, title: "Change Points", desc: "Collect all task start/end dates" },
                { step: 2, title: "Create Segments", desc: "Divide timeline where concurrency is constant" },
                { step: 3, title: "Calculate Velocity", desc: "Capacity / concurrent tasks per segment" },
                { step: 4, title: "Accumulate Work", desc: "Sum work until man-days requirement met" },
                { step: 5, title: "Iterate", desc: "Repeat until timelines stabilize" }
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
                    {step}
                  </div>
                  <h4 className="font-medium text-sm">{title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Formulas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Calculator className="h-8 w-8 mx-auto text-blue-600" />
                <h3 className="font-semibold">Effective Velocity</h3>
                <code className="text-sm bg-white dark:bg-slate-800 px-3 py-1 rounded block">
                  velocity = capacity / concurrent_tasks
                </code>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Zap className="h-8 w-8 mx-auto text-green-600" />
                <h3 className="font-semibold">Segment Work</h3>
                <code className="text-sm bg-white dark:bg-slate-800 px-3 py-1 rounded block">
                  work = segment_days × velocity
                </code>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Calendar className="h-8 w-8 mx-auto text-purple-600" />
                <h3 className="font-semibold">End Condition</h3>
                <code className="text-sm bg-white dark:bg-slate-800 px-3 py-1 rounded block">
                  end when: Σ(work) ≥ man_days
                </code>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-muted-foreground">
          <p>Built to demonstrate the Resource-Constrained Project Scheduling Problem (RCPSP)</p>
          <p className="mt-1">Using Segment-Based Scheduling with Fixed-Point Iteration</p>
        </div>
      </main>
    </div>
  )
}
