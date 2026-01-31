# Postmark Email Setup Guide

This guide helps you set up Postmark for transactional emails in this template.

## Prerequisites

1. A Postmark account at [postmarkapp.com](https://postmarkapp.com)
2. A verified sender domain or email address

## Setup Steps

### 1. Get Your API Token

1. Log into Postmark
2. Go to your Server > API Tokens
3. Copy your Server API Token

### 2. Configure Environment Variables

Add to your `.env.local`:

```env
POSTMARK_API_TOKEN=your-server-api-token
POSTMARK_FROM_EMAIL=noreply@yourdomain.com
```

### 3. Using the Email Utilities

The template includes ready-to-use email utilities in `lib/email.ts`:

```typescript
import { sendEmail, sendTemplateEmail } from "@/lib/email"

// Send a basic email
const result = await sendEmail({
  to: "user@example.com",
  subject: "Welcome!",
  htmlBody: "<h1>Welcome to our app!</h1>",
  textBody: "Welcome to our app!"
})

// Send a templated email
const result = await sendTemplateEmail({
  to: "user@example.com",
  templateAlias: "welcome",
  templateModel: {
    name: "John",
    action_url: "https://app.example.com/verify"
  }
})
```

### 4. Create Postmark Templates (Optional)

1. In Postmark, go to Templates
2. Create templates with aliases like "welcome", "password-reset", etc.
3. Use template variables like `{{name}}` in your templates
4. Reference them by alias in `sendTemplateEmail()`

### 5. Create a Server Action for Email

```typescript
// actions/email-actions.ts
"use server"

import { sendEmail } from "@/lib/email"
import type { ActionState } from "@/types/actions-types"

export async function sendWelcomeEmailAction(
  email: string,
  name: string
): Promise<ActionState<{ messageId: string }>> {
  const result = await sendEmail({
    to: email,
    subject: "Welcome to Our App!",
    htmlBody: `<h1>Welcome, ${name}!</h1><p>We're glad you're here.</p>`,
    textBody: `Welcome, ${name}! We're glad you're here.`,
    tag: "welcome"
  })

  if (result.success) {
    return {
      isSuccess: true,
      message: "Welcome email sent",
      data: { messageId: result.messageId! }
    }
  }

  return {
    isSuccess: false,
    message: result.error || "Failed to send email"
  }
}
```

## Helpful Links

- [Postmark Documentation](https://postmarkapp.com/developer)
- [Postmark Templates Guide](https://postmarkapp.com/developer/api/templates-api)
- [Node.js Library](https://www.npmjs.com/package/postmark)

## Troubleshooting

### Email not sending?

1. Check that `POSTMARK_API_TOKEN` is set correctly
2. Verify your sender domain/email in Postmark
3. Check the Postmark Activity log for errors

### Template not found?

1. Ensure the template alias matches exactly (case-sensitive)
2. Check that the template is in the same server as your API token
