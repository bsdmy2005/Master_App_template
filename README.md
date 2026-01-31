# Master App Template

A Next.js 15 scaffolding template for rapid application development. Clone this repo as the starting point for any new project.

---

## Stack Overview

This template includes pre-configured services that most applications need. Each component is chosen for reliability, developer experience, and cost-effectiveness.

### Authentication: Clerk
**What it does**: Handles user sign-up, sign-in, session management, and protected routes.

**Why Clerk**: Zero-config authentication with social logins, MFA, and user management dashboard. No need to build auth from scratch or manage password hashing, session tokens, or OAuth flows.

**In this template**: Sign-in/sign-up pages, middleware protection for `/dashboard/*` routes, user data available via `currentUser()`.

---

### Database: Render PostgreSQL + Drizzle ORM
**What it does**: Stores your application data in a PostgreSQL database with type-safe queries.

**Why Render**: Free tier available, simple setup, reliable managed PostgreSQL. No vendor lock-in.

**Why Drizzle**: Type-safe ORM that generates clean SQL. Schema changes via `db:push`, no complex migrations needed during development.

**In this template**: User profiles, posts, and files tables as examples. Server actions pattern for all database mutations.

---

### File Storage: Cloudflare R2
**What it does**: Stores uploaded files (images, documents, etc.) with access control.

**Why R2**: S3-compatible API, generous free tier (10GB), no egress fees. Files are private by default, accessed via presigned URLs that expire.

**In this template**: File upload component, storage utilities in `lib/storage.ts`, file metadata tracked in database.

---

### Email: Postmark (Optional)
**What it does**: Sends transactional emails (welcome emails, password resets, notifications).

**Why Postmark**: Excellent deliverability, simple API, good free tier. Not for marketing emails—use for transactional only.

**In this template**: Email utility in `lib/email.ts`, ready to use with templates.

---

### Rich Text Editor: Tiptap
**What it does**: WYSIWYG editor for user-generated content with formatting.

**Why Tiptap**: Headless, extensible, outputs clean HTML. Better than building textarea + markdown parsing.

**In this template**: Editor component in `components/editor/`, demo page at `/dashboard/editor`.

---

### UI Components: Shadcn UI
**What it does**: Pre-built, accessible React components.

**Why Shadcn**: Components are copied into your codebase (not a dependency), fully customizable, built on Radix primitives.

**In this template**: Button, Card, Input, Dialog, and more in `components/ui/`. Add more with `npx shadcn@latest add [component]`.

---

## Prerequisites

- **Node.js 18+** ([download](https://nodejs.org/))
- **Git** ([download](https://git-scm.com/))

---

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/master-app-template.git
cd master-app-template
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env.local
```

---

### 3. Configure Clerk (Authentication)

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Select your preferred sign-in methods (Email, Google, GitHub, etc.)
4. Go to **API Keys** in the dashboard
5. Copy **Publishable Key** and **Secret Key**

Update `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

The redirect URLs are pre-configured:
```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

---

### 4. Configure Render PostgreSQL (Database)

1. Go to [render.com](https://render.com) and create an account
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: Choose any name
   - **Database**: `master_app_template` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Plan**: Free tier works for development
4. Wait for creation (1-2 minutes)
5. Go to **Connections** → Copy **External Database URL**

Update `.env.local` (add `?ssl=true` at the end):
```env
DATABASE_URL=postgresql://user:password@host.frankfurt-postgres.render.com/database_name?ssl=true
```

> **Important**: The `?ssl=true` suffix is required for Render connections.

---

### 5. Configure Cloudflare R2 (File Storage)

1. Go to [cloudflare.com](https://cloudflare.com) and create an account
2. Navigate to **R2 Object Storage** in sidebar
3. Click **Create bucket**
   - Name it (e.g., `my-app-storage`)
   - Select region
4. Go to **Manage R2 API Tokens** → **Create API Token**
   - Name: Any name
   - Permissions: **Object Read & Write**
   - Specify bucket: Select your bucket
   - Create and **copy both keys immediately**
5. Find your **Account ID** in the dashboard URL or sidebar

Update `.env.local`:
```env
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_ENDPOINT=https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com
R2_BUCKET_NAME=your-bucket-name
```

Files are private by default—accessed via time-limited presigned URLs.

---

### 6. Configure Postmark (Optional - Email)

Skip this step if you don't need email functionality yet.

1. Go to [postmarkapp.com](https://postmarkapp.com) and create an account
2. Create a server
3. Go to **API Tokens** and copy your token
4. Add and verify a sender signature (domain or email)

Update `.env.local`:
```env
POSTMARK_API_TOKEN=your-api-token
POSTMARK_FROM_EMAIL=noreply@yourdomain.com
```

---

### 7. Initialize Database

Push the schema to your database:

```bash
npm run db:push
```

This creates the tables: `user_profiles`, `posts`, `files`.

---

### 8. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Verify Setup

| Feature | How to Test |
|---------|-------------|
| Auth | Sign up → Should redirect to `/dashboard` |
| Database | Go to `/dashboard/data` → Create a post |
| Storage | Go to `/dashboard/storage` → Upload a file |
| Editor | Go to `/dashboard/editor` → Format some text |

---

## Project Structure

```
app/
├── page.tsx                 # Landing page (redirects if signed in)
├── (unauthenticated)/
│   └── (auth)/              # /sign-in, /sign-up
└── dashboard/               # Protected routes (require auth)
    ├── page.tsx             # Dashboard home
    ├── editor/              # Tiptap editor demo
    ├── data/                # Database CRUD demo
    ├── storage/             # File upload demo
    ├── email/               # Email demo
    └── settings/            # User settings

actions/                     # Server actions (all data mutations)
db/
├── db.ts                    # Database connection
└── schema/                  # Table definitions

lib/
├── storage.ts               # R2 upload/download utilities
└── email.ts                 # Postmark send utilities

components/
├── ui/                      # Shadcn components
├── editor/                  # Tiptap editor
└── storage/                 # File upload UI
```

---

## Common Commands

```bash
npm run dev           # Start development server
npm run build         # Production build
npm run db:push       # Push schema changes to database
npm run db:studio     # Open Drizzle Studio (database GUI)
npm run types         # TypeScript type check
npm run clean         # Lint + format code
```

---

## Adding Your Own Features

### Add a Database Table

1. Create schema file in `db/schema/`:
```typescript
// db/schema/products-schema.ts
import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core"

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
})
```

2. Export from `db/schema/index.ts`
3. Run `npm run db:push`

### Add a Server Action

```typescript
// actions/products-actions.ts
"use server"

import { db } from "@/db/db"
import { products } from "@/db/schema"
import type { ActionState } from "@/types/actions-types"

export async function createProduct(
  name: string,
  price: number
): Promise<ActionState<typeof products.$inferSelect>> {
  try {
    const [product] = await db.insert(products).values({ name, price }).returning()
    return { isSuccess: true, message: "Product created", data: product }
  } catch {
    return { isSuccess: false, message: "Failed to create product" }
  }
}
```

### Add a UI Component

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

---

## Troubleshooting

**"SSL required" database error**
→ Add `?ssl=true` to the end of your DATABASE_URL

**Clerk redirect loops**
→ Ensure all `NEXT_PUBLIC_CLERK_*` variables are set in `.env.local`

**R2 upload fails**
→ Verify bucket name matches exactly, and API token has write permission

**Database tables not created**
→ Run `npm run db:push` after setting DATABASE_URL

---

## Additional Documentation

- `docs/ACTIONS_GUIDE.md` - Server action patterns and best practices
- `docs/QUERIES_GUIDE.md` - Database query examples
- `docs/API_GUIDE.md` - REST API route patterns
- `docs/DEPLOYMENT.md` - Production deployment guide
- `docs/POSTMARK_SETUP.md` - Email configuration details
