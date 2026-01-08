"use server"

import { isDatabaseAvailable } from "@/db/db"
import {
  readPlanningDataAction,
  writePlanningDataAction
} from "@/actions/db/planning-data-actions"
import { readPlanningData, writePlanningData } from "./storage"
import type { PlanningData } from "@/types"

/**
 * Read planning data from database if available, otherwise from file system
 */
export async function readPlanningDataWithFallback(): Promise<PlanningData | null> {
  if (isDatabaseAvailable()) {
    const result = await readPlanningDataAction()
    if (result.isSuccess) {
      return result.data
    }
    console.error("Failed to read from database, falling back to file system")
  }
  // Fallback to file system
  return await readPlanningData()
}

/**
 * Write planning data to database if available, otherwise to file system
 */
export async function writePlanningDataWithFallback(
  data: PlanningData
): Promise<{ success: boolean; error?: string }> {
  if (isDatabaseAvailable()) {
    const result = await writePlanningDataAction(data)
    if (result.isSuccess) {
      return { success: true }
    }
    console.error("Failed to write to database, falling back to file system")
    return { success: false, error: result.message }
  }
  // Fallback to file system
  return await writePlanningData(data)
}

