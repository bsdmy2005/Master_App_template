"use server"

import { isDatabaseAvailable } from "@/db/db"

/**
 * Check if database is available
 * This is a server action that can be called from client components
 */
export async function checkDatabaseAvailableAction(): Promise<boolean> {
  return isDatabaseAvailable()
}



