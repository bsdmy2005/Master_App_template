import { pgEnum, pgTable, text, integer, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { useCasesTable } from "./use-cases-schema"

export const taskStatusEnum = pgEnum("task_status", ["todo", "in-progress", "done"])

export const tasksTable = pgTable("tasks", {
  id: text("id").primaryKey(),
  useCaseId: text("use_case_id")
    .references(() => useCasesTable.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  estimatedHours: integer("estimated_hours").notNull(),
  assignedDeveloperIds: text("assigned_developer_ids").array(), // Array of developer IDs
  status: taskStatusEnum("status").notNull(),
  dependencies: text("dependencies").array(), // Array of task IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  useCase: one(useCasesTable, {
    fields: [tasksTable.useCaseId],
    references: [useCasesTable.id]
  })
}))

export type InsertTask = typeof tasksTable.$inferInsert
export type SelectTask = typeof tasksTable.$inferSelect

