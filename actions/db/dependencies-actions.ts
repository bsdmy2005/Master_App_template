"use server"

import { db } from "@/db/db"
import {
  dependenciesTable,
  type InsertDependency,
  type SelectDependency
} from "@/db/schema"
import { ActionState } from "@/types"
import { and, eq, or } from "drizzle-orm"

export async function createDependencyAction(
  dependency: InsertDependency
): Promise<ActionState<SelectDependency>> {
  try {
    const [newDependency] = await db
      .insert(dependenciesTable)
      .values(dependency)
      .returning()
    return {
      isSuccess: true,
      message: "Dependency created successfully",
      data: newDependency
    }
  } catch (error) {
    console.error("Error creating dependency:", error)
    return { isSuccess: false, message: "Failed to create dependency" }
  }
}

export async function getDependenciesAction(): Promise<
  ActionState<SelectDependency[]>
> {
  try {
    const dependencies = await db.query.dependencies.findMany()
    return {
      isSuccess: true,
      message: "Dependencies retrieved successfully",
      data: dependencies
    }
  } catch (error) {
    console.error("Error getting dependencies:", error)
    return { isSuccess: false, message: "Failed to get dependencies" }
  }
}

export async function getDependenciesByUseCaseIdAction(
  useCaseId: string
): Promise<ActionState<SelectDependency[]>> {
  try {
    const dependencies = await db.query.dependencies.findMany({
      where: or(
        eq(dependenciesTable.fromUseCaseId, useCaseId),
        eq(dependenciesTable.toUseCaseId, useCaseId)
      )
    })
    return {
      isSuccess: true,
      message: "Dependencies retrieved successfully",
      data: dependencies
    }
  } catch (error) {
    console.error("Error getting dependencies:", error)
    return { isSuccess: false, message: "Failed to get dependencies" }
  }
}

export async function deleteDependencyAction(
  fromUseCaseId: string,
  toUseCaseId: string,
  type: string
): Promise<ActionState<void>> {
  try {
    await db
      .delete(dependenciesTable)
      .where(
        and(
          eq(dependenciesTable.fromUseCaseId, fromUseCaseId),
          eq(dependenciesTable.toUseCaseId, toUseCaseId),
          eq(dependenciesTable.type, type as any)
        )
      )
    return {
      isSuccess: true,
      message: "Dependency deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting dependency:", error)
    return { isSuccess: false, message: "Failed to delete dependency" }
  }
}

