"use server"

import { db } from "@/db/db"
import { ideasTable, type InsertIdea, type SelectIdea } from "@/db/schema"
import { ActionState } from "@/types"
import { eq, desc } from "drizzle-orm"

export async function createIdeaAction(
  idea: InsertIdea
): Promise<ActionState<SelectIdea>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const [newIdea] = await db.insert(ideasTable).values(idea).returning()
    return {
      isSuccess: true,
      message: "Idea submitted successfully",
      data: newIdea
    }
  } catch (error) {
    console.error("Error creating idea:", error)
    return { isSuccess: false, message: "Failed to submit idea" }
  }
}

export async function getIdeasAction(): Promise<ActionState<SelectIdea[]>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const ideas = await db.select().from(ideasTable).orderBy(desc(ideasTable.createdAt))
    return {
      isSuccess: true,
      message: "Ideas retrieved successfully",
      data: ideas
    }
  } catch (error) {
    console.error("Error getting ideas:", error)
    return { isSuccess: false, message: "Failed to get ideas" }
  }
}

export async function getIdeaByIdAction(id: string): Promise<ActionState<SelectIdea>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const [idea] = await db.select().from(ideasTable).where(eq(ideasTable.id, id))
    if (!idea) {
      return { isSuccess: false, message: "Idea not found" }
    }
    return {
      isSuccess: true,
      message: "Idea retrieved successfully",
      data: idea
    }
  } catch (error) {
    console.error("Error getting idea:", error)
    return { isSuccess: false, message: "Failed to get idea" }
  }
}

export async function updateIdeaAction(
  id: string,
  data: Partial<InsertIdea>
): Promise<ActionState<SelectIdea>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const [updatedIdea] = await db
      .update(ideasTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ideasTable.id, id))
      .returning()

    return {
      isSuccess: true,
      message: "Idea updated successfully",
      data: updatedIdea
    }
  } catch (error) {
    console.error("Error updating idea:", error)
    return { isSuccess: false, message: "Failed to update idea" }
  }
}

export async function deleteIdeaAction(id: string): Promise<ActionState<void>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    await db.delete(ideasTable).where(eq(ideasTable.id, id))
    return {
      isSuccess: true,
      message: "Idea deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting idea:", error)
    return { isSuccess: false, message: "Failed to delete idea" }
  }
}

// Get unique submitters for returning user selection
export async function getIdeaSubmittersAction(): Promise<ActionState<{ firstName: string; surname: string; email: string }[]>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const ideas = await db
      .selectDistinct({
        firstName: ideasTable.submittedByFirstName,
        surname: ideasTable.submittedBySurname,
        email: ideasTable.submittedByEmail
      })
      .from(ideasTable)
      .orderBy(ideasTable.submittedBySurname)

    return {
      isSuccess: true,
      message: "Submitters retrieved successfully",
      data: ideas
    }
  } catch (error) {
    console.error("Error getting submitters:", error)
    return { isSuccess: false, message: "Failed to get submitters" }
  }
}

// Specific action for promoting an idea to use case status
export async function promoteIdeaToUseCaseAction(
  ideaId: string,
  useCaseId: string
): Promise<ActionState<SelectIdea>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const [updatedIdea] = await db
      .update(ideasTable)
      .set({
        status: "promoted-to-usecase",
        promotedToUseCaseId: useCaseId,
        updatedAt: new Date()
      })
      .where(eq(ideasTable.id, ideaId))
      .returning()

    return {
      isSuccess: true,
      message: "Idea promoted to use case successfully",
      data: updatedIdea
    }
  } catch (error) {
    console.error("Error promoting idea:", error)
    return { isSuccess: false, message: "Failed to promote idea" }
  }
}
