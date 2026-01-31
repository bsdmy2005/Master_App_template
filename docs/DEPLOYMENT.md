# Deployment Guide

This guide covers deploying the Master App Template to production.

## Prerequisites

1. A Vercel account (recommended) or other Next.js hosting
2. A Render PostgreSQL database
3. A Cloudflare R2 bucket for object storage
4. A Clerk application for authentication
5. A Postmark account for email (optional)

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

# Database (Render PostgreSQL)
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST].frankfurt-postgres.render.com/[DATABASE]

# Object Storage (Cloudflare R2)
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_ENDPOINT=https://[ACCOUNT-ID].r2.cloudflarestorage.com
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://pub-your-bucket-id.r2.dev

# Email (Postmark)
POSTMARK_API_TOKEN=...
POSTMARK_FROM_EMAIL=noreply@yourdomain.com
```

## Render PostgreSQL Setup

### 1. Create a Render PostgreSQL Database

1. Go to [render.com](https://render.com) and create a new PostgreSQL database
2. Choose your plan (free tier available for development)
3. Select your region (e.g., Frankfurt for EU)

### 2. Get Database URL

1. In Render dashboard, go to your PostgreSQL instance
2. Click "Connect" and copy the "External Database URL"
3. This is your `DATABASE_URL`

### 3. Run Migrations

```bash
# Push schema to production database
DATABASE_URL=your-production-url npm run db:push

# Or run migrations
DATABASE_URL=your-production-url npm run db:migrate
```

## Cloudflare R2 Setup

### 1. Create an R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > R2
2. Create a new bucket (e.g., `master-app-storage`)
3. Note your bucket name

### 2. Create R2 API Token

1. In R2, click "Manage R2 API Tokens"
2. Create a new API token with "Object Read & Write" permissions
3. Copy the following credentials:
   - Access Key ID → `R2_ACCESS_KEY_ID`
   - Secret Access Key → `R2_SECRET_ACCESS_KEY`
   - Endpoint URL → `R2_ENDPOINT`

### 3. Configure Public Access (Optional)

For public file URLs:
1. In your bucket settings, enable "R2.dev subdomain"
2. Copy the public URL to `R2_PUBLIC_URL`
3. Alternatively, configure a custom domain

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
- [ ] Test file uploads to R2
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

### Render

- Monitor database health in Render dashboard
- Set up alerts for connection usage

### Cloudflare

- Monitor R2 usage in Cloudflare dashboard
- Set up alerts for storage limits

### Postmark

- Check email delivery reports in Postmark dashboard
- Set up bounce handling

## Troubleshooting

### Database Connection Issues

1. Check `DATABASE_URL` is correct
2. Verify SSL settings (Render requires SSL by default)
3. Check connection string format

### R2 Storage Issues

1. Verify API credentials are correct
2. Check bucket name matches `R2_BUCKET_NAME`
3. Ensure CORS is configured for your domain
4. Check file size limits

### Authentication Issues

1. Verify Clerk keys match production app
2. Check redirect URLs are configured
3. Ensure middleware is protecting correct routes

### Email Not Sending

1. Verify domain is verified in Postmark
2. Check API token is correct
3. Review Postmark activity log for errors
