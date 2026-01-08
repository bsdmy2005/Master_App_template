"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Calculator,
  Users,
  Calendar,
  Clock,
  ArrowRight,
  Info,
  Zap,
  Layers
} from "lucide-react"
import type { Complexity, GapLevel } from "@/types/planning-types"
import { useEffortConfig } from "@/lib/effort-config-context"
import { complexityLabels, gapLevelLabels } from "@/lib/effort-formula"

export function EstimationGuide() {
  const { config } = useEffortConfig()

  // Interactive calculator state
  const [demoComplexity, setDemoComplexity] = useState<Complexity>("medium")
  const [demoGap, setDemoGap] = useState<GapLevel>("moderate-extension")
  const [demoDevelopers, setDemoDevelopers] = useState(2)
  const [demoCapacity, setDemoCapacity] = useState(40) // hours per week
  const [demoConcurrentTasks, setDemoConcurrentTasks] = useState(1)

  // Calculate values for demo
  const formula = config.formulaParams[demoComplexity]
  const complexityWeight = config.complexityWeights[demoComplexity]
  const gapWeight = config.gapWeights[demoGap]
  const manDays = formula.base + (complexityWeight * gapWeight * formula.multiplier)

  // Velocity calculation
  const dailyHoursPerDev = demoCapacity / 5 // 5 working days
  const effectiveHoursPerDev = dailyHoursPerDev / demoConcurrentTasks
  const totalEffectiveHours = effectiveHoursPerDev * demoDevelopers
  const velocity = totalEffectiveHours / 8 // 8 hours = 1 man-day

  // Duration calculation
  const workingDays = Math.ceil(manDays / velocity)
  const calendarDays = Math.ceil(workingDays * 7 / 5) // Approximate with weekends

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Estimation & Timeline Guide</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Understand how effort estimates, velocity, and timelines are calculated in this project planning system.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              Effort
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Raw work required, measured in <strong>man-days</strong>. Based on complexity and SDK gap.
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Velocity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              How fast work progresses, measured in <strong>man-days per day</strong>. Based on team capacity.
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Calendar time needed. <strong>Working days</strong> (Mon-Fri) and <strong>calendar days</strong> (with weekends).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Step 1: Effort Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">1</span>
            Effort Calculation (Man-Days)
          </CardTitle>
          <CardDescription>
            Each use case has an effort estimate based on its complexity and how much SDK work is needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formula */}
          <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4">
            <div className="text-center font-mono text-lg">
              <span className="text-blue-600">Man-Days</span> = Base + (Complexity × Gap × Multiplier)
            </div>
          </div>

          {/* Complexity Scale */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" /> Complexity Levels
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {(["low", "medium", "high"] as Complexity[]).map((level) => (
                <div
                  key={level}
                  className={`rounded-lg border p-3 text-center ${
                    level === "low" ? "border-green-300 bg-green-50 dark:bg-green-950/30" :
                    level === "medium" ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30" :
                    "border-red-300 bg-red-50 dark:bg-red-950/30"
                  }`}
                >
                  <div className="font-medium capitalize">{level}</div>
                  <div className="text-2xl font-bold">{config.complexityWeights[level]}×</div>
                  <div className="text-xs text-muted-foreground">
                    Base: {config.formulaParams[level].base}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gap Scale */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Info className="h-4 w-4" /> SDK Gap Levels
            </h4>
            <div className="space-y-2">
              {(Object.keys(gapLevelLabels) as GapLevel[]).map((gap, idx) => (
                <div key={gap} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-red-500 flex items-center justify-center text-white text-xs font-bold"
                       style={{ backgroundPosition: `${idx * 25}% 0%` }}>
                    {config.gapWeights[gap]}×
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{gapLevelLabels[gap]}</div>
                    <div className="text-xs text-muted-foreground">
                      {gap === "sdk-native" && "Feature exists in SDK, minimal work needed"}
                      {gap === "minor-extension" && "Small SDK customization required"}
                      {gap === "moderate-extension" && "Moderate SDK extension work"}
                      {gap === "significant-extension" && "Major SDK modifications needed"}
                      {gap === "custom-implementation" && "Build from scratch, no SDK support"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Velocity Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 text-sm font-bold">2</span>
            Velocity Calculation (Man-Days per Day)
          </CardTitle>
          <CardDescription>
            Velocity determines how quickly a team can deliver work based on their capacity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formula */}
          <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4 space-y-2">
            <div className="text-center font-mono">
              <span className="text-green-600">Velocity</span> = (Developers × Daily Hours / Concurrent Tasks) / 8
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Where: Daily Hours = Weekly Capacity / 5 working days, and 8 hours = 1 man-day
            </div>
          </div>

          {/* Example */}
          <div className="rounded-lg border p-4 space-y-4">
            <h4 className="font-medium">Example Scenarios</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-3 rounded bg-muted/50">
                <div className="font-medium text-sm">Single Task Focus</div>
                <div className="text-xs space-y-1">
                  <div>3 developers × 40 hrs/week</div>
                  <div>Daily hours: 3 × 8 = 24 hrs/day</div>
                  <div className="font-bold text-green-600">Velocity: 24 / 8 = 3.0 man-days/day</div>
                </div>
              </div>
              <div className="space-y-2 p-3 rounded bg-muted/50">
                <div className="font-medium text-sm">Two Concurrent Tasks</div>
                <div className="text-xs space-y-1">
                  <div>3 developers × 40 hrs/week (split 50/50)</div>
                  <div>Effective: 3 × 4 = 12 hrs/day per task</div>
                  <div className="font-bold text-yellow-600">Velocity: 12 / 8 = 1.5 man-days/day</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key insight */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4">
            <Info className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <strong>Key Insight:</strong> When developers work on multiple concurrent use cases,
              their effective capacity per task decreases proportionally. This automatically extends
              the timeline for all affected tasks.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Duration Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-sm font-bold">3</span>
            Duration Calculation (Days)
          </CardTitle>
          <CardDescription>
            Convert effort to calendar time based on team velocity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formula */}
          <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4 space-y-2">
            <div className="text-center font-mono">
              <span className="text-purple-600">Working Days</span> = Man-Days / Velocity
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Calendar Days = Working Days + Weekends (approximately × 1.4)
            </div>
          </div>

          {/* Visual timeline */}
          <div className="space-y-3">
            <h4 className="font-medium">Working Days vs Calendar Days</h4>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex gap-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                  <div key={day} className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium">
                    {day}
                  </div>
                ))}
                {["Sat", "Sun"].map((day) => (
                  <div key={day} className="w-10 h-10 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="text-muted-foreground">
                5 working days = 7 calendar days
              </div>
            </div>
          </div>

          {/* Example calculation */}
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-3">Example: 40 Man-Days Task</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1 p-3 rounded bg-muted/50">
                <div className="text-muted-foreground">With velocity 3.0</div>
                <div className="font-bold">40 / 3.0 = 14 working days</div>
                <div className="text-xs text-muted-foreground">≈ 19 calendar days</div>
              </div>
              <div className="space-y-1 p-3 rounded bg-muted/50">
                <div className="text-muted-foreground">With velocity 1.5</div>
                <div className="font-bold">40 / 1.5 = 27 working days</div>
                <div className="text-xs text-muted-foreground">≈ 38 calendar days</div>
              </div>
              <div className="space-y-1 p-3 rounded bg-muted/50">
                <div className="text-muted-foreground">With velocity 1.0</div>
                <div className="font-bold">40 / 1.0 = 40 working days</div>
                <div className="text-xs text-muted-foreground">≈ 56 calendar days</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Calculator */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Interactive Calculator
          </CardTitle>
          <CardDescription>
            Adjust the values below to see how they affect the timeline calculation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Inputs</h4>

              <div className="space-y-2">
                <Label>Complexity</Label>
                <Select value={demoComplexity} onValueChange={(v) => setDemoComplexity(v as Complexity)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>SDK Gap</Label>
                <Select value={demoGap} onValueChange={(v) => setDemoGap(v as GapLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(gapLevelLabels) as GapLevel[]).map((gap) => (
                      <SelectItem key={gap} value={gap}>{gapLevelLabels[gap]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Number of Developers</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={demoDevelopers}
                  onChange={(e) => setDemoDevelopers(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div className="space-y-2">
                <Label>Developer Capacity (hrs/week)</Label>
                <Input
                  type="number"
                  min={8}
                  max={60}
                  value={demoCapacity}
                  onChange={(e) => setDemoCapacity(Math.max(8, parseInt(e.target.value) || 40))}
                />
              </div>

              <div className="space-y-2">
                <Label>Concurrent Tasks (per developer)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={demoConcurrentTasks}
                  onChange={(e) => setDemoConcurrentTasks(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Results</h4>

              <div className="space-y-3">
                {/* Effort */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4">
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Effort (Man-Days)</div>
                  <div className="text-3xl font-bold">{manDays.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formula.base} + ({complexityWeight} × {gapWeight} × {formula.multiplier})
                  </div>
                </div>

                {/* Velocity */}
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4">
                  <div className="text-sm text-green-600 dark:text-green-400 mb-1">Velocity (Man-Days/Day)</div>
                  <div className="text-3xl font-bold">{velocity.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ({demoDevelopers} × {dailyHoursPerDev.toFixed(1)}hrs / {demoConcurrentTasks}) / 8
                  </div>
                </div>

                {/* Duration */}
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-4">
                  <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Duration</div>
                  <div className="flex items-baseline gap-4">
                    <div>
                      <span className="text-3xl font-bold">{workingDays}</span>
                      <span className="text-sm text-muted-foreground ml-1">working days</span>
                    </div>
                    <div className="text-muted-foreground">≈</div>
                    <div>
                      <span className="text-3xl font-bold">{calendarDays}</span>
                      <span className="text-sm text-muted-foreground ml-1">calendar days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Visual Flow */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
            <Badge variant="secondary" className="text-base px-4 py-2">
              <Calculator className="h-4 w-4 mr-2" />
              {manDays.toFixed(1)} man-days
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-base px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              ÷ {velocity.toFixed(2)} velocity
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-base px-4 py-2">
              <Calendar className="h-4 w-4 mr-2" />
              {workingDays} working / {calendarDays} calendar days
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Key Terms</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="font-medium text-blue-600">Man-Day</dt>
                  <dd className="text-muted-foreground">8 hours of productive work by one person</dd>
                </div>
                <div>
                  <dt className="font-medium text-green-600">Velocity</dt>
                  <dd className="text-muted-foreground">Man-days completed per working day by the team</dd>
                </div>
                <div>
                  <dt className="font-medium text-purple-600">Working Day</dt>
                  <dd className="text-muted-foreground">Monday through Friday (excludes weekends)</dd>
                </div>
                <div>
                  <dt className="font-medium text-orange-600">Concurrency</dt>
                  <dd className="text-muted-foreground">When developers work on multiple tasks simultaneously</dd>
                </div>
              </dl>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Common Patterns</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>1 developer at 40hrs/week = 1.0 man-days/day velocity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>3 developers focused = 3.0 man-days/day velocity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">!</span>
                  <span>Same 3 devs on 2 tasks = 1.5 man-days/day each</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">→</span>
                  <span>5 working days ≈ 7 calendar days</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
