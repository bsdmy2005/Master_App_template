"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DashboardSidebar } from "./_components/dashboard-sidebar"
import { AggregateView } from "./_components/aggregate-view"
import { DeveloperRepository } from "./_components/developer-repository"
import { ClientManagement } from "./_components/client-management"
import { DependencyManagement } from "./_components/dependency-management"
import { TimelineView } from "./_components/timeline-view"
import { GanttChartModern } from "./_components/gantt-chart-modern"
import { DeveloperPlanning } from "./_components/developer-planning"
import { EffortConfig } from "./_components/effort-config"
import { EffortConfigProvider } from "@/lib/effort-config-context"
import type { PlanningData } from "@/types/planning-types"
import { readPlanningDataWithFallback, writePlanningDataWithFallback } from "@/lib/storage-db"
import { readPlanningData } from "@/lib/storage"
import { parsePlanSummary } from "@/lib/seed-data"
import { checkDatabaseAvailableAction } from "@/actions/db/db-actions"
import { readPlanningDataAction, writePlanningDataAction } from "@/actions/db/planning-data-actions"

type ViewType =
  | "overview"
  | "developers"
  | "clients"
  | "dependencies"
  | "timeline"
  | "gantt"
  | "planning"
  | "settings"

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<ViewType>("overview")
  const [data, setData] = useState<PlanningData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        let planningData: PlanningData | null = null

        // Try to load from database first
        const dbAvailable = await checkDatabaseAvailableAction()
        if (dbAvailable) {
          const dbResult = await readPlanningDataAction()
          if (dbResult.isSuccess && dbResult.data) {
            planningData = dbResult.data
          }
        }

        // If no database data, try file system
        if (!planningData) {
          planningData = await readPlanningData()
          
          // If file system has data and database is available, migrate it
          if (planningData && dbAvailable) {
            const migrateResult = await writePlanningDataAction(planningData)
            if (migrateResult.isSuccess) {
              console.log("Data migrated from file system to database")
            }
          }
        }

        // If still no data exists, seed from markdown
        if (!planningData || planningData.clients.length === 0) {
          planningData = await parsePlanSummary()
          // Write seeded data (to database if available, otherwise file system)
          await writePlanningDataWithFallback(planningData)
        }

        setData(planningData)
      } catch (error) {
        console.error("Error loading planning data:", error)
        // Fallback to file system
        let planningData = await readPlanningData()
        if (!planningData || planningData.clients.length === 0) {
          planningData = await parsePlanSummary()
          const { writePlanningData } = await import("@/lib/storage")
          await writePlanningData(planningData)
        }
        setData(planningData)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No data found</p>
        </div>
      </div>
    )
  }

  return (
    <EffortConfigProvider>
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar currentView={currentView} setCurrentView={setCurrentView} />
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full p-6"
          >
            {currentView === "overview" && data && <AggregateView data={data} />}
            {currentView === "developers" && data && (
              <DeveloperRepository data={data} setData={setData} />
            )}
            {currentView === "clients" && data && (
              <ClientManagement data={data} setData={setData} />
            )}
            {currentView === "dependencies" && data && (
              <DependencyManagement data={data} setData={setData} />
            )}
            {currentView === "timeline" && data && <TimelineView data={data} />}
            {currentView === "gantt" && data && <GanttChartModern data={data} />}
            {currentView === "planning" && data && (
              <DeveloperPlanning data={data} setData={setData} />
            )}
            {currentView === "settings" && data && (
              <EffortConfig data={data} setData={setData} />
            )}
          </motion.div>
        </main>
      </div>
    </EffortConfigProvider>
  )
}

