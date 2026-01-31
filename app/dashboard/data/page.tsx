import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DataDemoPage() {
  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Database Example</h1>
        <p className="mt-2 text-muted-foreground">
          Learn how to use Drizzle ORM with server actions
        </p>
      </div>

      <Tabs defaultValue="schema" className="space-y-6">
        <TabsList>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        {/* Schema Tab */}
        <TabsContent value="schema">
          <Card>
            <CardHeader>
              <CardTitle>Database Schema</CardTitle>
              <CardDescription>
                Define your tables in db/schema/ directory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                <code>{`// db/schema/posts-schema.ts
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core"
import { userProfiles } from "./users-schema"

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => userProfiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Type inference
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Server Actions</CardTitle>
              <CardDescription>
                CRUD operations using the ActionState pattern
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                <code>{`// actions/posts-actions.ts
"use server"

import { db } from "@/db/db"
import { posts, type Post, type NewPost } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { ActionState } from "@/types/actions-types"

// CREATE
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
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to create post"
    }
  }
}

// READ
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
    return {
      isSuccess: false,
      message: "Failed to fetch posts"
    }
  }
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Using in Components</CardTitle>
                <CardDescription>
                  Call server actions from client or server components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`// In a Server Component
import { getPostsAction } from "@/actions/posts-actions"

export default async function PostsList() {
  const result = await getPostsAction()

  if (!result.isSuccess) {
    return <p>Error: {result.message}</p>
  }

  return (
    <ul>
      {result.data.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

// In a Client Component
"use client"

import { createPostAction } from "@/actions/posts-actions"
import { toast } from "sonner"

function CreatePostForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createPostAction({
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      authorId: "...", // from user context
    })

    if (result.isSuccess) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  return <form action={handleSubmit}>...</form>
}`}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Commands</CardTitle>
                <CardDescription>
                  Common Drizzle Kit commands for managing your database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`# Generate migration from schema changes
npm run db:generate

# Push schema directly to database (development)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Open Drizzle Studio to browse data
npm run db:studio`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
