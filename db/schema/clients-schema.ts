import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { useCasesTable } from "./use-cases-schema"

export const clientsTable = pgTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  systems: text("systems").array(), // Array of system names
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export const clientsRelations = relations(clientsTable, ({ many }) => ({
  useCases: many(useCasesTable)
}))

export type InsertClient = typeof clientsTable.$inferInsert
export type SelectClient = typeof clientsTable.$inferSelect

