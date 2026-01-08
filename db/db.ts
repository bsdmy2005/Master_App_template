import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Allow DATABASE_URL to be optional for development (will use file storage as fallback)
const connectionString = process.env.DATABASE_URL

let client: postgres.Sql | null = null
let dbInstance: ReturnType<typeof drizzle> | null = null

if (connectionString && connectionString.trim() !== "") {
  try {
    client = postgres(connectionString)
    dbInstance = drizzle(client, { schema })
  } catch (error) {
    console.warn("Failed to initialize database connection:", error)
    console.warn("Falling back to file-based storage")
  }
}

export const db = dbInstance

// Helper to check if database is available
export function isDatabaseAvailable(): boolean {
  return dbInstance !== null && client !== null
}

