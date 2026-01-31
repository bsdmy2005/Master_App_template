"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Lightbulb,
  LayoutDashboard,
  ArrowRight,
  Boxes,
  Users,
  CheckCircle,
  Search,
  FileText
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Logo/Brand */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Boxes className="h-7 w-7 text-primary" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Black Glass
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Use Case Manager
          </p>

          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Track project progress and manage ideas submitted by the team.
            Submit new ideas, view their status, and see what&apos;s being worked on.
          </p>
        </motion.div>

        {/* Workflow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-10 max-w-2xl"
        >
          <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
            How ideas flow through the system
          </p>
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 md:h-14 md:w-14">
                <Lightbulb className="h-5 w-5 text-amber-500 md:h-6 md:w-6" />
              </div>
              <span className="mt-2 text-xs font-medium md:text-sm">Idea Submitted</span>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground/50" />

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 md:h-14 md:w-14">
                <Search className="h-5 w-5 text-blue-500 md:h-6 md:w-6" />
              </div>
              <span className="mt-2 text-xs font-medium md:text-sm">Reviewed & Classified</span>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground/50" />

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 md:h-14 md:w-14">
                <FileText className="h-5 w-5 text-purple-500 md:h-6 md:w-6" />
              </div>
              <span className="mt-2 text-xs font-medium md:text-sm">Becomes Use Case</span>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground/50" />

            {/* Step 4 */}
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 md:h-14 md:w-14">
                <CheckCircle className="h-5 w-5 text-green-500 md:h-6 md:w-6" />
              </div>
              <span className="mt-2 text-xs font-medium md:text-sm">Delivered</span>
            </div>
          </div>
        </motion.div>

        {/* Two Paths */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2"
        >
          {/* Project Team Path */}
          <Card className="group relative overflow-hidden border transition-all hover:border-primary/50 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Project Dashboard</CardTitle>
              <CardDescription>
                For developers and project managers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                View use cases, track progress, manage timelines and assignments.
              </p>
              <Link href="/dashboard" className="block">
                <Button className="w-full" size="sm">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Idea Contributor Path */}
          <Card className="group relative overflow-hidden border transition-all hover:border-amber-500/50 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Lightbulb className="h-5 w-5 text-amber-500" />
              </div>
              <CardTitle className="text-lg">Submit an Idea</CardTitle>
              <CardDescription>
                For consultants and team members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Describe what you need. Select a client and provide details.
              </p>
              <Link href="/ideas" className="block">
                <Button className="w-full bg-amber-500 hover:bg-amber-600" size="sm">
                  Submit Idea
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center text-xs text-muted-foreground"
        >
          <Users className="mr-1 inline h-3 w-3" />
          Both sections require an access code
        </motion.p>
      </div>
    </div>
  )
}
