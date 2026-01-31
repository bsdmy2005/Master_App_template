# Server Actions Guide

Server Actions are async functions that run on the server. They're the primary way to mutate data in Next.js 15.

## Directory Structure

```
actions/
  posts-actions.ts    # Post-related actions
  users-actions.ts    # User profile actions
  email-actions.ts    # Email sending actions (create as needed)
```

## ActionState Pattern

All actions return a consistent `ActionState<T>` type:

```typescript
// types/actions-types.ts
export type ActionState<T> =
  | { isSuccess: true; message: string; data: T }
  | { isSuccess: false; message: string; data?: never }
```

This pattern provides:
- Type-safe success/error handling
- Consistent API across all actions
- Easy toast notification integration

## Creating an Action

```typescript
"use server"

import { db } from "@/db/db"
import { posts } from "@/db/schema"
import { revalidatePath } from "next/cache"
import type { ActionState } from "@/types/actions-types"

export async function createPostAction(data: NewPost): Promise<ActionState<Post>> {
  try {
    // Check database availability
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    // Perform database operation
    const [newPost] = await db.insert(posts).values(data).returning()

    // Revalidate relevant paths
    revalidatePath("/dashboard")

    // Return success
    return {
      isSuccess: true,
      message: "Post created successfully",
      data: newPost
    }
  } catch (error) {
    // Log error and return failure
    console.error("Error creating post:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to create post"
    }
  }
}
```

## Using Actions in Components

### Server Component

```typescript
// app/posts/page.tsx
import { getPostsAction } from "@/actions/posts-actions"

export default async function PostsPage() {
  const result = await getPostsAction()

  if (!result.isSuccess) {
    return <p className="text-destructive">{result.message}</p>
  }

  return (
    <ul>
      {result.data.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Client Component

```typescript
"use client"

import { createPostAction } from "@/actions/posts-actions"
import { toast } from "sonner"

export function CreatePostForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createPostAction({
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      authorId: "..."
    })

    if (result.isSuccess) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <form action={handleSubmit}>
      <input name="title" />
      <button type="submit">Create</button>
    </form>
  )
}
```

### With useTransition for Loading States

```typescript
"use client"

import { useTransition } from "react"
import { createPostAction } from "@/actions/posts-actions"

export function CreatePostButton() {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await createPostAction({ title: "New Post" })
      // Handle result...
    })
  }

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? "Creating..." : "Create Post"}
    </button>
  )
}
```

## Best Practices

1. **Always use "use server"** at the top of action files
2. **Check database availability** before operations
3. **Use try/catch** for error handling
4. **Call revalidatePath** after mutations to refresh cached data
5. **Return ActionState** for consistent error handling
6. **Log errors** for debugging
7. **Use TypeScript types** for inputs and outputs

## Common Patterns

### Validation with Zod

```typescript
import { z } from "zod"

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  content: z.string().optional()
})

export async function createPostAction(data: unknown): Promise<ActionState<Post>> {
  const validation = createPostSchema.safeParse(data)

  if (!validation.success) {
    return {
      isSuccess: false,
      message: validation.error.errors[0].message
    }
  }

  // Continue with validated data...
}
```

### Auth Check

```typescript
import { auth } from "@clerk/nextjs/server"

export async function protectedAction(): Promise<ActionState<Data>> {
  const { userId } = await auth()

  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  // Continue with authenticated user...
}
```
