"use client"

import { Button } from "@/components/ui/button"
import { Building2, List, ArrowUpDown, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

type ViewMode = "client" | "usecase" | "priority" | "startdate"

interface ViewSwitcherProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

export function ViewSwitcher({ viewMode, setViewMode }: ViewSwitcherProps) {
  const views = [
    { id: "client" as ViewMode, label: "Client View", icon: Building2 },
    { id: "usecase" as ViewMode, label: "Use Case View", icon: List },
    { id: "priority" as ViewMode, label: "Priority View", icon: ArrowUpDown },
    { id: "startdate" as ViewMode, label: "Start Date View", icon: Calendar }
  ]

  return (
    <div className="flex gap-2 rounded-lg border bg-muted/30 p-1">
      {views.map((view) => {
        const Icon = view.icon
        const isActive = viewMode === view.id
        return (
          <Button
            key={view.id}
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "flex-1 gap-2",
              isActive && "bg-background shadow-sm"
            )}
            onClick={() => setViewMode(view.id)}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{view.label}</span>
          </Button>
        )
      })}
    </div>
  )
}

