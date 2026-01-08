import { pgEnum, pgTable, text } from "drizzle-orm/pg-core"
import { useCasesTable } from "./use-cases-schema"

export const dependencyTypeEnum = pgEnum("dependency_type", [
  "blocks",
  "covered-by",
  "depends-on",
  "related-to"
])

export const dependenciesTable = pgTable("dependencies", {
  fromUseCaseId: text("from_use_case_id")
    .references(() => useCasesTable.id, { onDelete: "cascade" })
    .notNull(),
  toUseCaseId: text("to_use_case_id")
    .references(() => useCasesTable.id, { onDelete: "cascade" })
    .notNull(),
  type: dependencyTypeEnum("type").notNull()
})

export type InsertDependency = typeof dependenciesTable.$inferInsert
export type SelectDependency = typeof dependenciesTable.$inferSelect

