"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Plus, Trash2, ArrowRight, GitBranch } from "lucide-react"
import type {
  PlanningData,
  UseCaseDependency,
  UseCaseDependencyType
} from "@/types/planning-types"
import { writePlanningDataWithFallback } from "@/lib/storage-db"
import { toast } from "sonner"

interface DependencyManagementProps {
  data: PlanningData
  setData: (data: PlanningData) => void
}

const dependencyTypeLabels: Record<UseCaseDependencyType, string> = {
  blocks: "Blocks",
  "covered-by": "Covered By",
  "depends-on": "Depends On",
  "related-to": "Related To"
}

const dependencyTypeColors: Record<UseCaseDependencyType, string> = {
  blocks: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "covered-by": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "depends-on": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "related-to": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
}

export function DependencyManagement({
  data,
  setData
}: DependencyManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>("all")
  const [fromUseCaseId, setFromUseCaseId] = useState("")
  const [toUseCaseId, setToUseCaseId] = useState("")
  const [dependencyType, setDependencyType] =
    useState<UseCaseDependencyType>("depends-on")

  const handleAddDependency = async () => {
    if (!fromUseCaseId || !toUseCaseId || fromUseCaseId === toUseCaseId) {
      toast.error("Please select two different use cases")
      return
    }

    // Check if dependency already exists
    const exists = data.dependencies.some(
      (dep) =>
        dep.fromUseCaseId === fromUseCaseId &&
        dep.toUseCaseId === toUseCaseId
    )

    if (exists) {
      toast.error("This dependency already exists")
      return
    }

    const newDependency: UseCaseDependency = {
      fromUseCaseId,
      toUseCaseId,
      type: dependencyType
    }

    const updatedData: PlanningData = {
      ...data,
      dependencies: [...data.dependencies, newDependency]
    }

    const result = await writePlanningDataWithFallback(updatedData)
    if (result.success) {
      setData(updatedData)
      setIsDialogOpen(false)
      setFromUseCaseId("")
      setToUseCaseId("")
      setDependencyType("depends-on")
      toast.success("Dependency added successfully")
    } else {
      toast.error("Failed to add dependency")
    }
  }

  const handleDeleteDependency = async (index: number) => {
    const updatedDependencies = data.dependencies.filter((_, i) => i !== index)
    const updatedData: PlanningData = {
      ...data,
      dependencies: updatedDependencies
    }

    const result = await writePlanningDataWithFallback(updatedData)
    if (result.success) {
      setData(updatedData)
      toast.success("Dependency removed successfully")
    } else {
      toast.error("Failed to remove dependency")
    }
  }

  const getUseCaseById = (id: string) => {
    return data.useCases.find((uc) => uc.id === id)
  }

  const getClientById = (id: string) => {
    return data.clients.find((c) => c.id === id)
  }

  // Filter dependencies based on selected client
  const filteredDependencies = selectedClientId && selectedClientId !== "all"
    ? data.dependencies.filter((dep) => {
        const fromUC = getUseCaseById(dep.fromUseCaseId)
        const toUC = getUseCaseById(dep.toUseCaseId)
        return (
          fromUC?.clientId === selectedClientId ||
          toUC?.clientId === selectedClientId
        )
      })
    : data.dependencies

  // Get use cases for dropdowns (filtered by selected client if set)
  const availableUseCases = selectedClientId && selectedClientId !== "all"
    ? data.useCases.filter((uc) => uc.clientId === selectedClientId)
    : data.useCases

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Dependency Management</h2>
          <p className="text-muted-foreground">
            Manage relationships between use cases
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="space-y-2 flex-1 max-w-xs">
          <label className="text-sm font-medium">Filter by Client</label>
          <Select
            value={selectedClientId}
            onValueChange={setSelectedClientId}
          >
            <SelectTrigger>
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {data.clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Dependency
            </Button>
          </DialogTrigger>
          <DialogContent>
          <DialogHeader>
              <DialogTitle>Add Use Case Dependency</DialogTitle>
              <DialogDescription>
                Define a relationship between two use cases
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Use Case</label>
                <Select value={fromUseCaseId} onValueChange={setFromUseCaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source use case" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUseCases.map((uc) => {
                      const client = getClientById(uc.clientId)
                      return (
                        <SelectItem key={uc.id} value={uc.id}>
                          {uc.useCaseId}: {uc.title} ({client?.name || "Unknown"})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Relationship Type</label>
                <Select
                  value={dependencyType}
                  onValueChange={(value: UseCaseDependencyType) =>
                    setDependencyType(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blocks">Blocks</SelectItem>
                    <SelectItem value="covered-by">Covered By</SelectItem>
                    <SelectItem value="depends-on">Depends On</SelectItem>
                    <SelectItem value="related-to">Related To</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To Use Case</label>
                <Select value={toUseCaseId} onValueChange={setToUseCaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target use case" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUseCases
                      .filter((uc) => uc.id !== fromUseCaseId)
                      .map((uc) => {
                        const client = getClientById(uc.clientId)
                        return (
                          <SelectItem key={uc.id} value={uc.id}>
                            {uc.useCaseId}: {uc.title} ({client?.name || "Unknown"})
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddDependency} className="w-full">
                Add Dependency
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filteredDependencies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No dependencies defined yet. Add dependencies to show relationships
              between use cases.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDependencies.map((dependency, index) => {
            const fromUseCase = getUseCaseById(dependency.fromUseCaseId)
            const toUseCase = getUseCaseById(dependency.toUseCaseId)

            if (!fromUseCase || !toUseCase) return null

            const fromClient = getClientById(fromUseCase.clientId)
            const toClient = getClientById(toUseCase.clientId)

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="font-medium">
                          {fromUseCase.useCaseId}: {fromUseCase.title}
                        </div>
                        <div className="text-sm font-semibold text-primary">
                          {fromClient?.name || "Unknown Client"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={dependencyTypeColors[dependency.type]}
                        >
                          {dependencyTypeLabels[dependency.type]}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-medium">
                          {toUseCase.useCaseId}: {toUseCase.title}
                        </div>
                        <div className="text-sm font-semibold text-primary">
                          {toClient?.name || "Unknown Client"}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const actualIndex = data.dependencies.findIndex(
                          (d) =>
                            d.fromUseCaseId === dependency.fromUseCaseId &&
                            d.toUseCaseId === dependency.toUseCaseId &&
                            d.type === dependency.type
                        )
                        if (actualIndex !== -1) {
                          handleDeleteDependency(actualIndex)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

