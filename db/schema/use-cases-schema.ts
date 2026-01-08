import { pgEnum, pgTable, text, integer, timestamp, doublePrecision } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { clientsTable } from "./clients-schema"
import { tasksTable } from "./tasks-schema"

export const complexityEnum = pgEnum("complexity", ["low", "medium", "high"])
export const gapLevelEnum = pgEnum("gap_level", [
  "sdk-native",
  "minor-extension",
  "moderate-extension",
  "significant-extension",
  "custom-implementation"
])
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"])
export const useCaseStatusEnum = pgEnum("use_case_status", [
  "high-level definition",
  "groomed",
  "defined",
  "in development",
  "completed"
])

export const useCasesTable = pgTable("use_cases", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .references(() => clientsTable.id, { onDelete: "cascade" })
    .notNull(),
  useCaseId: text("use_case_id").notNull(), // e.g., "US-1"
  title: text("title").notNull(),
  description: text("description"),
  complexity: complexityEnum("complexity").notNull(),
  gap: gapLevelEnum("gap").notNull(),
  manDays: doublePrecision("man_days").notNull(),
  sdkGaps: text("sdk_gaps"),
  status: useCaseStatusEnum("status").notNull(),
  priority: priorityEnum("priority").notNull().default("medium"),
  startDate: timestamp("start_date"),
  assignedDeveloperIds: text("assigned_developer_ids").array(), // Array of developer IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export const useCasesRelations = relations(useCasesTable, ({ one, many }) => ({
  client: one(clientsTable, {
    fields: [useCasesTable.clientId],
    references: [clientsTable.id]
  }),
  tasks: many(tasksTable)
}))

export type InsertUseCase = typeof useCasesTable.$inferInsert
export type SelectUseCase = typeof useCasesTable.$inferSelect

