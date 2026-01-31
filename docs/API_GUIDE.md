# API Routes Guide

Next.js 15 API routes live in the `app/api` directory. Use them for webhooks, external integrations, and endpoints that need standard HTTP methods.

## Directory Structure

```
app/
  api/
    email/
      send/
        route.ts      # POST /api/email/send
    webhooks/
      clerk/
        route.ts      # POST /api/webhooks/clerk
```

## Basic API Route

```typescript
// app/api/hello/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "Hello World" })
}

export async function POST(request: Request) {
  const body = await request.json()

  return NextResponse.json({
    received: body,
    timestamp: new Date().toISOString()
  })
}
```

## With Authentication

```typescript
// app/api/protected/route.ts
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  return NextResponse.json({
    userId,
    message: "You are authenticated"
  })
}
```

## Email Sending Endpoint

```typescript
// app/api/email/send/route.ts
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { z } from "zod"

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  htmlBody: z.string().optional(),
  textBody: z.string().optional()
})

export async function POST(request: Request) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validation = sendEmailSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    // Send email
    const result = await sendEmail(validation.data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId
    })
  } catch (error) {
    console.error("Email API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

## Clerk Webhook Handler

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from "svix"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { upsertUserProfileAction, deleteUserProfileAction } from "@/actions/users-actions"

export async function POST(request: Request) {
  // Get webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET")
  }

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    )
  }

  // Get body
  const payload = await request.json()
  const body = JSON.stringify(payload)

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature
    }) as WebhookEvent
  } catch (err) {
    console.error("Webhook verification failed:", err)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  // Handle events
  const eventType = evt.type

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, first_name, last_name, image_url } = evt.data

    await upsertUserProfileAction(id, {
      displayName: [first_name, last_name].filter(Boolean).join(" ") || null,
      avatarUrl: image_url || null
    })
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data
    if (id) {
      await deleteUserProfileAction(id)
    }
  }

  return NextResponse.json({ received: true })
}
```

## URL Parameters

```typescript
// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Fetch post by id...
  return NextResponse.json({ id })
}
```

## Query Parameters

```typescript
// app/api/search/route.ts
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const page = searchParams.get("page") || "1"

  // Perform search...
  return NextResponse.json({
    query,
    page: parseInt(page),
    results: []
  })
}
```

## Error Handling Pattern

```typescript
import { NextResponse } from "next/server"

class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message)
  }
}

export async function GET() {
  try {
    // Your logic here...
    throw new APIError("Resource not found", 404)
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

## When to Use API Routes vs Server Actions

| Use Case | API Routes | Server Actions |
|----------|-----------|----------------|
| Form submissions | ❌ | ✅ |
| Data mutations from UI | ❌ | ✅ |
| External webhooks | ✅ | ❌ |
| Third-party integrations | ✅ | ❌ |
| Public API endpoints | ✅ | ❌ |
| File uploads (complex) | ✅ | ❌ |
| Authentication flows | ✅ | ❌ |

**Rule of thumb**: Use Server Actions for client-driven mutations, API routes for external integrations and webhooks.
