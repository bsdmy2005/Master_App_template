"use server"

import { db } from "@/db/db"
import {
  developersTable,
  type InsertDeveloper,
  type SelectDeveloper
} from "@/db/schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

export async function createDeveloperAction(
  developer: InsertDeveloper
): Promise<ActionState<SelectDeveloper>> {
  try {
    const [newDeveloper] = await db
      .insert(developersTable)
      .values(developer)
      .returning()
    return {
      isSuccess: true,
      message: "Developer created successfully",
      data: newDeveloper
    }
  } catch (error) {
    console.error("Error creating developer:", error)
    return { isSuccess: false, message: "Failed to create developer" }
  }
}

export async function getDevelopersAction(): Promise<ActionState<SelectDeveloper[]>> {
  try {
    const developers = await db.query.developers.findMany()
    return {
      isSuccess: true,
      message: "Developers retrieved successfully",
      data: developers
    }
  } catch (error) {
    console.error("Error getting developers:", error)
    return { isSuccess: false, message: "Failed to get developers" }
  }
}

export async function updateDeveloperAction(
  id: string,
  data: Partial<InsertDeveloper>
): Promise<ActionState<SelectDeveloper>> {
  try {
    const [updatedDeveloper] = await db
      .update(developersTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(developersTable.id, id))
      .returning()

    return {
      isSuccess: true,
      message: "Developer updated successfully",
      data: updatedDeveloper
    }
  } catch (error) {
    console.error("Error updating developer:", error)
    return { isSuccess: false, message: "Failed to update developer" }
  }
}

export async function deleteDeveloperAction(
  id: string
): Promise<ActionState<void>> {
  try {
    await db.delete(developersTable).where(eq(developersTable.id, id))
    return {
      isSuccess: true,
      message: "Developer deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting developer:", error)
    return { isSuccess: false, message: "Failed to delete developer" }
  }
}

