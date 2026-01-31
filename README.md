# Master App Template

A clean, production-ready Next.js 15 scaffolding template for rapid prototyping. Perfect for quickly spinning up new projects with authentication, database, email, and a rich text editor already configured.

## Features

- **Authentication**: [Clerk](https://clerk.com) for secure user management
- **Database**: [Supabase](https://supabase.com) with [Drizzle ORM](https://orm.drizzle.team)
- **Email**: [Postmark](https://postmarkapp.com) for transactional emails
- **Rich Text Editor**: [Tiptap](https://tiptap.dev) with formatting toolbar
- **UI Components**: [Shadcn UI](https://ui.shadcn.com) + Tailwind CSS
- **TypeScript**: Full type safety throughout
- **Dark Mode**: Theme switching with next-themes

## Quick Start

```bash
# Clone the template
git clone https://github.com/your-repo/master-app-template.git my-project
cd my-project

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## Environment Variables

Create a `.env.local` file with:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database (Supabase)
DATABASE_URL=postgresql://...

# Email (Postmark) - Optional
POSTMARK_API_TOKEN=...
POSTMARK_FROM_EMAIL=noreply@yourdomain.com
```

## Project Structure

```
├── app/
│   ├── (unauthenticated)/     # Public routes
│   │   ├── (auth)/            # Sign-in, Sign-up pages
│   │   └── (marketing)/       # Landing page, features
│   ├── dashboard/             # Protected app routes
│   │   ├── editor/            # Tiptap editor demo
│   │   ├── data/              # Database example
│   │   ├── email/             # Email demo
│   │   └── settings/          # User settings
│   └── api/                   # API routes
├── actions/                   # Server actions
│   ├── posts-actions.ts       # Example CRUD actions
│   └── users-actions.ts       # User profile actions
├── components/
│   ├── ui/                    # Shadcn UI components
│   ├── editor/                # Tiptap editor
│   └── utility/               # Theme toggle, etc.
├── db/
│   ├── db.ts                  # Database connection
│   └── schema/                # Drizzle schemas
├── lib/
│   ├── email.ts               # Postmark utilities
│   └── utils.ts               # Helper functions
├── types/
│   └── actions-types.ts       # ActionState type
└── docs/                      # Documentation
    ├── ACTIONS_GUIDE.md
    ├── QUERIES_GUIDE.md
    ├── API_GUIDE.md
    └── DEPLOYMENT.md
```

## Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run types        # Type check
npm run clean        # Lint + format

# Database
npm run db:push      # Push schema to database
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio

# Testing
npm run test         # Run all tests
npm run test:unit    # Run unit tests
npm run test:e2e     # Run e2e tests
```

## Documentation

- [Server Actions Guide](./docs/ACTIONS_GUIDE.md) - CRUD patterns with ActionState
- [Database Queries Guide](./docs/QUERIES_GUIDE.md) - Drizzle ORM usage
- [API Routes Guide](./docs/API_GUIDE.md) - Webhooks and external integrations
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment

## Adding New Features

### 1. Add a Database Table

```typescript
// db/schema/my-table-schema.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const myTable = pgTable("my_table", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

// Export from db/schema/index.ts
export * from "./my-table-schema"
```

### 2. Create Server Actions

```typescript
// actions/my-table-actions.ts
"use server"

import { db } from "@/db/db"
import { myTable } from "@/db/schema"
import type { ActionState } from "@/types/actions-types"

export async function createItemAction(name: string): Promise<ActionState<Item>> {
  // Implementation...
}
```

### 3. Add UI Components

```bash
# Add Shadcn components
npx shadcn@latest add button card dialog
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Auth**: Clerk
- **Database**: PostgreSQL + Drizzle ORM
- **Styling**: Tailwind CSS 4
- **UI**: Shadcn UI + Radix UI
- **Email**: Postmark
- **Editor**: Tiptap
- **Animations**: Framer Motion

## License

MIT
