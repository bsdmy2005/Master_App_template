import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * User profiles table - extends Clerk user data with app-specific fields
 *
 * The clerkId links to the Clerk user, allowing you to store
 * additional user data that Clerk doesn't manage.
 */
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type UserProfile = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert
