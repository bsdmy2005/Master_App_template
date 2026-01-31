"use server"

import { db } from "@/db/db"
import { userProfiles, type UserProfile, type NewUserProfile } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { ActionState } from "@/types/actions-types"

/**
 * Server Actions for User Profiles
 *
 * These actions manage user profile data that extends Clerk user data.
 * The clerkId field links the profile to the Clerk authentication user.
 */

// ============================================================================
// CREATE / UPSERT
// ============================================================================

/**
 * Ensure a user profile exists for the given Clerk user
 * Creates a new profile if one doesn't exist, otherwise returns the existing one
 * Called automatically from the dashboard layout on every page load
 */
export async function ensureUserProfileExistsAction(
  clerkId: string,
  initialData?: { displayName?: string; avatarUrl?: string }
): Promise<ActionState<UserProfile>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    // Check if profile already exists
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerkId, clerkId))

    if (existingProfile) {
      return {
        isSuccess: true,
        message: "Profile exists",
        data: existingProfile
      }
    }

    // Create new profile
    const [newProfile] = await db
      .insert(userProfiles)
      .values({
        clerkId,
        displayName: initialData?.displayName,
        avatarUrl: initialData?.avatarUrl
      })
      .returning()

    return {
      isSuccess: true,
      message: "Profile created",
      data: newProfile
    }
  } catch (error) {
    console.error("Error ensuring user profile exists:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to ensure profile"
    }
  }
}

/**
 * Create or update a user profile
 * Use this when a user signs up or updates their profile
 */
export async function upsertUserProfileAction(
  clerkId: string,
  data: Partial<Omit<NewUserProfile, "clerkId">>
): Promise<ActionState<UserProfile>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    // Check if profile exists
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerkId, clerkId))

    if (existingProfile) {
      // Update existing profile
      const [updatedProfile] = await db
        .update(userProfiles)
        .set(data)
        .where(eq(userProfiles.clerkId, clerkId))
        .returning()

      return {
        isSuccess: true,
        message: "Profile updated successfully",
        data: updatedProfile
      }
    }

    // Create new profile
    const [newProfile] = await db
      .insert(userProfiles)
      .values({ clerkId, ...data })
      .returning()

    revalidatePath("/dashboard")

    return {
      isSuccess: true,
      message: "Profile created successfully",
      data: newProfile
    }
  } catch (error) {
    console.error("Error upserting user profile:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to upsert profile"
    }
  }
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get user profile by Clerk ID
 */
export async function getUserProfileByClerkIdAction(
  clerkId: string
): Promise<ActionState<UserProfile>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerkId, clerkId))

    if (!profile) {
      return { isSuccess: false, message: "Profile not found" }
    }

    return {
      isSuccess: true,
      message: "Profile retrieved successfully",
      data: profile
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch profile"
    }
  }
}

/**
 * Get user profile by profile ID
 */
export async function getUserProfileByIdAction(
  id: string
): Promise<ActionState<UserProfile>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, id))

    if (!profile) {
      return { isSuccess: false, message: "Profile not found" }
    }

    return {
      isSuccess: true,
      message: "Profile retrieved successfully",
      data: profile
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch profile"
    }
  }
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete user profile
 * Call this when a user deletes their account
 */
export async function deleteUserProfileAction(
  clerkId: string
): Promise<ActionState<UserProfile>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    const [deletedProfile] = await db
      .delete(userProfiles)
      .where(eq(userProfiles.clerkId, clerkId))
      .returning()

    if (!deletedProfile) {
      return { isSuccess: false, message: "Profile not found" }
    }

    return {
      isSuccess: true,
      message: "Profile deleted successfully",
      data: deletedProfile
    }
  } catch (error) {
    console.error("Error deleting user profile:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to delete profile"
    }
  }
}
