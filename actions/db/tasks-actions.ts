"use server"

import { db } from "@/db/db"
import { tasksTable, type InsertTask, type SelectTask } from "@/db/schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

export async function createTaskAction(
  task: InsertTask
): Promise<ActionState<SelectTask>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const [newTask] = await db.insert(tasksTable).values(task).returning()
    return {
      isSuccess: true,
      message: "Task created successfully",
      data: newTask
    }
  } catch (error) {
    console.error("Error creating task:", error)
    return { isSuccess: false, message: "Failed to create task" }
  }
}

export async function getTasksAction(): Promise<ActionState<SelectTask[]>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const tasks = await db.select().from(tasksTable)
    return {
      isSuccess: true,
      message: "Tasks retrieved successfully",
      data: tasks
    }
  } catch (error) {
    console.error("Error getting tasks:", error)
    return { isSuccess: false, message: "Failed to get tasks" }
  }
}

export async function getTasksByUseCaseIdAction(
  useCaseId: string
): Promise<ActionState<SelectTask[]>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const tasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.useCaseId, useCaseId))
    return {
      isSuccess: true,
      message: "Tasks retrieved successfully",
      data: tasks
    }
  } catch (error) {
    console.error("Error getting tasks:", error)
    return { isSuccess: false, message: "Failed to get tasks" }
  }
}

export async function updateTaskAction(
  id: string,
  data: Partial<InsertTask>
): Promise<ActionState<SelectTask>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const [updatedTask] = await db
      .update(tasksTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasksTable.id, id))
      .returning()

    return {
      isSuccess: true,
      message: "Task updated successfully",
      data: updatedTask
    }
  } catch (error) {
    console.error("Error updating task:", error)
    return { isSuccess: false, message: "Failed to update task" }
  }
}

export async function deleteTaskAction(id: string): Promise<ActionState<void>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    await db.delete(tasksTable).where(eq(tasksTable.id, id))
    return {
      isSuccess: true,
      message: "Task deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting task:", error)
    return { isSuccess: false, message: "Failed to delete task" }
  }
}

