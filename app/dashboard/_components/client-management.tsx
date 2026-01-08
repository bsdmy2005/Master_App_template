"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  Plus,
  Building2,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  Filter
} from "lucide-react"
import type {
  PlanningData,
  Client,
  UseCase,
  Task,
  UseCaseDependency,
  UseCaseDependencyType,
  Complexity,
  UseCaseStatus,
  GapLevel,
  Priority
} from "@/types/planning-types"
import { writePlanningDataWithFallback } from "@/lib/storage-db"
import { useEffortConfig } from "@/lib/effort-config-context"
import { complexityLabels, gapLevelLabels } from "@/lib/effort-formula"
import { calculateTimelines, type UseCaseTimeline } from "@/lib/timeline-calculator"
import { toast } from "sonner"
import { ViewSwitcher } from "./view-switcher"
import { ViewFormatToggle } from "./view-format-toggle"
import { UseCaseTable } from "./use-case-table"
import { ColumnSettings, useColumnSettings } from "./column-settings"

interface ClientManagementProps {
  data: PlanningData
  setData: (data: PlanningData) => void
}

type ViewMode = "client" | "usecase" | "priority" | "startdate"

export function ClientManagement({ data, setData }: ClientManagementProps) {
  const { calculateEffort, config: effortConfig } = useEffortConfig()
  const columnSettings = useColumnSettings()
  const [viewMode, setViewMode] = useState<ViewMode>("client")
  const [displayFormat, setDisplayFormat] = useState<"card" | "table">("table")
  const [expandedClients, setExpandedClients] = useState<Set<string>>(
    new Set(data.clients.map((c) => c.id))
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<UseCaseStatus | "all">(
    "all"
  )
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [isUseCaseDialogOpen, setIsUseCaseDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string>("")

  const [clientFormData, setClientFormData] = useState({
    name: "",
    description: "",
    systems: ""
  })

  const [useCaseFormData, setUseCaseFormData] = useState({
    clientId: "",
    useCaseId: "",
    title: "",
    description: "",
    keyAcceptanceCriteria: "",
    complexity: "medium" as Complexity,
    gap: "moderate-extension" as GapLevel,
    sdkGaps: "",
    status: "high-level definition" as UseCaseStatus,
    priority: "medium" as Priority,
    startDate: "",
    assignedDeveloperIds: [] as string[]
  })

  const [useCaseTasks, setUseCaseTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    estimatedHours: 8,
    assignedDeveloperIds: [] as string[],
    status: "todo" as Task["status"],
    dependencies: [] as string[]
  })

  // Calculate timelines for dynamic duration
  const timelineResult = useMemo(() => calculateTimelines(data), [data])
  const timelinesByUseCaseId = useMemo(() => {
    const map = new Map<string, typeof timelineResult.timelines[0]>()
    for (const timeline of timelineResult.timelines) {
      map.set(timeline.useCaseId, timeline)
    }
    return map
  }, [timelineResult.timelines])

  // Filter and sort use cases based on view mode
  const filteredAndSortedUseCases = useMemo(() => {
    const filtered = data.useCases.filter((uc) => {
      const matchesSearch =
        uc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uc.useCaseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uc.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || uc.status === statusFilter
      return matchesSearch && matchesStatus
    })

    switch (viewMode) {
      case "priority":
        filtered.sort((a, b) => {
          const priorityOrder: Record<Priority, number> = { low: 1, medium: 2, high: 3 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        })
        break
      case "startdate":
        filtered.sort((a, b) => {
          if (!a.startDate && !b.startDate) return 0
          if (!a.startDate) return 1
          if (!b.startDate) return -1
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        })
        break
      case "usecase":
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        // client view - keep grouped by client
        break
    }

    return filtered
  }, [data.useCases, viewMode, searchQuery, statusFilter])

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { checkDatabaseAvailableAction } = await import("@/actions/db/db-actions")
    const { createClientAction, updateClientAction } = await import("@/actions/db/clients-actions")
    
    const dbAvailable = await checkDatabaseAvailableAction()
    
    const clientData = {
      name: clientFormData.name,
      description: clientFormData.description || null,
      systems: clientFormData.systems
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    }

    if (dbAvailable) {
      if (editingClient) {
        const result = await updateClientAction(editingClient.id, clientData)
        if (result.isSuccess && result.data) {
          // Convert database result (null) to Client type (undefined)
          const updatedClient: Client = {
            id: result.data.id,
            name: result.data.name,
            description: result.data.description || undefined,
            systems: result.data.systems || undefined,
            createdAt: result.data.createdAt.toISOString(),
            updatedAt: result.data.updatedAt.toISOString()
          }
          const updatedClients = data.clients.map((client) =>
            client.id === editingClient.id ? updatedClient : client
          )
          setData({ ...data, clients: updatedClients })
          setIsClientDialogOpen(false)
          setEditingClient(null)
          setClientFormData({ name: "", description: "", systems: "" })
          toast.success("Client updated successfully")
        } else {
          toast.error("Failed to update client: " + result.message)
        }
      } else {
        const clientWithId = {
          ...clientData,
          id: `client-${Date.now()}`
        }
        const result = await createClientAction(clientWithId)
        if (result.isSuccess && result.data) {
          // Convert database result (null) to Client type (undefined)
          const newClient: Client = {
            id: result.data.id,
            name: result.data.name,
            description: result.data.description || undefined,
            systems: result.data.systems || undefined,
            createdAt: result.data.createdAt.toISOString(),
            updatedAt: result.data.updatedAt.toISOString()
          }
          setData({ ...data, clients: [...data.clients, newClient] })
          setIsClientDialogOpen(false)
          setClientFormData({ name: "", description: "", systems: "" })
          toast.success("Client added successfully")
        } else {
          toast.error("Failed to create client: " + result.message)
        }
      }
    } else {
      // Fallback to file system
      const now = new Date().toISOString()
      let updatedClients: Client[]

      if (editingClient) {
        updatedClients = data.clients.map((client) =>
          client.id === editingClient.id
            ? {
                ...client,
                name: clientData.name,
                description: clientData.description || undefined,
                systems: clientData.systems.length > 0 ? clientData.systems : undefined,
                updatedAt: now
              }
            : client
        )
      } else {
        const newClient: Client = {
          id: `client-${Date.now()}`,
          name: clientData.name,
          description: clientData.description || undefined,
          systems: clientData.systems.length > 0 ? clientData.systems : undefined,
          createdAt: now,
          updatedAt: now
        }
        updatedClients = [...data.clients, newClient]
      }

      const updatedData: PlanningData = {
        ...data,
        clients: updatedClients
      }

      const result = await writePlanningDataWithFallback(updatedData)
      if (result.success) {
        setData(updatedData)
        setIsClientDialogOpen(false)
        setEditingClient(null)
        setClientFormData({ name: "", description: "", systems: "" })
        toast.success(
          editingClient
            ? "Client updated successfully (file system)"
            : "Client added successfully (file system)"
        )
      } else {
        toast.error("Failed to save client")
      }
    }
  }

  const handleUseCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const manDays = calculateEffort(
      useCaseFormData.complexity,
      useCaseFormData.gap
    )

    const now = new Date().toISOString()
    let updatedUseCases: UseCase[]
    let useCaseId: string

    if (editingUseCase) {
      useCaseId = editingUseCase.id
      updatedUseCases = data.useCases.map((uc) =>
        uc.id === editingUseCase.id
          ? {
              ...uc,
              ...useCaseFormData,
              manDays,
              updatedAt: now
            }
          : uc
      )
    } else {
      useCaseId = `usecase-${Date.now()}`
      const newUseCase: UseCase = {
        id: useCaseId,
        ...useCaseFormData,
        manDays,
        createdAt: now,
        updatedAt: now
      }
      updatedUseCases = [...data.useCases, newUseCase]
    }

    // Update tasks with the use case ID
    const updatedTasks = useCaseTasks.map((task) => ({
      ...task,
      useCaseId,
      updatedAt: now
    }))

    // Remove old tasks for this use case if editing
    const existingTasks = editingUseCase
      ? data.tasks.filter((t) => t.useCaseId !== editingUseCase.id)
      : data.tasks

    const updatedData: PlanningData = {
      ...data,
      useCases: updatedUseCases,
      tasks: [...existingTasks, ...updatedTasks]
    }

    const result = await writePlanningDataWithFallback(updatedData)
    if (result.success) {
      setData(updatedData)
      setIsUseCaseDialogOpen(false)
      setEditingUseCase(null)
      setUseCaseTasks([])
      setUseCaseFormData({
        clientId: "",
        useCaseId: "",
        title: "",
        description: "",
        keyAcceptanceCriteria: "",
        complexity: "medium",
        gap: "moderate-extension" as GapLevel,
        sdkGaps: "",
        status: "high-level definition",
        priority: "medium" as Priority,
        startDate: "",
        assignedDeveloperIds: []
      })
      toast.success(
        editingUseCase
          ? "Use case updated successfully"
          : "Use case added successfully"
      )
    } else {
      toast.error("Failed to save use case")
    }
  }

  const handleAddTask = () => {
    const now = new Date().toISOString()
    const newTask: Task = {
      id: `task-${Date.now()}`,
      useCaseId: editingUseCase?.id || "",
      title: taskFormData.title,
      description: taskFormData.description,
      estimatedHours: taskFormData.estimatedHours,
      assignedDeveloperIds: taskFormData.assignedDeveloperIds,
      status: taskFormData.status,
      dependencies: taskFormData.dependencies,
      createdAt: now,
      updatedAt: now
    }

    if (editingTask) {
      setUseCaseTasks(
        useCaseTasks.map((t) => (t.id === editingTask.id ? newTask : t))
      )
    } else {
      setUseCaseTasks([...useCaseTasks, newTask])
    }

    setEditingTask(null)
    setTaskFormData({
      title: "",
      description: "",
      estimatedHours: 8,
      assignedDeveloperIds: [],
      status: "todo",
      dependencies: []
    })
  }

  const handleDeleteTask = (taskId: string) => {
    setUseCaseTasks(useCaseTasks.filter((t) => t.id !== taskId))
  }

  const handlePasteSubtasks = async (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData("text")
    
    if (!pastedText.trim()) return

    // Parse pasted text by newlines
    const lines = pastedText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length === 0) return

    // Create tasks from each line
    const now = new Date().toISOString()
    const newTasks: Task[] = lines.map((line, index) => ({
      id: `task-${Date.now()}-${index}`,
      useCaseId: editingUseCase?.id || "",
      title: line,
      description: "",
      estimatedHours: 8,
      assignedDeveloperIds: [],
      status: "todo" as Task["status"],
      dependencies: [],
      createdAt: now,
      updatedAt: now
    }))

    // Add new tasks to existing tasks
    setUseCaseTasks([...useCaseTasks, ...newTasks])
    toast.success(`Added ${newTasks.length} subtask${newTasks.length !== 1 ? "s" : ""} from clipboard`)
  }

  const handleDeleteClient = async (id: string) => {
    if (
      !confirm(
        "Are you sure? This will also delete all use cases, tasks, and dependencies for this client."
      )
    )
      return

    const { checkDatabaseAvailableAction } = await import("@/actions/db/db-actions")
    const { deleteClientAction } = await import("@/actions/db/clients-actions")
    
    const dbAvailable = await checkDatabaseAvailableAction()
    
    if (dbAvailable) {
      const result = await deleteClientAction(id)
      if (result.isSuccess) {
        // Update local state - cascade delete use cases, tasks, and dependencies
        const clientUseCaseIds = data.useCases
          .filter((uc) => uc.clientId === id)
          .map((uc) => uc.id)
        
        const updatedClients = data.clients.filter((c) => c.id !== id)
        const updatedUseCases = data.useCases.filter((uc) => uc.clientId !== id)
        const updatedTasks = data.tasks.filter(
          (task) => !clientUseCaseIds.includes(task.useCaseId)
        )
        const updatedDependencies = data.dependencies.filter(
          (dep) =>
            !clientUseCaseIds.includes(dep.fromUseCaseId) &&
            !clientUseCaseIds.includes(dep.toUseCaseId)
        )
        
        setData({
          ...data,
          clients: updatedClients,
          useCases: updatedUseCases,
          tasks: updatedTasks,
          dependencies: updatedDependencies
        })
        toast.success("Client deleted successfully")
      } else {
        toast.error("Failed to delete client: " + result.message)
      }
    } else {
      // Fallback to file system
      const clientUseCaseIds = data.useCases
        .filter((uc) => uc.clientId === id)
        .map((uc) => uc.id)
      
      const updatedClients = data.clients.filter((c) => c.id !== id)
      const updatedUseCases = data.useCases.filter((uc) => uc.clientId !== id)
      const updatedTasks = data.tasks.filter(
        (task) => !clientUseCaseIds.includes(task.useCaseId)
      )
      const updatedDependencies = data.dependencies.filter(
        (dep) =>
          !clientUseCaseIds.includes(dep.fromUseCaseId) &&
          !clientUseCaseIds.includes(dep.toUseCaseId)
      )
      
      const updatedData: PlanningData = {
        ...data,
        clients: updatedClients,
        useCases: updatedUseCases,
        tasks: updatedTasks,
        dependencies: updatedDependencies
      }

      const result = await writePlanningDataWithFallback(updatedData)
      if (result.success) {
        setData(updatedData)
        toast.success("Client deleted successfully (file system)")
      } else {
        toast.error("Failed to delete client")
      }
    }
  }

  const handleDeleteUseCase = async (id: string) => {
    if (!confirm("Are you sure you want to delete this use case?")) return

    // Check if database is available and use the delete action
    const { checkDatabaseAvailableAction } = await import("@/actions/db/db-actions")
    const { deleteUseCaseAction } = await import("@/actions/db/use-cases-actions")
    
    const dbAvailable = await checkDatabaseAvailableAction()
    
    if (dbAvailable) {
      // Use database action which handles tasks and dependencies
      const result = await deleteUseCaseAction(id)
      if (result.isSuccess) {
        // Update local state
        const updatedUseCases = data.useCases.filter((uc) => uc.id !== id)
        const updatedTasks = data.tasks.filter((t) => t.useCaseId !== id)
        const updatedDependencies = data.dependencies.filter(
          (d) => d.fromUseCaseId !== id && d.toUseCaseId !== id
        )
        const updatedData: PlanningData = {
          ...data,
          useCases: updatedUseCases,
          tasks: updatedTasks,
          dependencies: updatedDependencies
        }
        setData(updatedData)
        toast.success("Use case deleted successfully")
      } else {
        toast.error(result.message || "Failed to delete use case")
      }
    } else {
      // Fallback to file system - also remove tasks and dependencies
      const updatedUseCases = data.useCases.filter((uc) => uc.id !== id)
      const updatedTasks = data.tasks.filter((t) => t.useCaseId !== id)
      const updatedDependencies = data.dependencies.filter(
        (d) => d.fromUseCaseId !== id && d.toUseCaseId !== id
      )
      const updatedData: PlanningData = {
        ...data,
        useCases: updatedUseCases,
        tasks: updatedTasks,
        dependencies: updatedDependencies
      }

      const result = await writePlanningDataWithFallback(updatedData)
      if (result.success) {
        setData(updatedData)
        toast.success("Use case deleted successfully")
      } else {
        toast.error("Failed to delete use case")
      }
    }
  }

  const handleStatusUpdate = async (useCaseId: string, status: UseCaseStatus) => {
    // Use updateUseCaseAction for individual status update
    const { updateUseCaseAction } = await import("@/actions/db/use-cases-actions")
    const { checkDatabaseAvailableAction } = await import("@/actions/db/db-actions")
    const { readPlanningDataAction } = await import("@/actions/db/planning-data-actions")
    
    const dbAvailable = await checkDatabaseAvailableAction()
    
    if (dbAvailable) {
      // Use database action for individual update
      const result = await updateUseCaseAction(useCaseId, { status })
      
      if (result.isSuccess) {
        // Refresh data from database
        const refreshResult = await readPlanningDataAction()
        if (refreshResult.isSuccess && refreshResult.data) {
          setData(refreshResult.data)
          toast.success("Status updated successfully")
        } else {
          // Fallback: update local state
          const now = new Date().toISOString()
          const updatedUseCases = data.useCases.map((uc) =>
            uc.id === useCaseId
              ? { ...uc, status, updatedAt: now }
              : uc
          )
          setData({ ...data, useCases: updatedUseCases })
          toast.success("Status updated (local)")
        }
      } else {
        toast.error("Failed to update status: " + result.message)
      }
    } else {
      // Fallback to file system approach
    const now = new Date().toISOString()
    const updatedUseCases = data.useCases.map((uc) =>
      uc.id === useCaseId
        ? { ...uc, status, updatedAt: now }
        : uc
    )

    const updatedData: PlanningData = {
      ...data,
      useCases: updatedUseCases
    }

    const result = await writePlanningDataWithFallback(updatedData)
    if (result.success) {
      setData(updatedData)
      toast.success("Status updated successfully")
    } else {
      toast.error("Failed to update status")
      }
    }
  }

  const handleTaskUpdate = async (
    taskId: string,
    updates: Partial<Task>
  ) => {
    const now = new Date().toISOString()
    const updatedTasks = data.tasks.map((task) =>
      task.id === taskId
        ? { ...task, ...updates, updatedAt: now }
        : task
    )

    const updatedData: PlanningData = {
      ...data,
      tasks: updatedTasks
    }

    const result = await writePlanningDataWithFallback(updatedData)
    if (result.success) {
      setData(updatedData)
      toast.success("Task updated successfully")
    } else {
      toast.error("Failed to update task")
    }
  }

  const handleTaskAdd = async (
    task: Omit<Task, "id" | "createdAt" | "updatedAt">
  ) => {
    const now = new Date().toISOString()
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    }

    const updatedData: PlanningData = {
      ...data,
      tasks: [...data.tasks, newTask]
    }

    const result = await writePlanningDataWithFallback(updatedData)
    if (result.success) {
      setData(updatedData)
      toast.success("Task added successfully")
    } else {
      toast.error("Failed to add task")
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    const updatedTasks = data.tasks.filter((task) => task.id !== taskId)
    const updatedData: PlanningData = {
      ...data,
      tasks: updatedTasks
    }

    const result = await writePlanningDataWithFallback(updatedData)
    if (result.success) {
      setData(updatedData)
      toast.success("Task deleted successfully")
    } else {
      toast.error("Failed to delete task")
    }
  }

  const toggleClientExpansion = (clientId: string) => {
    const newExpanded = new Set(expandedClients)
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId)
    } else {
      newExpanded.add(clientId)
    }
    setExpandedClients(newExpanded)
  }


  // Group use cases by client for client view
  const useCasesByClient = useMemo(() => {
    const grouped = new Map<string, UseCase[]>()
    data.clients.forEach((client) => {
      const clientUseCases = filteredAndSortedUseCases
        .filter((uc) => uc.clientId === client.id)
        .sort((a, b) => a.useCaseId.localeCompare(b.useCaseId))
      grouped.set(client.id, clientUseCases)
    })
    return grouped
  }, [filteredAndSortedUseCases, data.clients])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Clients & Use Cases</h2>
          <p className="text-muted-foreground">
            Manage clients and their use cases
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={isClientDialogOpen}
            onOpenChange={(open) => {
              setIsClientDialogOpen(open)
              if (!open) {
                setEditingClient(null)
                setClientFormData({ name: "", description: "", systems: "" })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "Edit Client" : "Add Client"}
                </DialogTitle>
                <DialogDescription>
                  {editingClient
                    ? "Update client information"
                    : "Add a new client"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleClientSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Name</Label>
                  <Input
                    id="client-name"
                    value={clientFormData.name}
                    onChange={(e) =>
                      setClientFormData({
                        ...clientFormData,
                        name: e.target.value
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-description">Description</Label>
                  <Textarea
                    id="client-description"
                    value={clientFormData.description}
                    onChange={(e) =>
                      setClientFormData({
                        ...clientFormData,
                        description: e.target.value
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-systems">
                    Systems (comma-separated)
                  </Label>
                  <Input
                    id="client-systems"
                    value={clientFormData.systems}
                    onChange={(e) =>
                      setClientFormData({
                        ...clientFormData,
                        systems: e.target.value
                      })
                    }
                    placeholder="Murex, Alchemy, Calypso"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingClient ? "Update" : "Add"} Client
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog
            open={isUseCaseDialogOpen}
            onOpenChange={(open) => {
              setIsUseCaseDialogOpen(open)
              if (!open) {
                setEditingUseCase(null)
                setUseCaseFormData({
                  clientId: "",
                  useCaseId: "",
                  title: "",
                  description: "",
                  keyAcceptanceCriteria: "",
                  complexity: "medium",
                  gap: "moderate-extension" as GapLevel,
                  sdkGaps: "",
                  status: "high-level definition",
                  priority: "medium" as Priority,
                  startDate: "",
                  assignedDeveloperIds: []
                })
                setUseCaseTasks([])
                setEditingTask(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Use Case
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUseCase ? "Edit Use Case" : "Add Use Case"}
                </DialogTitle>
                <DialogDescription>
                  {editingUseCase
                    ? "Update use case information"
                    : "Add a new use case"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUseCaseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usecase-client">Client</Label>
                    <Select
                      value={useCaseFormData.clientId}
                      onValueChange={(value) =>
                        setUseCaseFormData({
                          ...useCaseFormData,
                          clientId: value
                        })
                      }
                      required
                    >
                      <SelectTrigger id="usecase-client">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usecase-id">Use Case ID</Label>
                    <Input
                      id="usecase-id"
                      value={useCaseFormData.useCaseId}
                      onChange={(e) =>
                        setUseCaseFormData({
                          ...useCaseFormData,
                          useCaseId: e.target.value
                        })
                      }
                      placeholder="US-1"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usecase-title">Title</Label>
                  <Input
                    id="usecase-title"
                    value={useCaseFormData.title}
                    onChange={(e) =>
                      setUseCaseFormData({
                        ...useCaseFormData,
                        title: e.target.value
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usecase-description">Description</Label>
                  <Textarea
                    id="usecase-description"
                    value={useCaseFormData.description}
                    onChange={(e) =>
                      setUseCaseFormData({
                        ...useCaseFormData,
                        description: e.target.value
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usecase-key-acceptance-criteria">Key Acceptance Criteria</Label>
                  <Textarea
                    id="usecase-key-acceptance-criteria"
                    value={useCaseFormData.keyAcceptanceCriteria}
                    onChange={(e) =>
                      setUseCaseFormData({
                        ...useCaseFormData,
                        keyAcceptanceCriteria: e.target.value
                      })
                    }
                    rows={3}
                    placeholder="Enter key acceptance criteria for this use case..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usecase-complexity">Complexity</Label>
                    <Select
                      value={useCaseFormData.complexity}
                      onValueChange={(value: Complexity) =>
                        setUseCaseFormData({
                          ...useCaseFormData,
                          complexity: value
                        })
                      }
                    >
                      <SelectTrigger id="usecase-complexity">
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
                    <Label htmlFor="usecase-gap">Gap</Label>
                    <Select
                      value={useCaseFormData.gap}
                      onValueChange={(value: GapLevel) =>
                        setUseCaseFormData({
                          ...useCaseFormData,
                          gap: value
                        })
                      }
                    >
                      <SelectTrigger id="usecase-gap">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sdk-native">SDK Native</SelectItem>
                        <SelectItem value="minor-extension">Minor Extension</SelectItem>
                        <SelectItem value="moderate-extension">Moderate Extension</SelectItem>
                        <SelectItem value="significant-extension">Significant Extension</SelectItem>
                        <SelectItem value="custom-implementation">Custom Implementation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Effort Calculation Breakdown */}
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <div className="text-sm font-medium">Effort Calculation</div>

                  {/* Formula */}
                  <div className="rounded bg-background p-2 font-mono text-xs">
                    <span className="text-muted-foreground">Formula:</span>{" "}
                    <span className="text-primary">base</span> + (
                    <span className="text-blue-600 dark:text-blue-400">complexity</span> ×{" "}
                    <span className="text-green-600 dark:text-green-400">gap</span> ×{" "}
                    <span className="text-orange-600 dark:text-orange-400">multiplier</span>)
                  </div>

                  {/* Values */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded border bg-background p-2">
                      <div className="text-muted-foreground">Base</div>
                      <div className="font-bold text-primary">
                        {effortConfig.formulaParams[useCaseFormData.complexity].base}
                      </div>
                    </div>
                    <div className="rounded border bg-background p-2">
                      <div className="text-muted-foreground">Complexity Weight</div>
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                        {effortConfig.complexityWeights[useCaseFormData.complexity]}
                        <span className="font-normal text-muted-foreground ml-1">
                          ({complexityLabels[useCaseFormData.complexity]})
                        </span>
                      </div>
                    </div>
                    <div className="rounded border bg-background p-2">
                      <div className="text-muted-foreground">Gap Weight</div>
                      <div className="font-bold text-green-600 dark:text-green-400">
                        {effortConfig.gapWeights[useCaseFormData.gap]}
                        <span className="font-normal text-muted-foreground ml-1">
                          ({gapLevelLabels[useCaseFormData.gap]})
                        </span>
                      </div>
                    </div>
                    <div className="rounded border bg-background p-2">
                      <div className="text-muted-foreground">Multiplier</div>
                      <div className="font-bold text-orange-600 dark:text-orange-400">
                        {effortConfig.formulaParams[useCaseFormData.complexity].multiplier}
                      </div>
                    </div>
                  </div>

                  {/* Calculation Steps */}
                  <div className="rounded border bg-background p-2 space-y-1 text-xs font-mono">
                    {(() => {
                      const base = effortConfig.formulaParams[useCaseFormData.complexity].base
                      const complexityWeight = effortConfig.complexityWeights[useCaseFormData.complexity]
                      const gapWeight = effortConfig.gapWeights[useCaseFormData.gap]
                      const multiplier = effortConfig.formulaParams[useCaseFormData.complexity].multiplier
                      const weightProduct = complexityWeight * gapWeight
                      const scaledProduct = weightProduct * multiplier
                      const total = base + scaledProduct
                      return (
                        <>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-muted-foreground">1.</span>
                            <span className="text-blue-600 dark:text-blue-400">{complexityWeight}</span>
                            <span>×</span>
                            <span className="text-green-600 dark:text-green-400">{gapWeight}</span>
                            <span>=</span>
                            <span className="font-bold">{weightProduct.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-muted-foreground">2.</span>
                            <span>{weightProduct.toFixed(2)}</span>
                            <span>×</span>
                            <span className="text-orange-600 dark:text-orange-400">{multiplier}</span>
                            <span>=</span>
                            <span className="font-bold">{scaledProduct.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-muted-foreground">3.</span>
                            <span className="text-primary">{base}</span>
                            <span>+</span>
                            <span>{scaledProduct.toFixed(2)}</span>
                            <span>=</span>
                            <span className="font-bold text-lg">{total.toFixed(1)}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>

                  {/* Final Result */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Estimated Man-Days</span>
                    <span className="text-2xl font-bold">
                      {calculateEffort(
                        useCaseFormData.complexity,
                        useCaseFormData.gap
                      ).toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usecase-sdk-gaps">SDK Gaps</Label>
                  <Textarea
                    id="usecase-sdk-gaps"
                    value={useCaseFormData.sdkGaps}
                    onChange={(e) =>
                      setUseCaseFormData({
                        ...useCaseFormData,
                        sdkGaps: e.target.value
                      })
                    }
                    rows={3}
                    placeholder="List SDK gaps..."
                  />
                </div>

                {/* Tasks Management Section */}
                <div
                  className="space-y-4 rounded-lg border p-4"
                  onPaste={handlePasteSubtasks}
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Tasks/Subtasks</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Paste multiple lines (Ctrl+V/Cmd+V) to create subtasks
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTask(null)
                        setTaskFormData({
                          title: "",
                          description: "",
                          estimatedHours: 8,
                          assignedDeveloperIds: [],
                          status: "todo",
                          dependencies: []
                        })
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  </div>
                  
                  {useCaseTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No tasks yet. Add tasks to break down the use case work.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {useCaseTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {task.estimatedHours}h • {task.assignedDeveloperIds.length} developer(s)
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingTask(task)
                                setTaskFormData({
                                  title: task.title,
                                  description: task.description || "",
                                  estimatedHours: task.estimatedHours,
                                  assignedDeveloperIds: task.assignedDeveloperIds,
                                  status: task.status,
                                  dependencies: task.dependencies
                                })
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Task Form (shown when adding/editing) */}
                  {editingTask !== null && (
                    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                      <div className="space-y-2">
                        <Label htmlFor="task-title">Task Title</Label>
                        <Input
                          id="task-title"
                          value={taskFormData.title}
                          onChange={(e) =>
                            setTaskFormData({
                              ...taskFormData,
                              title: e.target.value
                            })
                          }
                          placeholder="Enter task title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="task-description">Description</Label>
                        <Textarea
                          id="task-description"
                          value={taskFormData.description}
                          onChange={(e) =>
                            setTaskFormData({
                              ...taskFormData,
                              description: e.target.value
                            })
                          }
                          rows={2}
                          placeholder="Task description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="task-hours">Estimated Hours</Label>
                          <Input
                            id="task-hours"
                            type="number"
                            min="1"
                            value={taskFormData.estimatedHours}
                            onChange={(e) =>
                              setTaskFormData({
                                ...taskFormData,
                                estimatedHours: parseInt(e.target.value) || 8
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="task-status">Status</Label>
                          <Select
                            value={taskFormData.status}
                            onValueChange={(value: Task["status"]) =>
                              setTaskFormData({
                                ...taskFormData,
                                status: value
                              })
                            }
                          >
                            <SelectTrigger id="task-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">Todo</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Assigned Developers</Label>
                        <div className="flex flex-wrap gap-2">
                          {data.developers.map((dev) => (
                            <div
                              key={dev.id}
                              className="flex items-center space-x-2 rounded-lg border p-2"
                            >
                              <input
                                type="checkbox"
                                id={`dev-${dev.id}`}
                                checked={taskFormData.assignedDeveloperIds.includes(
                                  dev.id
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTaskFormData({
                                      ...taskFormData,
                                      assignedDeveloperIds: [
                                        ...taskFormData.assignedDeveloperIds,
                                        dev.id
                                      ]
                                    })
                                  } else {
                                    setTaskFormData({
                                      ...taskFormData,
                                      assignedDeveloperIds:
                                        taskFormData.assignedDeveloperIds.filter(
                                          (id) => id !== dev.id
                                        )
                                    })
                                  }
                                }}
                                className="rounded"
                              />
                              <Label
                                htmlFor={`dev-${dev.id}`}
                                className="cursor-pointer text-sm"
                              >
                                {dev.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleAddTask}
                          disabled={!taskFormData.title}
                          className="flex-1"
                        >
                          {editingTask ? "Update" : "Add"} Task
                        </Button>
                        {editingTask && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingTask(null)
                              setTaskFormData({
                                title: "",
                                description: "",
                                estimatedHours: 8,
                                assignedDeveloperIds: [],
                                status: "todo",
                                dependencies: []
                              })
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usecase-status">Status</Label>
                    <Select
                      value={useCaseFormData.status}
                      onValueChange={(value: UseCaseStatus) =>
                        setUseCaseFormData({
                          ...useCaseFormData,
                          status: value
                        })
                      }
                    >
                      <SelectTrigger id="usecase-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high-level definition">
                          High-level Definition
                        </SelectItem>
                        <SelectItem value="groomed">Groomed</SelectItem>
                        <SelectItem value="defined">Defined</SelectItem>
                        <SelectItem value="in development">
                          In Development
                        </SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usecase-priority">Priority</Label>
                    <Select
                      value={useCaseFormData.priority}
                      onValueChange={(value: Priority) =>
                        setUseCaseFormData({
                          ...useCaseFormData,
                          priority: value
                        })
                      }
                    >
                      <SelectTrigger id="usecase-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assigned Developers</Label>
                  <div className="flex flex-wrap gap-2">
                    {data.developers.map((dev) => (
                      <div
                        key={dev.id}
                        className="flex items-center space-x-2 rounded-lg border p-2"
                      >
                        <input
                          type="checkbox"
                          id={`usecase-dev-${dev.id}`}
                          checked={(useCaseFormData.assignedDeveloperIds || []).includes(
                            dev.id
                          )}
                          onChange={(e) => {
                            const currentIds = useCaseFormData.assignedDeveloperIds || []
                            if (e.target.checked) {
                              setUseCaseFormData({
                                ...useCaseFormData,
                                assignedDeveloperIds: [...currentIds, dev.id]
                              })
                            } else {
                              setUseCaseFormData({
                                ...useCaseFormData,
                                assignedDeveloperIds: currentIds.filter(
                                  (id) => id !== dev.id
                                )
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <Label
                          htmlFor={`usecase-dev-${dev.id}`}
                          className="cursor-pointer text-sm"
                        >
                          {dev.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usecase-start-date">Start Date (optional)</Label>
                  <Input
                    id="usecase-start-date"
                    type="date"
                    value={useCaseFormData.startDate}
                    onChange={(e) =>
                      setUseCaseFormData({
                        ...useCaseFormData,
                        startDate: e.target.value
                      })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingUseCase ? "Update" : "Add"} Use Case
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
        <ViewFormatToggle
          displayFormat={displayFormat}
          setDisplayFormat={setDisplayFormat}
        />
        {displayFormat === "table" && (
          <ColumnSettings
            columns={columnSettings.columns}
            onToggle={columnSettings.toggleColumn}
          />
        )}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search use cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: UseCaseStatus | "all") =>
            setStatusFilter(value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="high-level definition">
              High-level Definition
            </SelectItem>
            <SelectItem value="groomed">Groomed</SelectItem>
            <SelectItem value="defined">Defined</SelectItem>
            <SelectItem value="in development">In Development</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {displayFormat === "table" ? (
        <UseCaseTable
          data={data}
          filteredAndSortedUseCases={filteredAndSortedUseCases}
          viewMode={viewMode}
          useCasesByClient={viewMode === "client" ? useCasesByClient : undefined}
          onStatusUpdate={handleStatusUpdate}
          onTaskUpdate={handleTaskUpdate}
          onTaskAdd={handleTaskAdd}
          onTaskDelete={handleTaskDelete}
          columns={columnSettings.columns}
          onEdit={(useCase) => {
            setEditingUseCase(useCase)
            setUseCaseFormData({
              clientId: useCase.clientId,
              useCaseId: useCase.useCaseId,
              title: useCase.title,
              description: useCase.description || "",
              keyAcceptanceCriteria: useCase.keyAcceptanceCriteria || "",
              complexity: useCase.complexity,
              gap: useCase.gap,
              sdkGaps: useCase.sdkGaps || "",
              status: useCase.status,
              priority: useCase.priority,
              // Ensure date is in YYYY-MM-DD format for HTML date input
              startDate: useCase.startDate ? useCase.startDate.split("T")[0] : "",
              assignedDeveloperIds: useCase.assignedDeveloperIds || []
            })
            // Load tasks for this use case
            const useCaseTasks = data.tasks.filter(
              (t) => t.useCaseId === useCase.id
            )
            setUseCaseTasks(useCaseTasks)
            setIsUseCaseDialogOpen(true)
          }}
          onDelete={handleDeleteUseCase}
        />
      ) : viewMode === "client" ? (
        <div className="space-y-4">
          {data.clients.map((client) => {
            const clientUseCases = useCasesByClient.get(client.id) || []
            const isExpanded = expandedClients.has(client.id)

            return (
              <Card key={client.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleClientExpansion(client.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>{client.name}</CardTitle>
                        {client.description && (
                          <p className="text-sm text-muted-foreground">
                            {client.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {clientUseCases.length} use cases
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingClient(client)
                          setClientFormData({
                            name: client.name,
                            description: client.description || "",
                            systems: client.systems?.join(", ") || ""
                          })
                          setIsClientDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    {clientUseCases.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No use cases yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {clientUseCases.map((useCase) => (
                          <UseCaseCard
                            key={useCase.id}
                            useCase={useCase}
                            client={client}
                            timelinesByUseCaseId={timelinesByUseCaseId}
                            onEdit={() => {
                              setEditingUseCase(useCase)
                              setUseCaseFormData({
                                clientId: useCase.clientId,
                                useCaseId: useCase.useCaseId,
                                title: useCase.title,
                                description: useCase.description || "",
                                keyAcceptanceCriteria: useCase.keyAcceptanceCriteria || "",
                                complexity: useCase.complexity,
                                gap: useCase.gap,
                                sdkGaps: useCase.sdkGaps || "",
                                status: useCase.status,
                                priority: useCase.priority,
                                // Ensure date is in YYYY-MM-DD format for HTML date input
                                startDate: useCase.startDate ? useCase.startDate.split("T")[0] : "",
                                assignedDeveloperIds: useCase.assignedDeveloperIds || []
                              })
                              // Load tasks for this use case
                              const useCaseTasks = data.tasks.filter(
                                (t) => t.useCaseId === useCase.id
                              )
                              setUseCaseTasks(useCaseTasks)
                              setIsUseCaseDialogOpen(true)
                            }}
                            onDelete={() => handleDeleteUseCase(useCase.id)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredAndSortedUseCases.map((useCase, index) => {
              const client = data.clients.find(
                (c) => c.id === useCase.clientId
              )
              return (
                <motion.div
                  key={useCase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <UseCaseCard
                    useCase={useCase}
                    client={client}
                    timelinesByUseCaseId={timelinesByUseCaseId}
                    onEdit={() => {
                      setEditingUseCase(useCase)
                      setUseCaseFormData({
                        clientId: useCase.clientId,
                        useCaseId: useCase.useCaseId,
                        title: useCase.title,
                        description: useCase.description || "",
                        keyAcceptanceCriteria: useCase.keyAcceptanceCriteria || "",
                        complexity: useCase.complexity,
                        gap: useCase.gap,
                        sdkGaps: useCase.sdkGaps || "",
                        status: useCase.status,
                        priority: useCase.priority,
                        // Ensure date is in YYYY-MM-DD format for HTML date input
                        startDate: useCase.startDate ? useCase.startDate.split("T")[0] : "",
                        assignedDeveloperIds: useCase.assignedDeveloperIds || []
                      })
                      // Load tasks for this use case
                      const useCaseTasks = data.tasks.filter(
                        (t) => t.useCaseId === useCase.id
                      )
                      setUseCaseTasks(useCaseTasks)
                      setIsUseCaseDialogOpen(true)
                    }}
                    onDelete={() => handleDeleteUseCase(useCase.id)}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// Use Case Card Component
function UseCaseCard({
  useCase,
  client,
  onEdit,
  onDelete,
  timelinesByUseCaseId
}: {
  useCase: UseCase
  client?: Client
  onEdit: () => void
  onDelete: () => void
  timelinesByUseCaseId: Map<string, UseCaseTimeline>
}) {
  const statusColors = {
    "high-level definition": "bg-gray-500",
    groomed: "bg-blue-500",
    defined: "bg-yellow-500",
    "in development": "bg-orange-500",
    completed: "bg-green-500"
  }

  const complexityColors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {useCase.useCaseId}
              </Badge>
              <div
                className={`h-2 w-2 rounded-full ${statusColors[useCase.status]}`}
              />
            </div>
            <CardTitle className="text-lg">{useCase.title}</CardTitle>
            {client && (
              <p className="text-sm text-muted-foreground mt-1">
                {client.name}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {useCase.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {useCase.description}
          </p>
        )}
        {useCase.keyAcceptanceCriteria && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Key Acceptance Criteria:</p>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {useCase.keyAcceptanceCriteria}
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Badge className={complexityColors[useCase.complexity]}>
            {useCase.complexity}
          </Badge>
          <Badge variant="outline">
            Gap:{" "}
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
          {(() => {
            const timeline = timelinesByUseCaseId.get(useCase.id)
            if (timeline) {
              return (
                <Badge variant="outline">
                  {timeline.duration.toFixed(1)} working days
                </Badge>
              )
            }
            return (
              <Badge variant="outline">
                {useCase.manDays.toFixed(1)} man-days
              </Badge>
            )
          })()}
          <Badge variant="secondary" className="capitalize">
            Priority: {useCase.priority}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          <div>Status: {useCase.status}</div>
          {useCase.startDate && (
            <div>Start: {new Date(useCase.startDate).toLocaleDateString()}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

