"use server"

import { db } from "@/db/db"
import {
  developersTable,
  clientsTable,
  useCasesTable,
  tasksTable,
  dependenciesTable
} from "@/db/schema"
import type { PlanningData, GapLevel, Priority } from "@/types"
import { ActionState } from "@/types"

export async function readPlanningDataAction(): Promise<
  ActionState<PlanningData>
> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const [developers, clients, useCases, tasks, dependencies] =
      await Promise.all([
        db.select().from(developersTable),
        db.select().from(clientsTable),
        db.select().from(useCasesTable),
        db.select().from(tasksTable),
        db.select().from(dependenciesTable)
      ])

    // Convert database types to PlanningData format
    const planningData: PlanningData = {
      developers: developers.map((d) => ({
        id: d.id,
        name: d.name,
        email: d.email,
        capacity: d.capacity,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString()
      })),
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || undefined,
        systems: c.systems || undefined,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      })),
      useCases: useCases.map((uc) => ({
        id: uc.id,
        clientId: uc.clientId,
        useCaseId: uc.useCaseId,
        title: uc.title,
        description: uc.description || undefined,
        complexity: uc.complexity as "low" | "medium" | "high",
        gap: uc.gap as GapLevel,
        manDays: uc.manDays,
        sdkGaps: uc.sdkGaps || undefined,
        status: uc.status as any,
        priority: (typeof uc.priority === "number"
          ? (uc.priority <= 0 ? "low" : uc.priority <= 5 ? "medium" : "high")
          : uc.priority) as Priority,
        startDate: uc.startDate?.toISOString(),
        assignedDeveloperIds: uc.assignedDeveloperIds || undefined,
        createdAt: uc.createdAt.toISOString(),
        updatedAt: uc.updatedAt.toISOString()
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        useCaseId: t.useCaseId,
        title: t.title,
        description: t.description || undefined,
        estimatedHours: t.estimatedHours,
        assignedDeveloperIds: t.assignedDeveloperIds || [],
        status: t.status as "todo" | "in-progress" | "done",
        dependencies: t.dependencies || [],
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString()
      })),
      dependencies: dependencies.map((d) => ({
        fromUseCaseId: d.fromUseCaseId,
        toUseCaseId: d.toUseCaseId,
        type: d.type as any
      }))
    }

    return {
      isSuccess: true,
      message: "Planning data retrieved successfully",
      data: planningData
    }
  } catch (error) {
    console.error("Error reading planning data:", error)
    return { isSuccess: false, message: "Failed to read planning data" }
  }
}

export async function writePlanningDataAction(
  data: PlanningData
): Promise<ActionState<void>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    // Start a transaction to ensure all-or-nothing updates
    await db.transaction(async (tx) => {
      // Clear existing data
      await tx.delete(dependenciesTable)
      await tx.delete(tasksTable)
      await tx.delete(useCasesTable)
      await tx.delete(clientsTable)
      await tx.delete(developersTable)

      // Insert new data
      if (data.developers.length > 0) {
        await tx.insert(developersTable).values(
          data.developers.map((d) => ({
            id: d.id,
            name: d.name,
            email: d.email,
            capacity: d.capacity,
            createdAt: new Date(d.createdAt),
            updatedAt: new Date(d.updatedAt)
          }))
        )
      }

      if (data.clients.length > 0) {
        await tx.insert(clientsTable).values(
          data.clients.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description || null,
            systems: c.systems || null,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt)
          }))
        )
      }

      if (data.useCases.length > 0) {
        await tx.insert(useCasesTable).values(
          data.useCases.map((uc) => {
            // Validate gap is a valid GapLevel enum value
            const validGapLevels: GapLevel[] = [
              "sdk-native",
              "minor-extension",
              "moderate-extension",
              "significant-extension",
              "custom-implementation"
            ]
            const gapValue = validGapLevels.includes(uc.gap as GapLevel)
              ? (uc.gap as GapLevel)
              : "moderate-extension"
            
            // Convert priority to enum if it's still a number
            let priorityValue: Priority
            if (typeof uc.priority === "number") {
              if (uc.priority <= 0) {
                priorityValue = "low"
              } else if (uc.priority <= 5) {
                priorityValue = "medium"
              } else {
                priorityValue = "high"
              }
            } else {
              const validPriorities: Priority[] = ["low", "medium", "high"]
              priorityValue = validPriorities.includes(uc.priority as Priority)
                ? (uc.priority as Priority)
                : "medium"
            }
            
            return {
            id: uc.id,
            clientId: uc.clientId,
            useCaseId: uc.useCaseId,
            title: uc.title,
            description: uc.description || null,
            complexity: uc.complexity,
              gap: gapValue,
            manDays: uc.manDays,
            sdkGaps: uc.sdkGaps || null,
            status: uc.status,
            priority: priorityValue,
            startDate: uc.startDate ? new Date(uc.startDate) : null,
            assignedDeveloperIds: uc.assignedDeveloperIds || null,
            createdAt: new Date(uc.createdAt),
            updatedAt: new Date(uc.updatedAt)
            }
          })
        )
      }

      if (data.tasks.length > 0) {
        await tx.insert(tasksTable).values(
          data.tasks.map((t) => ({
            id: t.id,
            useCaseId: t.useCaseId,
            title: t.title,
            description: t.description || null,
            estimatedHours: t.estimatedHours,
            assignedDeveloperIds: t.assignedDeveloperIds || null,
            status: t.status,
            dependencies: t.dependencies || null,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt)
          }))
        )
      }

      if (data.dependencies.length > 0) {
        await tx.insert(dependenciesTable).values(
          data.dependencies.map((d) => ({
            fromUseCaseId: d.fromUseCaseId,
            toUseCaseId: d.toUseCaseId,
            type: d.type
          }))
        )
      }
    })

    return {
      isSuccess: true,
      message: "Planning data saved successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error writing planning data:", error)
    return { isSuccess: false, message: "Failed to write planning data" }
  }
}

