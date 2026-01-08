"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, User, Mail, Clock, Trash2, Edit } from "lucide-react"
import type { PlanningData, Developer } from "@/types/planning-types"
import { writePlanningDataWithFallback } from "@/lib/storage-db"
import { toast } from "sonner"

interface DeveloperRepositoryProps {
  data: PlanningData
  setData: (data: PlanningData) => void
}

export function DeveloperRepository({
  data,
  setData
}: DeveloperRepositoryProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDeveloper, setEditingDeveloper] = useState<Developer | null>(
    null
  )
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    capacity: 40
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const now = new Date().toISOString()
    let updatedDevelopers: Developer[]

    if (editingDeveloper) {
      updatedDevelopers = data.developers.map((dev) =>
        dev.id === editingDeveloper.id
          ? {
              ...dev,
              ...formData,
              updatedAt: now
            }
          : dev
      )
    } else {
      const newDeveloper: Developer = {
        id: `dev-${Date.now()}`,
        ...formData,
        createdAt: now,
        updatedAt: now
      }
      updatedDevelopers = [...data.developers, newDeveloper]
    }

    const updatedData: PlanningData = {
      ...data,
      developers: updatedDevelopers
    }

    const result = await writePlanningDataWithFallback(updatedData)
    if (result.success) {
      setData(updatedData)
      setIsDialogOpen(false)
      setEditingDeveloper(null)
      setFormData({ name: "", email: "", capacity: 40 })
      toast.success(
        editingDeveloper
          ? "Developer updated successfully"
          : "Developer added successfully"
      )
    } else {
      toast.error("Failed to save developer")
    }
  }

  const handleEdit = (developer: Developer) => {
    setEditingDeveloper(developer)
    setFormData({
      name: developer.name,
      email: developer.email,
      capacity: developer.capacity
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this developer?")) return

    const updatedDevelopers = data.developers.filter((dev) => dev.id !== id)
    const updatedData: PlanningData = {
      ...data,
      developers: updatedDevelopers
    }

    const result = await writePlanningDataWithFallback(updatedData)
    if (result.success) {
      setData(updatedData)
      toast.success("Developer deleted successfully")
    } else {
      toast.error("Failed to delete developer")
    }
  }

  const getDeveloperUtilization = (developerId: string) => {
    const assignedTasks = data.tasks.filter(
      (task) => task.assignedDeveloperIds.includes(developerId)
    )
    const totalHours = assignedTasks.reduce(
      (sum, task) => sum + task.estimatedHours,
      0
    )
    const weeklyCapacity = data.developers.find((d) => d.id === developerId)
      ?.capacity || 40
    return {
      assignedTasks: assignedTasks.length,
      totalHours,
      utilization: (totalHours / (weeklyCapacity * 4)) * 100 // Rough monthly estimate
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Developer Repository</h2>
          <p className="text-muted-foreground">
            Manage developers and their capacity
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setEditingDeveloper(null)
              setFormData({ name: "", email: "", capacity: 40 })
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Developer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDeveloper ? "Edit Developer" : "Add Developer"}
              </DialogTitle>
              <DialogDescription>
                {editingDeveloper
                  ? "Update developer information"
                  : "Add a new developer to the repository"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (hours/week)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="168"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: parseInt(e.target.value) || 40
                    })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingDeveloper ? "Update" : "Add"} Developer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {data.developers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No developers yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first developer to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {data.developers.map((developer, index) => {
              const utilization = getDeveloperUtilization(developer.id)
              return (
                <motion.div
                  key={developer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {developer.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {developer.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(developer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(developer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Capacity</span>
                        </div>
                        <Badge variant="outline">
                          {developer.capacity} hrs/week
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Assigned Tasks
                          </span>
                          <span className="font-medium">
                            {utilization.assignedTasks}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Total Hours
                          </span>
                          <span className="font-medium">
                            {utilization.totalHours}h
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(utilization.utilization, 100)}%`
                            }}
                            transition={{ duration: 0.5 }}
                            className={`h-full ${
                              utilization.utilization > 100
                                ? "bg-destructive"
                                : utilization.utilization > 80
                                  ? "bg-yellow-500"
                                  : "bg-primary"
                            }`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

