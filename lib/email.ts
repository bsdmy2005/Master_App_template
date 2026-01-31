import { ServerClient } from "postmark"

// Initialize Postmark client
// Ensure POSTMARK_API_TOKEN is set in your environment variables
const postmarkToken = process.env.POSTMARK_API_TOKEN

let client: ServerClient | null = null

if (postmarkToken) {
  client = new ServerClient(postmarkToken)
}

// Default sender email - update this to your verified domain
const defaultFrom = process.env.POSTMARK_FROM_EMAIL || "noreply@yourdomain.com"

export interface SendEmailOptions {
  to: string
  subject: string
  htmlBody?: string
  textBody?: string
  from?: string
  replyTo?: string
  tag?: string
  metadata?: Record<string, string>
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send a single email using Postmark
 *
 * @example
 * ```ts
 * const result = await sendEmail({
 *   to: "user@example.com",
 *   subject: "Welcome!",
 *   htmlBody: "<h1>Welcome to our app!</h1>",
 *   textBody: "Welcome to our app!"
 * })
 * ```
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  if (!client) {
    console.warn("Postmark client not initialized. Set POSTMARK_API_TOKEN environment variable.")
    return {
      success: false,
      error: "Email service not configured"
    }
  }

  try {
    const response = await client.sendEmail({
      From: options.from || defaultFrom,
      To: options.to,
      Subject: options.subject,
      HtmlBody: options.htmlBody,
      TextBody: options.textBody,
      ReplyTo: options.replyTo,
      Tag: options.tag,
      Metadata: options.metadata
    })

    return {
      success: true,
      messageId: response.MessageID
    }
  } catch (error) {
    console.error("Failed to send email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Send a templated email using Postmark templates
 *
 * @example
 * ```ts
 * const result = await sendTemplateEmail({
 *   to: "user@example.com",
 *   templateAlias: "welcome",
 *   templateModel: {
 *     name: "John",
 *     action_url: "https://example.com/verify"
 *   }
 * })
 * ```
 */
export interface SendTemplateEmailOptions {
  to: string
  templateAlias: string
  templateModel: Record<string, unknown>
  from?: string
  tag?: string
}

export async function sendTemplateEmail(
  options: SendTemplateEmailOptions
): Promise<SendEmailResult> {
  if (!client) {
    console.warn("Postmark client not initialized. Set POSTMARK_API_TOKEN environment variable.")
    return {
      success: false,
      error: "Email service not configured"
    }
  }

  try {
    const response = await client.sendEmailWithTemplate({
      From: options.from || defaultFrom,
      To: options.to,
      TemplateAlias: options.templateAlias,
      TemplateModel: options.templateModel,
      Tag: options.tag
    })

    return {
      success: true,
      messageId: response.MessageID
    }
  } catch (error) {
    console.error("Failed to send template email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return client !== null
}
