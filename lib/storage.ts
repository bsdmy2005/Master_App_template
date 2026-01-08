"use server"

import { promises as fs } from "fs"
import path from "path"
import type { PlanningData } from "@/types/planning-types"

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "planning-data.json")

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// Read planning data from JSON file
export async function readPlanningData(): Promise<PlanningData | null> {
  try {
    await ensureDataDir()
    const fileContent = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(fileContent) as PlanningData
  } catch (error) {
    // File doesn't exist or is invalid, return null
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null
    }
    console.error("Error reading planning data:", error)
    return null
  }
}

// Write planning data to JSON file
export async function writePlanningData(
  data: PlanningData
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDataDir()
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8")
    return { success: true }
  } catch (error) {
    console.error("Error writing planning data:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to write planning data"
    }
  }
}

// Initialize with empty data structure
export async function initializePlanningData(): Promise<PlanningData> {
  const defaultData: PlanningData = {
    developers: [],
    clients: [],
    useCases: [],
    tasks: [],
    dependencies: [],
    projectStartDate: undefined
  }

  const existing = await readPlanningData()
  if (!existing) {
    await writePlanningData(defaultData)
    return defaultData
  }

  return existing
}

