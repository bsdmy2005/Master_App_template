"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { ChevronRight, ChevronDown, Edit, Trash2, Building2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  useColumnSettings,
  type ColumnConfig
} from "./column-settings"
import { SubtaskTable } from "./subtask-table"
import { calculateTimelines } from "@/lib/timeline-calculator"
import type {
  PlanningData,
  UseCase,
  Client,
  Task,
  UseCaseStatus
} from "@/types/planning-types"

type ViewMode = "client" | "usecase" | "priority" | "startdate"

interface UseCaseTableProps {
  data: PlanningData
  filteredAndSortedUseCases: UseCase[]
  viewMode: ViewMode
  useCasesByClient?: Map<string, UseCase[]>
  onEdit: (useCase: UseCase) => void
  onDelete: (useCaseId: string) => void
  onStatusUpdate?: (useCaseId: string, status: UseCaseStatus) => void
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
  onTaskAdd?: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void
  onTaskDelete?: (taskId: string) => void
  columns?: ColumnConfig[]
}

export function UseCaseTable({
  data,
  filteredAndSortedUseCases,
  viewMode,
  useCasesByClient,
  onEdit,
  onDelete,
  onStatusUpdate,
  onTaskUpdate,
  onTaskAdd,
  onTaskDelete,
  columns: propsColumns
}: UseCaseTableProps) {
  const hookColumns = useColumnSettings().columns
  const columns = propsColumns || hookColumns
  const [expandedUseCases, setExpandedUseCases] = useState<Set<string>>(
    new Set()
  )
  // Default to all clients collapsed
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(
    new Set(data.clients.map((c) => c.id))
  )

  // Calculate timelines for dynamic mandaya
  const timelineResult = useMemo(() => calculateTimelines(data), [data])
  const timelinesByUseCaseId = useMemo(() => {
    const map = new Map<string, typeof timelineResult.timelines[0]>()
    for (const timeline of timelineResult.timelines) {
      map.set(timeline.useCaseId, timeline)
    }
    return map
  }, [timelineResult.timelines])

  // Get visible columns sorted by order
  const visibleColumns = columns
    .filter((col) => col.visible || col.id === "expand" || col.id === "actions")
    .sort((a, b) => a.order - b.order)

  const isColumnVisible = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId)
    return column?.visible ?? true
  }

  const renderTableCell = (columnId: string, useCase: UseCase, client?: Client) => {
    const tasks = getUseCaseTasks(useCase.id)
    const isExpanded = expandedUseCases.has(useCase.id)

    switch (columnId) {
      case "expand":
        return (
          <TableCell key="expand" className="w-[50px]">
            {onTaskUpdate && onTaskAdd && onTaskDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => toggleExpanded(useCase.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </TableCell>
        )
      case "id":
        return (
          <TableCell key="id" className="font-medium">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {useCase.useCaseId}
              </Badge>
              {onTaskUpdate && onTaskAdd && onTaskDelete && (
                <Badge variant="secondary" className="text-xs">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </TableCell>
        )
      case "title":
        return (
          <TableCell key="title">
            <div className="min-w-[200px] max-w-[300px] whitespace-normal break-words">
              <div className="font-medium">{useCase.title}</div>
            </div>
          </TableCell>
        )
      case "client":
        return (
          <TableCell key="client">
            <div className="min-w-[150px] max-w-[200px] whitespace-normal break-words">
              <div className="text-sm text-muted-foreground">
                {client?.name || "Unknown"}
              </div>
            </div>
          </TableCell>
        )
      case "description":
        return (
          <TableCell key="description">
            <div className="min-w-[200px] max-w-[400px] whitespace-normal break-words">
              {useCase.description ? (
                <div className="text-sm text-muted-foreground">
                  {useCase.description}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </TableCell>
        )
      case "complexity":
        return (
          <TableCell key="complexity">
            <Badge className={complexityColors[useCase.complexity]}>
              {useCase.complexity}
            </Badge>
          </TableCell>
        )
      case "gap":
        return (
          <TableCell key="gap">
            <Badge variant="outline">
              {useCase.gap === "sdk-native"
                ? "SDK Native"
                : useCase.gap === "minor-extension"
                  ? "Minor Extension"
                  : useCase.gap === "moderate-extension"
                    ? "Moderate Extension"
                    : useCase.gap === "significant-extension"
                      ? "Significant Extension"
                      : "Custom Implementation"}
            </Badge>
          </TableCell>
        )
      case "manDays":
        const timeline = timelinesByUseCaseId.get(useCase.id)
        // Show duration (working days) if timeline exists, otherwise show initial mandays
        const displayValue = timeline?.duration ?? useCase.manDays
        return (
          <TableCell key="manDays" className="text-right">
            {displayValue.toFixed(1)} {timeline ? "days" : "man-days"}
          </TableCell>
        )
      case "status":
        return (
          <TableCell key="status">
            {onStatusUpdate ? (
              <Select
                value={useCase.status}
                onValueChange={(value: UseCaseStatus) =>
                  onStatusUpdate(useCase.id, value)
                }
              >
                <SelectTrigger className="h-8 min-w-[180px] max-w-[220px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`h-2 w-2 rounded-full shrink-0 ${statusColors[useCase.status]}`}
                    />
                    <SelectValue>
                      {useCase.status === "high-level definition"
                        ? "High-level"
                        : useCase.status === "in development"
                          ? "In Progress"
                          : useCase.status.charAt(0).toUpperCase() +
                            useCase.status.slice(1)}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-level definition">
                    High-level Definition
                  </SelectItem>
                  <SelectItem value="groomed">Groomed</SelectItem>
                  <SelectItem value="defined">Defined</SelectItem>
                  <SelectItem value="in development">In Development</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${statusColors[useCase.status]}`}
                />
                <span className="text-sm capitalize">{useCase.status}</span>
              </div>
            )}
          </TableCell>
        )
      case "priority":
        return (
          <TableCell key="priority" className="text-right">
            <Badge variant="secondary" className="capitalize">
              {useCase.priority}
            </Badge>
          </TableCell>
        )
      case "startDate":
        return (
          <TableCell key="startDate">
            {useCase.startDate ? (
              <span className="text-sm">
                {new Date(useCase.startDate).toLocaleDateString()}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </TableCell>
        )
      case "developers":
        return (
          <TableCell key="developers">
            <div className="min-w-[150px] max-w-[200px]">
              {useCase.assignedDeveloperIds && useCase.assignedDeveloperIds.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {useCase.assignedDeveloperIds.map((devId) => {
                    const dev = data.developers.find((d) => d.id === devId)
                    return dev ? (
                      <Badge key={devId} variant="outline" className="text-xs">
                        {dev.name}
                      </Badge>
                    ) : null
                  })}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </TableCell>
        )
      case "sdkGaps":
        return (
          <TableCell key="sdkGaps">
            <div className="max-w-[200px]">
              {useCase.sdkGaps ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="truncate text-sm text-muted-foreground">
                      {truncateText(useCase.sdkGaps, 50)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p className="whitespace-pre-wrap">{useCase.sdkGaps}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </TableCell>
        )
      case "actions":
        return (
          <TableCell key="actions">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(useCase)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDelete(useCase.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        )
      default:
        return null
    }
  }

  const toggleExpanded = (useCaseId: string) => {
    const newExpanded = new Set(expandedUseCases)
    if (newExpanded.has(useCaseId)) {
      newExpanded.delete(useCaseId)
    } else {
      newExpanded.add(useCaseId)
    }
    setExpandedUseCases(newExpanded)
  }

  const toggleClientCollapse = (clientId: string) => {
    const newCollapsed = new Set(collapsedClients)
    if (newCollapsed.has(clientId)) {
      newCollapsed.delete(clientId)
    } else {
      newCollapsed.add(clientId)
    }
    setCollapsedClients(newCollapsed)
  }

  const getUseCaseTasks = (useCaseId: string): Task[] => {
    return data.tasks.filter((task) => task.useCaseId === useCaseId)
  }

  const getClient = (clientId: string): Client | undefined => {
    return data.clients.find((c) => c.id === clientId)
  }

  const getDeveloperNames = (developerIds: string[]): string => {
    return developerIds
      .map((id) => {
        const dev = data.developers.find((d) => d.id === id)
        return dev?.name || ""
      })
      .filter(Boolean)
      .join(", ")
  }

  const statusColors = {
    "high-level definition": "bg-gray-500",
    groomed: "bg-blue-500",
    defined: "bg-yellow-500",
    "in development": "bg-orange-500",
    completed: "bg-green-500"
  }

  const complexityColors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const renderUseCaseRow = (useCase: UseCase, isNested = false) => {
    const client = getClient(useCase.clientId)
    const tasks = getUseCaseTasks(useCase.id)
    const isExpanded = expandedUseCases.has(useCase.id)

    return (
      <React.Fragment key={useCase.id}>
        <TableRow className={isNested ? "bg-muted/30" : ""}>
          {visibleColumns.map((column) =>
            renderTableCell(column.id, useCase, client)
          )}
        </TableRow>
        <AnimatePresence>
          {isExpanded && onTaskUpdate && onTaskAdd && onTaskDelete && (
            <motion.tr
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TableCell colSpan={visibleColumns.length} className="p-0">
                <div className="bg-muted/50 p-4">
                  <SubtaskTable
                    tasks={tasks}
                    useCaseId={useCase.id}
                    onTaskUpdate={onTaskUpdate}
                    onTaskAdd={onTaskAdd}
                    onTaskDelete={onTaskDelete}
                  />
                </div>
              </TableCell>
            </motion.tr>
          )}
        </AnimatePresence>
      </React.Fragment>
    )
  }

  if (viewMode === "client" && useCasesByClient) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => {
                const getHeaderClass = () => {
                  if (column.id === "expand") return "w-[50px]"
                  if (column.id === "manDays" || column.id === "priority")
                    return "text-right"
                  if (column.id === "actions") return "w-[100px]"
                  return ""
                }
                return (
                  <TableHead key={column.id} className={getHeaderClass()}>
                    {column.label || ""}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.clients.map((client) => {
              const clientUseCases =
                useCasesByClient.get(client.id) || []
              if (clientUseCases.length === 0) return null

              const isClientCollapsed = collapsedClients.has(client.id)

              return (
                <React.Fragment key={`client-group-${client.id}`}>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={visibleColumns.length} className="font-semibold">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleClientCollapse(client.id)}
                        >
                          {isClientCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Building2 className="h-4 w-4" />
                        {client.name}
                        <Badge variant="outline" className="ml-2">
                          {clientUseCases.length} use case
                          {clientUseCases.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                  {!isClientCollapsed &&
                    clientUseCases.map((useCase) =>
                      renderUseCaseRow(useCase, false)
                    )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Complexity</TableHead>
            <TableHead>Gap</TableHead>
            <TableHead className="text-right">Man-Days</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Priority</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>SDK Gaps</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedUseCases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleColumns.length} className="text-center text-muted-foreground">
                No use cases found
              </TableCell>
            </TableRow>
          ) : (
            filteredAndSortedUseCases.map((useCase) =>
              renderUseCaseRow(useCase, false)
            )
          )}
        </TableBody>
      </Table>
    </div>
  )
}

