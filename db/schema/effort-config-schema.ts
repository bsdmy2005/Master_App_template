import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const effortConfigTable = pgTable("effort_config", {
  id: text("id").primaryKey(),
  complexityWeights: jsonb("complexity_weights").notNull(),
  gapWeights: jsonb("gap_weights").notNull(),
  formulaParams: jsonb("formula_params").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertEffortConfig = typeof effortConfigTable.$inferInsert
export type SelectEffortConfig = typeof effortConfigTable.$inferSelect


