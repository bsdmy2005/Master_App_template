import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core"

export const developersTable = pgTable("developers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  capacity: integer("capacity").notNull(), // hours per week
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertDeveloper = typeof developersTable.$inferInsert
export type SelectDeveloper = typeof developersTable.$inferSelect

