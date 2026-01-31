import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Shield,
  Database,
  Mail,
  PenSquare,
  Moon,
  Palette,
  ArrowRight
} from "lucide-react"

const features = [
  {
    name: "Clerk Authentication",
    description: "Sign-in, sign-up, and protected routes. Social logins and MFA ready.",
    icon: Shield
  },
  {
    name: "Supabase + Drizzle",
    description: "PostgreSQL database with type-safe ORM. Schema push and migrations.",
    icon: Database
  },
  {
    name: "Postmark Email",
    description: "Send transactional emails. Template support included.",
    icon: Mail
  },
  {
    name: "Tiptap Editor",
    description: "Rich text editor with formatting toolbar and HTML output.",
    icon: PenSquare
  },
  {
    name: "Shadcn UI",
    description: "Pre-built accessible components. Easy to customize.",
    icon: Palette
  },
  {
    name: "Dark Mode",
    description: "Theme switching with system preference detection.",
    icon: Moon
  }
]

export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <span className="text-xl font-bold">Master App Template</span>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Master App Template
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Next.js 15 starter with authentication, database, email, and rich text
          editor already configured. Clone and start building.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/sign-up">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-center text-2xl font-bold">What's Included</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">
          Everything you need to start building, already wired up.
        </p>

        <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.name} className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{feature.name}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Structure */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-center text-2xl font-bold">Project Structure</h2>
          <div className="mx-auto mt-8 max-w-lg rounded-lg border bg-card p-6">
            <pre className="text-sm text-muted-foreground">
{`app/
├── page.tsx           # This landing page
├── dashboard/         # Protected routes
│   ├── editor/        # Tiptap demo
│   ├── data/          # Database demo
│   └── email/         # Email demo
actions/               # Server actions
db/schema/             # Database tables
lib/email.ts           # Postmark helpers
components/editor/     # Tiptap component`}
            </pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Ready to build?</h2>
        <p className="mt-2 text-muted-foreground">
          Sign up and explore the dashboard demos.
        </p>
        <Button size="lg" className="mt-6" asChild>
          <Link href="/sign-up">
            Create Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Master App Template
        </div>
      </footer>
    </div>
  )
}
