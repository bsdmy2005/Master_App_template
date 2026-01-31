# Master App Template

Next.js 15 starter with auth, database, email, and rich text editor configured.

## What's Included

- **Clerk** - Authentication (sign-in, sign-up, protected routes)
- **Supabase + Drizzle** - PostgreSQL database with type-safe ORM
- **Postmark** - Transactional email
- **Tiptap** - Rich text editor
- **Shadcn UI** - Component library
- **Dark mode** - Theme switching

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in your credentials
npm run db:push
npm run dev
```

## Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
DATABASE_URL=postgresql://...

# Postmark (optional)
POSTMARK_API_TOKEN=...
POSTMARK_FROM_EMAIL=noreply@yourdomain.com
```

## Structure

```
app/
├── page.tsx                 # Home (redirects to dashboard if signed in)
├── (unauthenticated)/
│   └── (auth)/              # /sign-in, /sign-up
└── dashboard/               # Protected routes
    ├── page.tsx             # Main dashboard
    ├── editor/              # Tiptap demo
    ├── data/                # Database demo
    ├── email/               # Email demo
    └── settings/            # User settings

actions/                     # Server actions (mutations)
db/schema/                   # Drizzle table schemas
lib/email.ts                 # Postmark helpers
components/editor/           # Tiptap editor component
```

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run db:push       # Push schema to database
npm run db:studio     # Open Drizzle Studio
npm run clean         # Lint + format
npm run types         # Type check
```

## Adding a Table

```typescript
// db/schema/things-schema.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const things = pgTable("things", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
})
```

Then export from `db/schema/index.ts` and run `npm run db:push`.

## Server Actions

All mutations use `ActionState<T>` for consistent responses:

```typescript
// actions/things-actions.ts
"use server"

import { db } from "@/db/db"
import { things } from "@/db/schema"
import type { ActionState } from "@/types/actions-types"

export async function createThing(name: string): Promise<ActionState<Thing>> {
  try {
    const [item] = await db.insert(things).values({ name }).returning()
    return { isSuccess: true, message: "Created", data: item }
  } catch {
    return { isSuccess: false, message: "Failed to create" }
  }
}
```

## Email

```typescript
import { sendEmail } from "@/lib/email"

await sendEmail({
  to: "user@example.com",
  subject: "Hello",
  textBody: "Hello world"
})
```

## Docs

See `docs/` for detailed guides:
- `ACTIONS_GUIDE.md` - Server action patterns
- `QUERIES_GUIDE.md` - Database queries
- `API_GUIDE.md` - API routes
- `DEPLOYMENT.md` - Deployment steps
