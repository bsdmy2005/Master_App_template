"use server"

import { db } from "@/db/db"
import { posts, type Post, type NewPost } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { ActionState } from "@/types/actions-types"

/**
 * Server Actions for Posts
 *
 * This file demonstrates the recommended patterns for server actions:
 * - All actions are async and marked with "use server"
 * - Each action returns ActionState<T> for consistent error handling
 * - Mutations call revalidatePath to refresh cached data
 * - Database operations are wrapped in try/catch
 */

// ============================================================================
// CREATE
// ============================================================================

export async function createPostAction(
  data: NewPost
): Promise<ActionState<Post>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    const [newPost] = await db.insert(posts).values(data).returning()

    revalidatePath("/dashboard/data")

    return {
      isSuccess: true,
      message: "Post created successfully",
      data: newPost
    }
  } catch (error) {
    console.error("Error creating post:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to create post"
    }
  }
}

// ============================================================================
// READ
// ============================================================================

export async function getPostsAction(): Promise<ActionState<Post[]>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    const allPosts = await db.select().from(posts).orderBy(posts.createdAt)

    return {
      isSuccess: true,
      message: "Posts retrieved successfully",
      data: allPosts
    }
  } catch (error) {
    console.error("Error fetching posts:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to fetch posts"
    }
  }
}

export async function getPostByIdAction(id: string): Promise<ActionState<Post>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    const [post] = await db.select().from(posts).where(eq(posts.id, id))

    if (!post) {
      return { isSuccess: false, message: "Post not found" }
    }

    return {
      isSuccess: true,
      message: "Post retrieved successfully",
      data: post
    }
  } catch (error) {
    console.error("Error fetching post:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to fetch post"
    }
  }
}

// ============================================================================
// UPDATE
// ============================================================================

export async function updatePostAction(
  id: string,
  data: Partial<NewPost>
): Promise<ActionState<Post>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    const [updatedPost] = await db
      .update(posts)
      .set(data)
      .where(eq(posts.id, id))
      .returning()

    if (!updatedPost) {
      return { isSuccess: false, message: "Post not found" }
    }

    revalidatePath("/dashboard/data")

    return {
      isSuccess: true,
      message: "Post updated successfully",
      data: updatedPost
    }
  } catch (error) {
    console.error("Error updating post:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to update post"
    }
  }
}

// ============================================================================
// DELETE
// ============================================================================

export async function deletePostAction(id: string): Promise<ActionState<Post>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    const [deletedPost] = await db
      .delete(posts)
      .where(eq(posts.id, id))
      .returning()

    if (!deletedPost) {
      return { isSuccess: false, message: "Post not found" }
    }

    revalidatePath("/dashboard/data")

    return {
      isSuccess: true,
      message: "Post deleted successfully",
      data: deletedPost
    }
  } catch (error) {
    console.error("Error deleting post:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to delete post"
    }
  }
}
