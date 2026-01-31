import { currentUser } from "@clerk/nextjs/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, PenSquare, Database, Mail, BookOpen } from "lucide-react"

export default async function DashboardPage() {
  const user = await currentUser()

  const features = [
    {
      title: "Rich Text Editor",
      description: "Try the Tiptap editor with formatting, lists, and more",
      icon: PenSquare,
      href: "/dashboard/editor",
      color: "text-blue-500"
    },
    {
      title: "Database Example",
      description: "See how to use Drizzle ORM with server actions",
      icon: Database,
      href: "/dashboard/data",
      color: "text-green-500"
    },
    {
      title: "Email Integration",
      description: "Learn how to send emails with Postmark",
      icon: Mail,
      href: "/dashboard/email",
      color: "text-purple-500"
    },
    {
      title: "Documentation",
      description: "Guides for actions, queries, and API patterns",
      icon: BookOpen,
      href: "/docs",
      color: "text-orange-500"
    }
  ]

  return (
    <div className="container mx-auto p-6 md:p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName || "Developer"}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          This is your dashboard. Explore the template features below.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Authentication</CardDescription>
            <CardTitle className="text-2xl text-green-500">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Clerk authentication configured
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Database</CardDescription>
            <CardTitle className="text-2xl text-blue-500">Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Drizzle ORM with Supabase
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Email</CardDescription>
            <CardTitle className="text-2xl text-purple-500">Configured</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Postmark integration ready
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <h2 className="mb-4 text-xl font-semibold">Explore Features</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title} className="group transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" className="group-hover:bg-accent">
                <Link href={feature.href} className="flex items-center gap-2">
                  Explore
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting Started */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Quick steps to customize this template for your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>Update the database schema in <code className="rounded bg-muted px-1 py-0.5">db/schema/</code></li>
            <li>Create server actions in <code className="rounded bg-muted px-1 py-0.5">actions/</code></li>
            <li>Add API routes in <code className="rounded bg-muted px-1 py-0.5">app/api/</code></li>
            <li>Customize UI components in <code className="rounded bg-muted px-1 py-0.5">components/</code></li>
            <li>Configure Postmark for email in <code className="rounded bg-muted px-1 py-0.5">lib/email.ts</code></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
