"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit } from "lucide-react"
import type { Task, TaskStatus } from "@/types/planning-types"

interface SubtaskTableProps {
  tasks: Task[]
  useCaseId: string
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskAdd: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void
  onTaskDelete: (taskId: string) => void
}

type EditingCell = {
  taskId: string
  field: "title" | "description" | "status"
} | null

export function SubtaskTable({
  tasks,
  useCaseId,
  onTaskUpdate,
  onTaskAdd,
  onTaskDelete
}: SubtaskTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [editingValue, setEditingValue] = useState<string>("")
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newTask, setNewTask] = useState<{
    title: string
    description: string
    status: TaskStatus
  }>({
    title: "",
    description: "",
    status: "todo"
  })

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select()
      }
    }
  }, [editingCell])

  const handleCellClick = (
    taskId: string,
    field: "title" | "description" | "status",
    currentValue: string
  ) => {
    setEditingCell({ taskId, field })
    setEditingValue(currentValue)
  }

  const handleSave = (taskId: string) => {
    if (!editingCell) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const updates: Partial<Task> = {}
    if (editingCell.field === "title") {
      updates.title = editingValue.trim()
    } else if (editingCell.field === "description") {
      updates.description = editingValue.trim() || undefined
    } else if (editingCell.field === "status") {
      updates.status = editingValue as TaskStatus
    }

    onTaskUpdate(taskId, updates)
    setEditingCell(null)
    setEditingValue("")
  }

  const handleCancel = () => {
    setEditingCell(null)
    setEditingValue("")
  }

  const handleKeyDown = (
    e: React.KeyboardEvent,
    taskId: string
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave(taskId)
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleAddNewTask = () => {
    if (!newTask.title.trim()) {
      setIsAddingNew(false)
      setNewTask({ title: "", description: "", status: "todo" })
      return
    }

    const now = new Date().toISOString()
    onTaskAdd({
      useCaseId,
      title: newTask.title.trim(),
      description: newTask.description.trim() || undefined,
      estimatedHours: 8, // Default value, not displayed
      assignedDeveloperIds: [], // Developers assigned to use case, not subtask
      status: newTask.status,
      dependencies: []
    })

    setIsAddingNew(false)
    setNewTask({ title: "", description: "", status: "todo" })
  }

  const handleDeleteNewTask = () => {
    setIsAddingNew(false)
    setNewTask({ title: "", description: "", status: "todo" })
  }

  const statusColors = {
    todo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-full"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Row
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 && !isAddingNew ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-4">
                No subtasks yet. Click "Add Row" to create one.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => {
            const isEditingTitle =
              editingCell?.taskId === task.id && editingCell.field === "title"
            const isEditingDescription =
              editingCell?.taskId === task.id &&
              editingCell.field === "description"
            const isEditingStatus =
              editingCell?.taskId === task.id && editingCell.field === "status"

            return (
              <TableRow key={task.id}>
                <TableCell
                  className="cursor-pointer"
                  onClick={() =>
                    !isEditingTitle &&
                    handleCellClick(task.id, "title", task.title)
                  }
                >
                  {isEditingTitle ? (
                    <Input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleSave(task.id)}
                      onKeyDown={(e) => handleKeyDown(e, task.id)}
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="font-medium text-sm">{task.title}</div>
                  )}
                </TableCell>
                <TableCell
                  className="cursor-pointer"
                  onClick={() =>
                    !isEditingDescription &&
                    handleCellClick(
                      task.id,
                      "description",
                      task.description || ""
                    )
                  }
                >
                  {isEditingDescription ? (
                    <Textarea
                      ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleSave(task.id)}
                      onKeyDown={(e) => handleKeyDown(e, task.id)}
                      className="min-h-[60px] resize-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {task.description || (
                        <span className="italic text-muted-foreground/50">
                          Click to add description
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell
                  className="cursor-pointer"
                  onClick={() =>
                    !isEditingStatus &&
                    handleCellClick(task.id, "status", task.status)
                  }
                >
                  {isEditingStatus ? (
                    <Select
                      value={editingValue}
                      onValueChange={(value) => {
                        setEditingValue(value)
                        onTaskUpdate(task.id, { status: value as TaskStatus })
                        setEditingCell(null)
                        setEditingValue("")
                      }}
                      onOpenChange={(open) => {
                        if (!open && editingCell?.taskId === task.id) {
                          setEditingCell(null)
                          setEditingValue("")
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">Todo</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      className={statusColors[task.status]}
                      variant="outline"
                    >
                      {task.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onTaskDelete(task.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          }))}
          {isAddingNew && (
            <TableRow className="bg-muted/30">
              <TableCell>
                <Input
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  onBlur={handleAddNewTask}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleAddNewTask()
                    } else if (e.key === "Escape") {
                      e.preventDefault()
                      handleDeleteNewTask()
                    }
                  }}
                  placeholder="Task title"
                  className="h-8"
                  autoFocus
                />
              </TableCell>
              <TableCell>
                <Textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  onBlur={handleAddNewTask}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && e.ctrlKey) {
                      e.preventDefault()
                      handleAddNewTask()
                    } else if (e.key === "Escape") {
                      e.preventDefault()
                      handleDeleteNewTask()
                    }
                  }}
                  placeholder="Description (optional)"
                  className="min-h-[60px] resize-none"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={newTask.status}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, status: value as TaskStatus })
                  }
                >
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleAddNewTask}
                    disabled={!newTask.title.trim()}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleDeleteNewTask}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

