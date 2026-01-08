"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Filter,
  X
} from "lucide-react"
import type { TimeScale, GanttFilters, PlanningData } from "@/types/planning-types"
import { Checkbox } from "@/components/ui/checkbox"

interface TimelineControlsProps {
  timeScale: TimeScale
  onTimeScaleChange: (scale: TimeScale) => void
  zoomLevel: number
  onZoomChange: (zoom: number) => void
  onZoomIn: () => void
  onZoomOut: () => void
  dateRange?: { start: Date; end: Date }
  onDateRangeChange?: (range: { start: Date; end: Date } | undefined) => void
  filters: GanttFilters
  onFiltersChange: (filters: GanttFilters) => void
  data: PlanningData
  onReset: () => void
  onFitToContent?: () => void
  onJumpToToday?: () => void
}

export function TimelineControls({
  timeScale,
  onTimeScaleChange,
  zoomLevel,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  dateRange,
  onDateRangeChange,
  filters,
  onFiltersChange,
  data,
  onReset,
  onFitToContent,
  onJumpToToday
}: TimelineControlsProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [showDateRange, setShowDateRange] = useState(false)
  
  const hasCustomDateRange = dateRange !== undefined

  const handleClientFilterChange = (clientId: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({
        ...filters,
        clientIds: [...filters.clientIds, clientId]
      })
    } else {
      onFiltersChange({
        ...filters,
        clientIds: filters.clientIds.filter((id) => id !== clientId)
      })
    }
  }

  const handleUseCaseFilterChange = (useCaseId: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({
        ...filters,
        useCaseIds: [...filters.useCaseIds, useCaseId]
      })
    } else {
      onFiltersChange({
        ...filters,
        useCaseIds: filters.useCaseIds.filter((id) => id !== useCaseId)
      })
    }
  }

  const clearFilters = () => {
    onFiltersChange({ clientIds: [], useCaseIds: [] })
  }

  const handlePresetRange = (preset: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let start: Date
    let end: Date = new Date(today)

    switch (preset) {
      case "3months":
        start = new Date(today)
        start.setMonth(start.getMonth() - 3)
        break
      case "6months":
        start = new Date(today)
        start.setMonth(start.getMonth() - 6)
        break
      case "year":
        start = new Date(today)
        start.setFullYear(start.getFullYear() - 1)
        break
      case "all":
      default:
        onDateRangeChange?.(undefined)
        return
    }

    onDateRangeChange?.({ start, end })
  }

  // Get available use cases based on client filter
  const availableUseCases = data.useCases.filter((uc) => {
    if (filters.clientIds.length === 0) return true
    return filters.clientIds.includes(uc.clientId)
  })

  const hasActiveFilters =
    filters.clientIds.length > 0 || filters.useCaseIds.length > 0

  return (
    <div className="space-y-4 border-b pb-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Time Scale Selector */}
        <div className="flex items-center gap-2">
          <Label htmlFor="time-scale" className="text-sm whitespace-nowrap">
            Time Scale:
          </Label>
          <Select value={timeScale} onValueChange={onTimeScaleChange}>
            <SelectTrigger id="time-scale" className="w-[140px]">
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

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onZoomOut}
            disabled={zoomLevel <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-[120px]">
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-medium text-foreground w-12">
              {zoomLevel.toFixed(1)}x
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onZoomIn}
            disabled={zoomLevel >= 5}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          {onFitToContent && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFitToContent}
              title="Fit to Content (Ctrl+F)"
            >
              Fit to Content
            </Button>
          )}
          {onJumpToToday && (
            <Button
              variant="outline"
              size="sm"
              onClick={onJumpToToday}
              title="Jump to Today"
            >
              Today
            </Button>
          )}
        </div>

        {/* View Window Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={hasCustomDateRange ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDateRange(!showDateRange)}
          >
            View Window
            {hasCustomDateRange && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </Button>
          {hasCustomDateRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateRangeChange?.(undefined)}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Date Range Presets */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetRange("3months")}
          >
            Last 3 Months
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetRange("year")}
          >
            This Year
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetRange("all")}
          >
            All Time
          </Button>
        </div>

        {/* Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={hasActiveFilters ? "border-primary" : ""}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {filters.clientIds.length + filters.useCaseIds.length}
            </Badge>
          )}
        </Button>

        {/* Reset Button */}
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* View Window - Custom Date Range */}
      {showDateRange && onDateRangeChange && (
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">View Window</h4>
              <p className="text-xs text-muted-foreground">
                Set the visible date range for the Gantt chart
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDateRange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="view-window-start" className="text-sm whitespace-nowrap">
                Start Date:
              </Label>
              <Input
                id="view-window-start"
                type="date"
                value={
                  dateRange?.start
                    ? dateRange.start.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const start = e.target.value
                    ? new Date(e.target.value)
                    : undefined
                  if (start && dateRange?.end && start >= dateRange.end) {
                    // If start >= end, extend end date
                    const newEnd = new Date(start)
                    newEnd.setDate(newEnd.getDate() + 30) // Default 30 days
                    onDateRangeChange?.({ start, end: newEnd })
                  } else {
                    onDateRangeChange?.(
                      start && dateRange?.end
                        ? { start, end: dateRange.end }
                        : start
                          ? { start, end: new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000) }
                          : dateRange
                    )
                  }
                }}
                className="w-[160px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="view-window-end" className="text-sm whitespace-nowrap">
                End Date:
              </Label>
              <Input
                id="view-window-end"
                type="date"
                value={
                  dateRange?.end
                    ? dateRange.end.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const end = e.target.value ? new Date(e.target.value) : undefined
                  if (end && dateRange?.start && end <= dateRange.start) {
                    // If end <= start, adjust start date
                    const newStart = new Date(end)
                    newStart.setDate(newStart.getDate() - 30) // Default 30 days back
                    onDateRangeChange?.({ start: newStart, end })
                  } else {
                    onDateRangeChange?.(
                      end && dateRange?.start
                        ? { start: dateRange.start, end }
                        : end
                          ? { start: new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000), end }
                          : dateRange
                    )
                  }
                }}
                className="w-[160px]"
              />
            </div>
            {hasCustomDateRange && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDateRangeChange?.(undefined)
                  setShowDateRange(false)
                }}
              >
                Clear Window
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-muted rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Client Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Clients</Label>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {data.clients.map((client) => (
                <div key={client.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`client-${client.id}`}
                    checked={filters.clientIds.includes(client.id)}
                    onCheckedChange={(checked) =>
                      handleClientFilterChange(client.id, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`client-${client.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {client.name}
                  </Label>
                </div>
              ))}
            </div>
            {filters.clientIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.clientIds.map((clientId) => {
                  const client = data.clients.find((c) => c.id === clientId)
                  return (
                    <Badge
                      key={clientId}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() =>
                        handleClientFilterChange(clientId, false)
                      }
                    >
                      {client?.name || clientId}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          {/* Use Case Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Use Cases</Label>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {availableUseCases.map((useCase) => (
                <div key={useCase.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`usecase-${useCase.id}`}
                    checked={filters.useCaseIds.includes(useCase.id)}
                    onCheckedChange={(checked) =>
                      handleUseCaseFilterChange(useCase.id, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`usecase-${useCase.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {useCase.useCaseId}: {useCase.title}
                  </Label>
                </div>
              ))}
            </div>
            {filters.useCaseIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.useCaseIds.map((useCaseId) => {
                  const useCase = data.useCases.find(
                    (uc) => uc.id === useCaseId
                  )
                  return (
                    <Badge
                      key={useCaseId}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() =>
                        handleUseCaseFilterChange(useCaseId, false)
                      }
                    >
                      {useCase?.useCaseId || useCaseId}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

