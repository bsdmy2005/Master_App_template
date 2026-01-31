# Deployment Guide

This guide covers deploying the Master App Template to production.

## Prerequisites

1. A Vercel account (recommended) or other Next.js hosting
2. A Supabase project for the database
3. A Clerk application for authentication
4. A Postmark account for email (optional)

## Environment Variables

Create these environment variables in your deployment platform:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Optional: Clerk webhook secret for syncing user data
CLERK_WEBHOOK_SECRET=whsec_...

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Email (Postmark)
POSTMARK_API_TOKEN=...
POSTMARK_FROM_EMAIL=noreply@yourdomain.com
```

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and connection string

### 2. Get Database URL

1. In Supabase dashboard, go to Settings > Database
2. Find "Connection string" under "Connection Pooling"
3. Copy the URI and replace `[YOUR-PASSWORD]` with your database password

### 3. Run Migrations

```bash
# Push schema to production database
DATABASE_URL=your-production-url npm run db:push

# Or run migrations
DATABASE_URL=your-production-url npm run db:migrate
```

## Clerk Setup

### 1. Create a Clerk Application

1. Go to [clerk.com](https://clerk.com) and create a new application
2. Configure authentication methods (email, social logins, etc.)
3. Copy your API keys

### 2. Configure URLs

In Clerk dashboard, set:
- **Sign-in URL**: `/sign-in`
- **Sign-up URL**: `/sign-up`
- **After sign-in URL**: `/dashboard`
- **After sign-up URL**: `/dashboard`

### 3. Set Up Webhooks (Optional)

To sync user data to your database:

1. In Clerk dashboard, go to Webhooks
2. Add a new endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy the webhook secret to `CLERK_WEBHOOK_SECRET`

## Postmark Setup

### 1. Create a Postmark Account

1. Go to [postmarkapp.com](https://postmarkapp.com)
2. Create a new server

### 2. Verify Domain

1. Add your sending domain in Postmark
2. Add DNS records for SPF and DKIM verification

### 3. Get API Token

1. Go to your server settings
2. Copy the API token to `POSTMARK_API_TOKEN`

## Vercel Deployment

### 1. Connect Repository

1. Push your code to GitHub
2. In Vercel, import the repository
3. Configure build settings (usually auto-detected)

### 2. Add Environment Variables

In Vercel project settings:
1. Go to Settings > Environment Variables
2. Add all required variables

### 3. Deploy

```bash
# Using Vercel CLI
npm i -g vercel
vercel

# Or push to main branch for automatic deployment
git push origin main
```

## Post-Deployment Checklist

- [ ] Test authentication flow (sign up, sign in, sign out)
- [ ] Verify database connection (check data pages)
- [ ] Test email sending (if configured)
- [ ] Check Clerk webhook (if configured)
- [ ] Verify protected routes redirect to sign-in
- [ ] Test on mobile devices
- [ ] Enable Vercel Analytics (optional)

## Custom Domain

### Vercel

1. In Vercel project, go to Settings > Domains
2. Add your domain
3. Configure DNS records as instructed

### Clerk

1. In Clerk dashboard, update your production domain
2. Ensure sign-in/sign-up URLs match

## Monitoring

### Vercel

- Enable Analytics in project settings
- Set up error tracking with Sentry (optional)

### Supabase

- Monitor database health in Supabase dashboard
- Set up alerts for connection limits

### Postmark

- Check email delivery reports in Postmark dashboard
- Set up bounce handling

## Troubleshooting

### Database Connection Issues

1. Check `DATABASE_URL` is correct
2. Verify IP allowlist in Supabase (if enabled)
3. Check connection pooling settings

### Authentication Issues

1. Verify Clerk keys match production app
2. Check redirect URLs are configured
3. Ensure middleware is protecting correct routes

### Email Not Sending

1. Verify domain is verified in Postmark
2. Check API token is correct
3. Review Postmark activity log for errors
