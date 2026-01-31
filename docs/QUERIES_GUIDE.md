# Database Queries Guide

This guide covers how to read data using Drizzle ORM in the Master App Template.

## Setup Overview

```
db/
  db.ts           # Database connection
  schema/
    index.ts      # Schema exports
    users-schema.ts
    posts-schema.ts
```

## Basic Queries

### Select All

```typescript
import { db } from "@/db/db"
import { posts } from "@/db/schema"

// Get all posts
const allPosts = await db.select().from(posts)
```

### Select with Conditions

```typescript
import { eq, gt, and, or, like } from "drizzle-orm"

// Find by ID
const [post] = await db
  .select()
  .from(posts)
  .where(eq(posts.id, "uuid-here"))

// Multiple conditions
const publishedPosts = await db
  .select()
  .from(posts)
  .where(
    and(
      eq(posts.published, true),
      gt(posts.createdAt, new Date("2024-01-01"))
    )
  )

// OR conditions
const searchResults = await db
  .select()
  .from(posts)
  .where(
    or(
      like(posts.title, "%search%"),
      like(posts.content, "%search%")
    )
  )
```

### Ordering and Limiting

```typescript
import { desc, asc } from "drizzle-orm"

// Order by date, newest first
const recentPosts = await db
  .select()
  .from(posts)
  .orderBy(desc(posts.createdAt))
  .limit(10)
  .offset(0) // For pagination
```

### Select Specific Fields

```typescript
// Only select specific columns
const postTitles = await db
  .select({
    id: posts.id,
    title: posts.title
  })
  .from(posts)
```

## Joins

### Inner Join

```typescript
import { userProfiles, posts } from "@/db/schema"

const postsWithAuthors = await db
  .select({
    post: posts,
    author: userProfiles
  })
  .from(posts)
  .innerJoin(userProfiles, eq(posts.authorId, userProfiles.id))
```

### Left Join

```typescript
const postsWithOptionalAuthors = await db
  .select()
  .from(posts)
  .leftJoin(userProfiles, eq(posts.authorId, userProfiles.id))
```

## Aggregations

```typescript
import { count, sum, avg } from "drizzle-orm"

// Count posts
const [{ total }] = await db
  .select({ total: count() })
  .from(posts)

// Count by condition
const [{ published }] = await db
  .select({ published: count() })
  .from(posts)
  .where(eq(posts.published, true))
```

## Using in Server Actions

```typescript
"use server"

import { db } from "@/db/db"
import { posts, userProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { ActionState } from "@/types/actions-types"

export async function getPostWithAuthorAction(
  postId: string
): Promise<ActionState<PostWithAuthor>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    const [result] = await db
      .select({
        post: posts,
        author: {
          id: userProfiles.id,
          displayName: userProfiles.displayName
        }
      })
      .from(posts)
      .innerJoin(userProfiles, eq(posts.authorId, userProfiles.id))
      .where(eq(posts.id, postId))

    if (!result) {
      return { isSuccess: false, message: "Post not found" }
    }

    return {
      isSuccess: true,
      message: "Post retrieved",
      data: result
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: "Failed to fetch post"
    }
  }
}
```

## Using in Server Components

```typescript
// app/posts/[id]/page.tsx
import { db } from "@/db/db"
import { posts } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"

export default async function PostPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!db) {
    return <p>Database not configured</p>
  }

  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id))

  if (!post) {
    notFound()
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content || "" }} />
    </article>
  )
}
```

## Prepared Statements

For frequently used queries, use prepared statements for better performance:

```typescript
import { db } from "@/db/db"
import { posts } from "@/db/schema"
import { eq } from "drizzle-orm"

const getPostById = db
  ?.select()
  .from(posts)
  .where(eq(posts.id, sql.placeholder("id")))
  .prepare("get_post_by_id")

// Use it
const [post] = await getPostById?.execute({ id: "uuid-here" }) ?? []
```

## Type Safety

Drizzle provides excellent TypeScript inference:

```typescript
import { posts, type Post, type NewPost } from "@/db/schema"

// Type is inferred automatically
const allPosts = await db.select().from(posts)
// allPosts: Post[]

// For inserts, use NewPost type
const newPost: NewPost = {
  title: "Hello",
  authorId: "uuid-here"
}
```

## Database Commands

```bash
# Generate migrations from schema changes
npm run db:generate

# Push schema to database (development)
npm run db:push

# Run migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```
