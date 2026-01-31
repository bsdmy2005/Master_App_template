"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function EmailDemoPage() {
  const [sending, setSending] = useState(false)

  async function handleSendTest(formData: FormData) {
    setSending(true)
    try {
      // This would call a server action in a real implementation
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Test email sent! (Demo - no actual email sent)")
    } catch {
      toast.error("Failed to send email")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Email Integration</h1>
        <p className="mt-2 text-muted-foreground">
          Send transactional emails with Postmark
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
            <CardDescription>
              Try sending a test email (requires Postmark configuration)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSendTest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="to">Recipient Email</Label>
                <Input
                  id="to"
                  name="to"
                  type="email"
                  placeholder="test@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="Test Email from Master Template"
                />
              </div>
              <Button type="submit" disabled={sending}>
                {sending ? "Sending..." : "Send Test Email"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Guide</CardTitle>
            <CardDescription>
              Configure Postmark for your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-inside list-decimal space-y-3 text-sm text-muted-foreground">
              <li>
                Create a Postmark account at{" "}
                <a
                  href="https://postmarkapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  postmarkapp.com
                </a>
              </li>
              <li>Create a new server and get your API token</li>
              <li>
                Add to your <code className="rounded bg-muted px-1">.env.local</code>:
                <pre className="mt-2 rounded bg-muted p-2 text-xs">
                  POSTMARK_API_TOKEN=your-api-token{"\n"}
                  POSTMARK_FROM_EMAIL=noreply@yourdomain.com
                </pre>
              </li>
              <li>Verify your sender domain in Postmark</li>
              <li>Use the email utilities from <code className="rounded bg-muted px-1">lib/email.ts</code></li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Code Examples */}
      <Tabs defaultValue="basic" className="mt-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Email</TabsTrigger>
          <TabsTrigger value="template">Template Email</TabsTrigger>
          <TabsTrigger value="action">Server Action</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Send Basic Email</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                <code>{`import { sendEmail } from "@/lib/email"

const result = await sendEmail({
  to: "user@example.com",
  subject: "Welcome to Our App!",
  htmlBody: \`
    <h1>Welcome!</h1>
    <p>Thanks for signing up.</p>
  \`,
  textBody: "Welcome! Thanks for signing up."
})

if (result.success) {
  console.log("Email sent:", result.messageId)
} else {
  console.error("Failed:", result.error)
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Send Template Email</CardTitle>
              <CardDescription>
                Use Postmark templates for consistent emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                <code>{`import { sendTemplateEmail } from "@/lib/email"

const result = await sendTemplateEmail({
  to: "user@example.com",
  templateAlias: "welcome",
  templateModel: {
    name: "John",
    action_url: "https://myapp.com/verify?token=abc123",
    product_name: "My App"
  }
})

// Create templates in Postmark dashboard
// Use template variables like {{name}} in your template`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="action">
          <Card>
            <CardHeader>
              <CardTitle>Email Server Action</CardTitle>
              <CardDescription>
                Create a reusable server action for sending emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                <code>{`// actions/email-actions.ts
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
    htmlBody: \`<h1>Welcome, \${name}!</h1><p>We're glad you're here.</p>\`,
    textBody: \`Welcome, \${name}! We're glad you're here.\`,
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
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
