import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core"
import { userProfiles } from "./users-schema"

/**
 * Posts table - Example content schema
 *
 * This demonstrates a typical content table with:
 * - Foreign key relationship to users
 * - Timestamps for created/updated
 * - Rich text content field (for Tiptap editor content)
 * - Published status for draft functionality
 */
export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => userProfiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"), // HTML content from Tiptap editor
  excerpt: text("excerpt"),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
