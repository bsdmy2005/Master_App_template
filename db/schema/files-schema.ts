import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core"
import { userProfiles } from "./users-schema"

/**
 * Files table - Track uploaded files in R2 storage
 *
 * This table stores metadata for files uploaded to Cloudflare R2:
 * - Links to the user who uploaded the file
 * - Storage key for retrieving from R2
 * - File metadata (type, size, name)
 * - Timestamps for auditing
 *
 * The actual file content is stored in R2 object storage,
 * not in the database. This table just tracks the metadata.
 */
export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  uploaderId: uuid("uploader_id")
    .notNull()
    .references(() => userProfiles.id, { onDelete: "cascade" }),

  // Storage information
  storageKey: text("storage_key").notNull().unique(), // R2 object key
  publicUrl: text("public_url"), // Public URL if available

  // File metadata
  filename: text("filename").notNull(), // Original filename
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // File size in bytes

  // Optional categorization
  folder: text("folder").default("uploads"), // Logical folder/category
  description: text("description"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type FileRecord = typeof files.$inferSelect
export type NewFileRecord = typeof files.$inferInsert
