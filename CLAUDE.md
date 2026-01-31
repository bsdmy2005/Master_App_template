# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run types` - Run TypeScript type checking
- `npm run format:write` - Format code with Prettier
- `npm run clean` - Run both lint:fix and format:write

### Database
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio

### Testing
- `npm run test` - Run all tests (unit + e2e)
- `npm run test:unit` - Run Jest unit tests
- `npm run test:e2e` - Run Playwright e2e tests

### Shadcn UI Components
- `npx shadcn@latest add [component-name]` - Install new Shadcn UI components

## Architecture

This is a Next.js 15 Master App Template using the App Router with clear separation between authenticated and unauthenticated routes.

### Route Structure
- `/app/(unauthenticated)` - Public routes
  - `(marketing)` - Landing pages, pricing, features
  - `(auth)` - Sign-in and sign-up (Clerk)
- `/app/dashboard` - Protected routes requiring Clerk auth
  - `editor` - Tiptap editor demo
  - `data` - Database example
  - `email` - Email demo
  - `settings` - User settings

### Key Patterns
- **Server Actions** in `/actions` for data mutations with ActionState return type
- **Database Schema** in `/db/schema` using Drizzle ORM with PostgreSQL (Supabase)
- **UI Components** in `/components/ui` from Shadcn UI library
- **Authentication** handled by Clerk middleware with protected route groups
- **Email** via Postmark with utilities in `/lib/email.ts`
- **Rich Text Editor** using Tiptap in `/components/editor`

### Data Flow
1. Authentication state managed by Clerk (`@clerk/nextjs`)
2. User data optionally extended in PostgreSQL via Drizzle ORM
3. Server actions return `ActionState<T>` for consistent error handling
4. Email notifications sent via Postmark

### Environment Variables Required
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `DATABASE_URL` - PostgreSQL connection string (Supabase)
- `POSTMARK_API_TOKEN` - Postmark API token (optional)
- `POSTMARK_FROM_EMAIL` - Verified sender email (optional)
