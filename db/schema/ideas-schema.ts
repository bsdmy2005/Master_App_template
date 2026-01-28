import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { clientsTable } from "./clients-schema"

// Status flow: submitted → under-review → accepted/rejected → (if accepted) promoted-to-usecase
export const ideaStatusEnum = pgEnum("idea_status", [
  "submitted",
  "under-review",
  "needs-clarification",
  "accepted",
  "rejected",
  "promoted-to-usecase"
])

export const ideaPriorityEnum = pgEnum("idea_priority", [
  "not-set",
  "low",
  "medium",
  "high",
  "critical"
])

export const ideasTable = pgTable("ideas", {
  id: text("id").primaryKey(),

  // Client association - can be existing client ID or null if new client
  clientId: text("client_id").references(() => clientsTable.id, { onDelete: "set null" }),

  // If clientId is null, store the proposed client name here
  proposedClientName: text("proposed_client_name"),

  // Core idea details
  title: text("title").notNull(), // Short title
  description: text("description").notNull(), // Detailed description of what they need

  // Who submitted this idea
  submittedByFirstName: text("submitted_by_first_name").notNull(),
  submittedBySurname: text("submitted_by_surname").notNull(),
  submittedByEmail: text("submitted_by_email").notNull(),
  submittedByOrganization: text("submitted_by_organization"),

  // Status tracking
  status: ideaStatusEnum("status").notNull().default("submitted"),
  priority: ideaPriorityEnum("priority").notNull().default("not-set"),

  // Internal notes (only visible to Black Glass team)
  internalNotes: text("internal_notes"),

  // If promoted to use case, link it here
  promotedToUseCaseId: text("promoted_to_use_case_id"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by") // Name of Black Glass team member who reviewed
})

export const ideasRelations = relations(ideasTable, ({ one }) => ({
  client: one(clientsTable, {
    fields: [ideasTable.clientId],
    references: [clientsTable.id]
  })
}))

export type InsertIdea = typeof ideasTable.$inferInsert
export type SelectIdea = typeof ideasTable.$inferSelect
