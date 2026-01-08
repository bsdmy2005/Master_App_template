"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { calculateTimelines } from "@/lib/timeline-calculator"
import type { PlanningData } from "@/types/planning-types"
import { TrendingUp, Users, Building2, Calendar } from "lucide-react"

interface AggregateViewProps {
  data: PlanningData
}

export function AggregateView({ data }: AggregateViewProps) {
  // Calculate timelines for dynamic mandaya
  const timelineResult = useMemo(() => calculateTimelines(data), [data])
  const timelinesByUseCaseId = useMemo(() => {
    const map = new Map<string, typeof timelineResult.timelines[0]>()
    for (const timeline of timelineResult.timelines) {
      map.set(timeline.useCaseId, timeline)
    }
    return map
  }, [timelineResult.timelines])

  // Calculate total duration (working days) for use cases with timelines
  const totalDuration = data.useCases.reduce((sum, uc) => {
    const timeline = timelinesByUseCaseId.get(uc.id)
    // Use duration (working days) if timeline exists, otherwise use initial mandays
    return sum + (timeline?.duration ?? uc.manDays)
  }, 0)
  
  // Also calculate total initial mandays for reference
  const totalInitialManDays = data.useCases.reduce((sum, uc) => sum + uc.manDays, 0)
  const totalUseCases = data.useCases.length
  const totalClients = data.clients.length
  const totalDevelopers = data.developers.length

  const byComplexity = {
    low: data.useCases.filter((uc) => uc.complexity === "low").length,
    medium: data.useCases.filter((uc) => uc.complexity === "medium").length,
    high: data.useCases.filter((uc) => uc.complexity === "high").length
  }

  const byStatus = {
    "high-level definition": data.useCases.filter(
      (uc) => uc.status === "high-level definition"
    ).length,
    groomed: data.useCases.filter((uc) => uc.status === "groomed").length,
    defined: data.useCases.filter((uc) => uc.status === "defined").length,
    "in development": data.useCases.filter(
      (uc) => uc.status === "in development"
    ).length,
    completed: data.useCases.filter((uc) => uc.status === "completed").length
  }

  const byClient = data.clients.map((client) => {
    const clientUseCases = data.useCases.filter((uc) => uc.clientId === client.id)
    const duration = clientUseCases.reduce((sum, uc) => {
      const timeline = timelinesByUseCaseId.get(uc.id)
      return sum + (timeline?.duration ?? uc.manDays)
    }, 0)
    const initialManDays = clientUseCases.reduce((sum, uc) => sum + uc.manDays, 0)
    
    return {
      name: client.name,
      count: clientUseCases.length,
      duration,
      initialManDays
    }
  })

  const stats = [
    {
      title: "Total Duration",
      value: totalDuration.toFixed(1),
      icon: Calendar,
      description: `${totalDuration.toFixed(1)} working days (Initial: ${totalInitialManDays.toFixed(1)} man-days)`
    },
    {
      title: "Use Cases",
      value: totalUseCases,
      icon: Building2,
      description: "Total use cases"
    },
    {
      title: "Clients",
      value: totalClients,
      icon: Users,
      description: "Active clients"
    },
    {
      title: "Developers",
      value: totalDevelopers,
      icon: TrendingUp,
      description: "In repository"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Project management dashboard summary
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By Complexity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Low</span>
              <Badge variant="outline">{byComplexity.low}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Medium</span>
              <Badge variant="outline">{byComplexity.medium}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>High</span>
              <Badge variant="outline">{byComplexity.high}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="capitalize">{status}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By Client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {byClient.map((client) => (
              <div key={client.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{client.name}</span>
                  <div className="flex flex-col gap-1 items-end">
                    <div className="flex gap-2">
                      <Badge variant="outline">{client.count} use cases</Badge>
                      <Badge variant="secondary">
                        {client.duration.toFixed(1)} working days
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Initial: {client.initialManDays.toFixed(1)} man-days
                    </div>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(client.duration / totalDuration) * 100}%`
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

