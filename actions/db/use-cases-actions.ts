"use server"

import { db } from "@/db/db"
import {
  useCasesTable,
  tasksTable,
  dependenciesTable,
  type InsertUseCase,
  type SelectUseCase
} from "@/db/schema"
import { ActionState } from "@/types"
import { eq, or } from "drizzle-orm"

export async function createUseCaseAction(
  useCase: InsertUseCase
): Promise<ActionState<SelectUseCase>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const [newUseCase] = await db
      .insert(useCasesTable)
      .values(useCase)
      .returning()
    return {
      isSuccess: true,
      message: "Use case created successfully",
      data: newUseCase
    }
  } catch (error) {
    console.error("Error creating use case:", error)
    return { isSuccess: false, message: "Failed to create use case" }
  }
}

export async function getUseCasesAction(): Promise<ActionState<SelectUseCase[]>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const useCases = await db.query.useCases.findMany({
      with: {
        client: true
      }
    })
    return {
      isSuccess: true,
      message: "Use cases retrieved successfully",
      data: useCases
    }
  } catch (error) {
    console.error("Error getting use cases:", error)
    return { isSuccess: false, message: "Failed to get use cases" }
  }
}

export async function getUseCaseByIdAction(
  id: string
): Promise<ActionState<SelectUseCase>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const useCase = await db.query.useCases.findFirst({
      where: eq(useCasesTable.id, id),
      with: {
        client: true
      }
    })
    if (!useCase) {
      return { isSuccess: false, message: "Use case not found" }
    }
    return {
      isSuccess: true,
      message: "Use case retrieved successfully",
      data: useCase
    }
  } catch (error) {
    console.error("Error getting use case:", error)
    return { isSuccess: false, message: "Failed to get use case" }
  }
}

export async function updateUseCaseAction(
  id: string,
  data: Partial<InsertUseCase>
): Promise<ActionState<SelectUseCase>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const [updatedUseCase] = await db
      .update(useCasesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(useCasesTable.id, id))
      .returning()

    return {
      isSuccess: true,
      message: "Use case updated successfully",
      data: updatedUseCase
    }
  } catch (error) {
    console.error("Error updating use case:", error)
    return { isSuccess: false, message: "Failed to update use case" }
  }
}

export async function deleteUseCaseAction(
  id: string
): Promise<ActionState<void>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    
    // Delete in order: tasks, dependencies, then use case
    // Tasks should cascade, but we'll delete explicitly to be safe
    await db.delete(tasksTable).where(eq(tasksTable.useCaseId, id))
    
    // Delete dependencies where this use case is involved (either from or to)
    await db
      .delete(dependenciesTable)
      .where(
        or(
          eq(dependenciesTable.fromUseCaseId, id),
          eq(dependenciesTable.toUseCaseId, id)
        )
      )
    
    // Finally delete the use case
    await db.delete(useCasesTable).where(eq(useCasesTable.id, id))
    
    return {
      isSuccess: true,
      message: "Use case deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting use case:", error)
    return { isSuccess: false, message: "Failed to delete use case" }
  }
}

