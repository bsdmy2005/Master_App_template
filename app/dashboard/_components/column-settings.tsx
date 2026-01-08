"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Settings2 } from "lucide-react"

export interface ColumnConfig {
  id: string
  label: string
  visible: boolean
  order: number
  wrapText?: boolean
}

const DEFAULT_COLUMNS: Omit<ColumnConfig, "visible">[] = [
  { id: "expand", label: "", order: 0 },
  { id: "id", label: "ID", order: 1 },
  { id: "title", label: "Title", order: 2 },
  { id: "client", label: "Client", order: 3 },
  { id: "description", label: "Description", order: 4 },
  { id: "keyAcceptanceCriteria", label: "Key Acceptance Criteria", order: 5 },
  { id: "complexity", label: "Complexity", order: 6 },
  { id: "gap", label: "Gap", order: 7 },
  { id: "manDays", label: "Man-Days", order: 8 },
  { id: "status", label: "Status", order: 9 },
  { id: "priority", label: "Priority", order: 10 },
  { id: "startDate", label: "Start Date", order: 11 },
  { id: "developers", label: "Developers", order: 12 },
  { id: "sdkGaps", label: "SDK Gaps", order: 13 },
  { id: "actions", label: "Actions", order: 14 }
]

const STORAGE_KEY = "useCaseTableColumns"

export function useColumnSettings() {
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_COLUMNS.map((col) => ({
        ...col,
        visible: col.id !== "sdkGaps" // Hide SDK Gaps by default
      }))
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ColumnConfig[]
        // Merge with defaults to handle new columns
        const merged = DEFAULT_COLUMNS.map((defaultCol) => {
          const storedCol = parsed.find((c) => c.id === defaultCol.id)
          return {
            ...defaultCol,
            visible: 
              defaultCol.id === "expand" || defaultCol.id === "actions"
                ? true // Always show expand and actions
                : storedCol?.visible ?? defaultCol.id !== "sdkGaps",
            order: storedCol?.order ?? defaultCol.order
          }
        })
        return merged.sort((a, b) => a.order - b.order)
      }
    } catch (error) {
      console.error("Failed to load column settings:", error)
    }

    return DEFAULT_COLUMNS.map((col) => ({
      ...col,
      visible: col.id !== "sdkGaps" && col.id !== "keyAcceptanceCriteria", // Hide SDK Gaps and Key Acceptance Criteria by default
      // Always show expand and actions columns
      ...(col.id === "expand" || col.id === "actions" ? { visible: true } : {})
    }))
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(columns))
      } catch (error) {
        console.error("Failed to save column settings:", error)
      }
    }
  }, [columns])

  const toggleColumn = (columnId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    )
  }

  const updateColumnOrder = (columnId: string, newOrder: number) => {
    setColumns((prev) => {
      const updated = prev.map((col) => {
        if (col.id === columnId) {
          return { ...col, order: newOrder }
        }
        // Adjust other columns' orders if needed
        if (col.order >= newOrder && col.id !== columnId) {
          return { ...col, order: col.order + 1 }
        }
        return col
      })
      return updated.sort((a, b) => a.order - b.order)
    })
  }

  return {
    columns,
    toggleColumn,
    updateColumnOrder,
    setColumns
  }
}

interface ColumnSettingsProps {
  columns: ColumnConfig[]
  onToggle: (columnId: string) => void
}

export function ColumnSettings({ columns, onToggle }: ColumnSettingsProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Columns
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Column Settings</DialogTitle>
          <DialogDescription>
            Show or hide columns in the table view
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {columns
            .filter((col) => col.id !== "expand" && col.id !== "actions")
            .map((column) => (
              <div
                key={column.id}
                className="flex items-center space-x-2 rounded-lg border p-3"
              >
                <Checkbox
                  id={`column-${column.id}`}
                  checked={column.visible}
                  onCheckedChange={() => onToggle(column.id)}
                />
                <Label
                  htmlFor={`column-${column.id}`}
                  className="cursor-pointer flex-1"
                >
                  {column.label || column.id}
                </Label>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

