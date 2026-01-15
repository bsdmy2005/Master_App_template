"use client"

import { useState, useMemo, useCallback, Fragment } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  Save,
  Calendar,
  X
} from "lucide-react"
import type { PlanningData, UseCase, ScheduleStatus, UseCaseStatus } from "@/types/planning-types"
import { compareUseCaseIds } from "@/lib/utils"
import {
  calculateExpectedProgress,
  getScheduleStatus,
  getScheduleStatusInfo,
  isProgressStale,
  daysSinceLastUpdate,
  formatProgress
} from "@/lib/progress-utils"
import { calculateTimelines } from "@/lib/timeline-calculator"
import { writePlanningDataWithFallback } from "@/lib/storage-db"
import { toast } from "sonner"

interface ProgressReportProps {
  data: PlanningData
  setData: (data: PlanningData) => void
}

type StatusFilter = "all" | ScheduleStatus | "stale"
type TimePeriodFilter = "all" | "today" | "this-week" | "this-month"
type WorkflowStatusFilter = "all" | UseCaseStatus

const statusIcons: Record<ScheduleStatus, React.ReactNode> = {
  "ahead": <TrendingUp className="h-4 w-4" />,
  "on-track": <CheckCircle className="h-4 w-4" />,
  "behind": <AlertTriangle className="h-4 w-4" />,
  "at-risk": <AlertCircle className="h-4 w-4" />,
  "completed": <Check className="h-4 w-4" />,
  "not-started": <Clock className="h-4 w-4" />
}

export function ProgressReport({ data, setData }: ProgressReportProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [timePeriodFilter, setTimePeriodFilter] = useState<TimePeriodFilter>("all")
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState<WorkflowStatusFilter>("all")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [editingProgress, setEditingProgress] = useState<Record<string, number>>({})
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Calculate timelines to get capacity-adjusted end dates
  const timelineResult = useMemo(() => calculateTimelines(data), [data])

  // Create a map from use case ID to capacity-adjusted end date
  const endDateMap = useMemo(() => {
    const map = new Map<string, Date>()
    for (const timeline of timelineResult.timelines) {
      map.set(timeline.useCaseId, timeline.endDate)
    }
    return map
  }, [timelineResult])

  // Helper to get end date for a use case
  const getEndDate = (useCaseId: string): Date | undefined => {
    return endDateMap.get(useCaseId)
  }

  // Calculate summary statistics with capacity-adjusted end dates
  const summary = useMemo(() => {
    const useCases = data.useCases
    const summaryData = {
      total: useCases.length,
      notStarted: 0,
      ahead: 0,
      onTrack: 0,
      behind: 0,
      atRisk: 0,
      completed: 0,
      staleUpdates: 0,
      averageProgress: 0
    }

    let totalProgress = 0

    for (const useCase of useCases) {
      const endDate = endDateMap.get(useCase.id)
      const status = getScheduleStatus(useCase, endDate)

      switch (status) {
        case "not-started":
          summaryData.notStarted++
          break
        case "on-track":
          summaryData.onTrack++
          break
        case "at-risk":
          summaryData.atRisk++
          break
        case "ahead":
          summaryData.ahead++
          break
        case "behind":
          summaryData.behind++
          break
        case "completed":
          summaryData.completed++
          break
      }

      if (isProgressStale(useCase.lastProgressUpdate) && status !== "completed" && status !== "not-started") {
        summaryData.staleUpdates++
      }

      totalProgress += useCase.progressPercent ?? 0
    }

    summaryData.averageProgress = useCases.length > 0
      ? Math.round((totalProgress / useCases.length) * 10) / 10
      : 0

    return summaryData
  }, [data.useCases, endDateMap])

  // Filter and sort use cases
  const filteredUseCases = useMemo(() => {
    let filtered = [...data.useCases]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (uc) =>
          uc.title.toLowerCase().includes(query) ||
          uc.useCaseId.toLowerCase().includes(query) ||
          uc.description?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "stale") {
        filtered = filtered.filter((uc) => {
          const endDate = endDateMap.get(uc.id)
          const status = getScheduleStatus(uc, endDate)
          return isProgressStale(uc.lastProgressUpdate) &&
            status !== "completed" &&
            status !== "not-started"
        })
      } else {
        filtered = filtered.filter((uc) => {
          const endDate = endDateMap.get(uc.id)
          return getScheduleStatus(uc, endDate) === statusFilter
        })
      }
    }

    // Apply client filter
    if (clientFilter !== "all") {
      filtered = filtered.filter((uc) => uc.clientId === clientFilter)
    }

    // Apply workflow status filter (use case status like "in development", "defined", etc.)
    if (workflowStatusFilter !== "all") {
      filtered = filtered.filter((uc) => uc.status === workflowStatusFilter)
    }

    // Apply time period filter (active today, this week, this month)
    if (timePeriodFilter !== "all") {
      const now = new Date()
      now.setHours(0, 0, 0, 0)

      filtered = filtered.filter((uc) => {
        if (!uc.startDate) return false

        const startDate = new Date(uc.startDate)
        startDate.setHours(0, 0, 0, 0)

        // Use capacity-adjusted end date from timeline
        const endDate = endDateMap.get(uc.id)
        if (!endDate) return false

        // Check if the use case is active during the selected period
        switch (timePeriodFilter) {
          case "today": {
            // Active today: start date <= today <= end date
            return startDate <= now && endDate >= now
          }
          case "this-week": {
            // Get start of week (Monday)
            const weekStart = new Date(now)
            const dayOfWeek = weekStart.getDay()
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust for Monday start
            weekStart.setDate(weekStart.getDate() + diff)

            // Get end of week (Friday for business week)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 4)

            // Check if use case overlaps with this week
            return startDate <= weekEnd && endDate >= weekStart
          }
          case "this-month": {
            // Get start and end of current month
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

            // Check if use case overlaps with this month
            return startDate <= monthEnd && endDate >= monthStart
          }
          default:
            return true
        }
      })
    }

    // Sort alphanumerically by use case ID
    return filtered.sort((a, b) => compareUseCaseIds(a.useCaseId, b.useCaseId))
  }, [data.useCases, searchQuery, statusFilter, clientFilter, workflowStatusFilter, timePeriodFilter, endDateMap])

  // Toggle row expansion
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  // Handle progress update
  const handleProgressChange = (useCaseId: string, value: number) => {
    setEditingProgress((prev) => ({ ...prev, [useCaseId]: value }))
  }

  // Handle notes update
  const handleNotesChange = (useCaseId: string, value: string) => {
    setEditingNotes((prev) => ({ ...prev, [useCaseId]: value }))
  }

  // Save progress updates
  const saveProgress = useCallback(async (useCaseId: string) => {
    setIsSaving(true)
    const progress = editingProgress[useCaseId]
    const notes = editingNotes[useCaseId]

    const updatedUseCases = data.useCases.map((uc) => {
      if (uc.id === useCaseId) {
        const updates: Partial<UseCase> = {
          updatedAt: new Date().toISOString(),
          lastProgressUpdate: new Date().toISOString()
        }
        if (progress !== undefined) {
          updates.progressPercent = progress
        }
        if (notes !== undefined) {
          updates.progressNotes = notes
        }
        return { ...uc, ...updates }
      }
      return uc
    })

    const newData = { ...data, useCases: updatedUseCases }
    setData(newData)
    await writePlanningDataWithFallback(newData)

    // Clear editing state for this use case
    setEditingProgress((prev) => {
      const { [useCaseId]: _, ...rest } = prev
      return rest
    })
    setEditingNotes((prev) => {
      const { [useCaseId]: _, ...rest } = prev
      return rest
    })

    setIsSaving(false)
    toast.success("Progress updated")
  }, [data, setData, editingProgress, editingNotes])

  // Generate exportable report text
  const generateReportText = useCallback(() => {
    const now = new Date()
    const dateStr = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })

    let report = `# Progress Report - ${dateStr}\n\n`

    // Summary section
    report += `## Summary\n`
    report += `- Total Use Cases: ${summary.total}\n`
    report += `- Completed: ${summary.completed}\n`
    report += `- Ahead of Schedule: ${summary.ahead}\n`
    report += `- On Track: ${summary.onTrack}\n`
    report += `- Behind Schedule: ${summary.behind}\n`
    report += `- At Risk: ${summary.atRisk}\n`
    report += `- Not Started: ${summary.notStarted}\n`
    report += `- Average Progress: ${summary.averageProgress}%\n`
    if (summary.staleUpdates > 0) {
      report += `- Stale Updates (>7 days): ${summary.staleUpdates}\n`
    }
    report += `\n`

    // Helper to format date for report
    const formatReportDate = (date: Date | undefined) => {
      if (!date) return "N/A"
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }

    // At Risk items
    const atRiskItems = data.useCases.filter((uc) => {
      const endDate = endDateMap.get(uc.id)
      return getScheduleStatus(uc, endDate) === "at-risk"
    })
    if (atRiskItems.length > 0) {
      report += `## At Risk Items (Requires Attention)\n`
      for (const uc of atRiskItems.sort((a, b) => compareUseCaseIds(a.useCaseId, b.useCaseId))) {
        const client = data.clients.find((c) => c.id === uc.clientId)
        const endDate = endDateMap.get(uc.id)
        const expected = calculateExpectedProgress(uc.startDate, endDate, uc.manDays)
        report += `\n### ${uc.useCaseId}: ${uc.title}\n`
        report += `- Client: ${client?.name || "Unknown"}\n`
        report += `- Timeline: ${uc.startDate ? formatReportDate(new Date(uc.startDate)) : "N/A"} - ${formatReportDate(endDate)}\n`
        report += `- Progress: ${formatProgress(uc.progressPercent)} (Expected: ${formatProgress(expected)})\n`
        report += `- Duration: ${uc.manDays} man-days\n`
        if (uc.progressNotes) {
          report += `- Notes: ${uc.progressNotes}\n`
        }
      }
      report += `\n`
    }

    // Behind schedule items
    const behindItems = data.useCases.filter((uc) => {
      const endDate = endDateMap.get(uc.id)
      return getScheduleStatus(uc, endDate) === "behind"
    })
    if (behindItems.length > 0) {
      report += `## Behind Schedule\n`
      for (const uc of behindItems.sort((a, b) => compareUseCaseIds(a.useCaseId, b.useCaseId))) {
        const client = data.clients.find((c) => c.id === uc.clientId)
        const endDate = endDateMap.get(uc.id)
        const expected = calculateExpectedProgress(uc.startDate, endDate, uc.manDays)
        report += `- ${uc.useCaseId}: ${uc.title} (${client?.name}) - ${formatProgress(uc.progressPercent)} vs ${formatProgress(expected)} expected`
        if (uc.progressNotes) {
          report += ` | ${uc.progressNotes}`
        }
        report += `\n`
      }
      report += `\n`
    }

    // In progress items (on-track and ahead)
    const inProgressItems = data.useCases.filter((uc) => {
      const endDate = endDateMap.get(uc.id)
      const status = getScheduleStatus(uc, endDate)
      return status === "on-track" || status === "ahead"
    })
    if (inProgressItems.length > 0) {
      report += `## In Progress (On Track)\n`
      for (const uc of inProgressItems.sort((a, b) => compareUseCaseIds(a.useCaseId, b.useCaseId))) {
        const client = data.clients.find((c) => c.id === uc.clientId)
        const endDate = endDateMap.get(uc.id)
        const status = getScheduleStatus(uc, endDate)
        const statusLabel = status === "ahead" ? " (Ahead)" : ""
        report += `- ${uc.useCaseId}: ${uc.title} (${client?.name}) - ${formatProgress(uc.progressPercent)}${statusLabel}`
        if (uc.progressNotes) {
          report += ` | ${uc.progressNotes}`
        }
        report += `\n`
      }
      report += `\n`
    }

    // Completed items
    const completedItems = data.useCases.filter((uc) => {
      const endDate = endDateMap.get(uc.id)
      return getScheduleStatus(uc, endDate) === "completed"
    })
    if (completedItems.length > 0) {
      report += `## Completed\n`
      for (const uc of completedItems.sort((a, b) => compareUseCaseIds(a.useCaseId, b.useCaseId))) {
        const client = data.clients.find((c) => c.id === uc.clientId)
        report += `- ${uc.useCaseId}: ${uc.title} (${client?.name})\n`
      }
    }

    return report
  }, [data, summary, endDateMap])

  // Copy report to clipboard
  const copyReport = async () => {
    const report = generateReportText()
    await navigator.clipboard.writeText(report)
    setCopied(true)
    toast.success("Report copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  // Get client name
  const getClientName = (clientId: string) => {
    return data.clients.find((c) => c.id === clientId)?.name || "Unknown"
  }

  // Get developer names
  const getDeveloperNames = (developerIds: string[] | undefined) => {
    if (!developerIds || developerIds.length === 0) return "Unassigned"
    return developerIds
      .map((id) => data.developers.find((d) => d.id === id)?.name || "Unknown")
      .join(", ")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Progress Report</h2>
          <p className="text-muted-foreground">
            Track and report use case progress for management
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={copyReport} className="gap-2">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Report
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Copy formatted report to clipboard for sharing
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-gray-50 dark:bg-gray-900">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {summary.completed}
            </div>
            <div className="text-sm text-emerald-600 dark:text-emerald-500">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {summary.ahead}
            </div>
            <div className="text-sm text-green-600 dark:text-green-500">Ahead</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {summary.onTrack}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-500">On Track</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {summary.behind}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-500">Behind</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {summary.atRisk}
            </div>
            <div className="text-sm text-red-600 dark:text-red-500">At Risk</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 dark:bg-gray-900">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{summary.notStarted}</div>
            <div className="text-sm text-muted-foreground">Not Started</div>
          </CardContent>
        </Card>
      </div>

      {/* Stale updates warning */}
      {summary.staleUpdates > 0 && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700">
          <CardContent className="p-4 flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <span className="font-medium text-yellow-800 dark:text-yellow-300">
                {summary.staleUpdates} use case{summary.staleUpdates > 1 ? "s" : ""} haven&apos;t been updated in over 7 days.
              </span>
              <span className="text-yellow-700 dark:text-yellow-400 ml-2">
                Consider requesting progress updates from developers.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search use cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>

            {/* Time Period Filter */}
            <Select value={timePeriodFilter} onValueChange={(v) => setTimePeriodFilter(v as TimePeriodFilter)}>
              <SelectTrigger className="w-[150px] bg-background">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Active Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>

            {/* Schedule Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[160px] bg-background">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Progress" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Progress</SelectItem>
                <SelectItem value="at-risk">At Risk</SelectItem>
                <SelectItem value="behind">Behind</SelectItem>
                <SelectItem value="on-track">On Track</SelectItem>
                <SelectItem value="ahead">Ahead</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="stale">Stale Updates</SelectItem>
              </SelectContent>
            </Select>

            {/* Workflow Status Filter */}
            <Select value={workflowStatusFilter} onValueChange={(v) => setWorkflowStatusFilter(v as WorkflowStatusFilter)}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Workflow Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workflow</SelectItem>
                <SelectItem value="high-level definition">High-Level Definition</SelectItem>
                <SelectItem value="groomed">Groomed</SelectItem>
                <SelectItem value="defined">Defined</SelectItem>
                <SelectItem value="in development">In Development</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Client Filter */}
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {data.clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {(searchQuery || statusFilter !== "all" || clientFilter !== "all" || timePeriodFilter !== "all" || workflowStatusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setClientFilter("all")
                  setTimePeriodFilter("all")
                  setWorkflowStatusFilter("all")
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Active Filters Summary */}
          {(timePeriodFilter !== "all" || statusFilter !== "all" || clientFilter !== "all" || workflowStatusFilter !== "all") && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm text-muted-foreground">
              <span>Showing:</span>
              {timePeriodFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  {timePeriodFilter === "today" ? "Active Today" : timePeriodFilter === "this-week" ? "This Week" : "This Month"}
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {statusFilter === "stale" ? "Stale Updates" : statusFilter}
                </Badge>
              )}
              {workflowStatusFilter !== "all" && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {workflowStatusFilter}
                </Badge>
              )}
              {clientFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  {data.clients.find(c => c.id === clientFilter)?.name}
                </Badge>
              )}
              <span className="ml-auto font-medium">{filteredUseCases.length} use case{filteredUseCases.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Use Case</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
                <TableHead className="w-[100px] text-center">Start</TableHead>
                <TableHead className="w-[100px] text-center">End</TableHead>
                <TableHead className="w-[120px] text-center">Progress</TableHead>
                <TableHead className="w-[120px] text-center">Expected</TableHead>
                <TableHead className="w-[80px] text-center">Days</TableHead>
                <TableHead className="w-[100px]">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUseCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No use cases match the current filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredUseCases.map((useCase) => {
                  // Get capacity-adjusted end date from timeline
                  const endDate = endDateMap.get(useCase.id)
                  const status = getScheduleStatus(useCase, endDate)
                  const statusInfo = getScheduleStatusInfo(status)
                  const expectedProgress = calculateExpectedProgress(useCase.startDate, endDate, useCase.manDays)
                  const isStale = isProgressStale(useCase.lastProgressUpdate) &&
                    status !== "completed" &&
                    status !== "not-started"
                  const daysSince = daysSinceLastUpdate(useCase.lastProgressUpdate)
                  const isExpanded = expandedRows.has(useCase.id)
                  const hasEdits = editingProgress[useCase.id] !== undefined ||
                    editingNotes[useCase.id] !== undefined
                  const currentProgress = editingProgress[useCase.id] ?? useCase.progressPercent ?? 0
                  const currentNotes = editingNotes[useCase.id] ?? useCase.progressNotes ?? ""

                  // Format dates for display
                  const startDateStr = useCase.startDate
                    ? new Date(useCase.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "—"
                  const endDateStr = endDate
                    ? endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "—"

                  return (
                    <Fragment key={useCase.id}>
                      <TableRow
                        className={isStale ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(useCase.id)}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {useCase.useCaseId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{useCase.title}</span>
                            {isStale && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
                                      Stale
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Last updated {daysSince} days ago
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getClientName(useCase.clientId)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Badge
                              className={`${statusInfo.bgColor} ${statusInfo.color} border ${statusInfo.borderColor} gap-1`}
                            >
                              {statusIcons[status]}
                              {statusInfo.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {startDateStr}
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {endDateStr}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  status === "at-risk" ? "bg-red-500" :
                                  status === "behind" ? "bg-orange-500" :
                                  status === "ahead" ? "bg-green-500" :
                                  status === "completed" ? "bg-emerald-500" :
                                  "bg-blue-500"
                                }`}
                                style={{ width: `${Math.min(100, currentProgress)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-10">
                              {formatProgress(currentProgress)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {formatProgress(expectedProgress)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {useCase.manDays}d
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {useCase.lastProgressUpdate
                            ? new Date(useCase.lastProgressUpdate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            : "Never"}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${useCase.id}-expanded`}>
                          <TableCell colSpan={11} className="bg-muted/30 p-4">
                            <div className="space-y-4">
                              {/* Progress Slider */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium">
                                    Update Progress
                                  </label>
                                  <span className="text-sm text-muted-foreground">
                                    {currentProgress}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Slider
                                    value={[currentProgress]}
                                    onValueChange={(values: number[]) => handleProgressChange(useCase.id, values[0])}
                                    max={100}
                                    step={5}
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    value={currentProgress}
                                    onChange={(e) => handleProgressChange(useCase.id, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="w-20"
                                    min={0}
                                    max={100}
                                  />
                                </div>
                              </div>

                              {/* Notes */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  Progress Notes / Commentary
                                </label>
                                <Textarea
                                  value={currentNotes}
                                  onChange={(e) => handleNotesChange(useCase.id, e.target.value)}
                                  placeholder="Add notes about progress, blockers, complexities..."
                                  rows={3}
                                />
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Assigned:</span>
                                  <p className="font-medium">
                                    {getDeveloperNames(useCase.assignedDeveloperIds)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Start Date:</span>
                                  <p className="font-medium">
                                    {useCase.startDate
                                      ? new Date(useCase.startDate).toLocaleDateString()
                                      : "Not set"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Expected End:</span>
                                  <p className="font-medium">
                                    {endDate ? endDate.toLocaleDateString() : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Priority:</span>
                                  <p className="font-medium capitalize">{useCase.priority}</p>
                                </div>
                              </div>

                              {/* Save Button */}
                              {hasEdits && (
                                <div className="flex justify-end">
                                  <Button
                                    onClick={() => saveProgress(useCase.id)}
                                    disabled={isSaving}
                                    className="gap-2"
                                  >
                                    <Save className="h-4 w-4" />
                                    Save Progress
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Average Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Overall Progress</h3>
              <p className="text-sm text-muted-foreground">
                Average across all use cases
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-48 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${Math.min(100, summary.averageProgress)}%` }}
                />
              </div>
              <span className="text-2xl font-bold">{summary.averageProgress}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
