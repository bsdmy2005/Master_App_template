"use client"

import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  GanttChartSquare,
  TrendingUp,
  GitBranch,
  Settings,
  BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ViewType =
  | "overview"
  | "developers"
  | "clients"
  | "dependencies"
  | "timeline"
  | "gantt"
  | "planning"
  | "settings"
  | "guide"

interface DashboardSidebarProps {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
}

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "developers", label: "Developers", icon: Users },
  { id: "clients", label: "Clients & Use Cases", icon: Building2 },
  { id: "dependencies", label: "Dependencies", icon: GitBranch },
  { id: "timeline", label: "Timeline", icon: Calendar },
  { id: "gantt", label: "Gantt Chart", icon: GanttChartSquare },
  { id: "planning", label: "Planning", icon: TrendingUp },
  { id: "settings", label: "Effort Config", icon: Settings },
  { id: "guide", label: "Estimation Guide", icon: BookOpen }
] as const

export function DashboardSidebar({
  currentView,
  setCurrentView
}: DashboardSidebarProps) {
  return (
    <aside className="w-64 border-r bg-muted/30">
      <div className="flex h-full flex-col p-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold">Black Glass</h1>
          <p className="text-sm text-muted-foreground">Use Case Manager</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-primary/10 text-primary"
                )}
                onClick={() => setCurrentView(item.id as ViewType)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

