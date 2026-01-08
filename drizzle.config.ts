import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"
import { resolve } from "path"

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") })

// Also try .env as fallback
if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), ".env") })
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required for migrations. Please set it in .env.local or .env"
  )
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
})

