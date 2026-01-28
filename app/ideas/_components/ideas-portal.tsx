"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Lightbulb, User, PlusCircle, List, Users, LogOut } from "lucide-react"
import { getIdeaSubmittersAction } from "@/actions/db/ideas-actions"
import { IdeaSubmissionForm } from "./idea-submission-form"
import { MyIdeasView } from "./my-ideas-view"
import { AllIdeasView } from "./all-ideas-view"

interface Submitter {
  firstName: string
  surname: string
  email: string
}

interface CurrentUser {
  firstName: string
  surname: string
  email: string
}

type ViewType = "submit" | "my-ideas" | "all-ideas"

const navigation = [
  { id: "submit", label: "Submit New", icon: PlusCircle },
  { id: "my-ideas", label: "My Ideas", icon: List },
  { id: "all-ideas", label: "All Ideas", icon: Users }
] as const

export function IdeasPortal() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [previousSubmitters, setPreviousSubmitters] = useState<Submitter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)
  const [newUserForm, setNewUserForm] = useState({ firstName: "", surname: "", email: "" })
  const [currentView, setCurrentView] = useState<ViewType>("submit")

  // Load previous submitters
  useEffect(() => {
    async function loadSubmitters() {
      const result = await getIdeaSubmittersAction()
      if (result.isSuccess) {
        setPreviousSubmitters(result.data)
      }
      setIsLoading(false)
    }
    loadSubmitters()
  }, [])

  // Handle user selection
  const handleUserSelect = (email: string) => {
    if (email === "__new__") {
      setIsNewUser(true)
      setCurrentUser(null)
    } else {
      const user = previousSubmitters.find((s) => s.email === email)
      if (user) {
        setCurrentUser(user)
        setIsNewUser(false)
      }
    }
  }

  // Handle new user creation
  const handleNewUserContinue = () => {
    if (newUserForm.firstName && newUserForm.surname && newUserForm.email) {
      setCurrentUser({
        firstName: newUserForm.firstName,
        surname: newUserForm.surname,
        email: newUserForm.email
      })
      // Add to previous submitters for this session
      setPreviousSubmitters((prev) => [...prev, newUserForm])
      setIsNewUser(false)
    }
  }

  // Handle sign out
  const handleSignOut = () => {
    setCurrentUser(null)
    setIsNewUser(false)
    setNewUserForm({ firstName: "", surname: "", email: "" })
  }

  // Callback when a new idea is submitted
  const handleIdeaSubmitted = () => {
    setCurrentView("my-ideas")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  // User identification screen
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <Lightbulb className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold">Ideas Portal</h1>
            <p className="mt-2 text-muted-foreground">
              Submit and manage your ideas
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Identify Yourself
              </CardTitle>
              <CardDescription>
                Select yourself from the list or register as a new contributor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isNewUser ? (
                <>
                  <Select onValueChange={handleUserSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select yourself..." />
                    </SelectTrigger>
                    <SelectContent>
                      {previousSubmitters.map((submitter) => (
                        <SelectItem key={submitter.email} value={submitter.email}>
                          {submitter.firstName} {submitter.surname}
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__">
                        + I&apos;m new here
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {previousSubmitters.length === 0 && (
                    <div className="space-y-3">
                      <p className="text-center text-sm text-muted-foreground">
                        No previous contributors yet.
                      </p>
                      <Button
                        onClick={() => setIsNewUser(true)}
                        className="w-full bg-amber-500 hover:bg-amber-600"
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newUserForm.firstName}
                        onChange={(e) =>
                          setNewUserForm((prev) => ({ ...prev, firstName: e.target.value }))
                        }
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="surname">Surname *</Label>
                      <Input
                        id="surname"
                        value={newUserForm.surname}
                        onChange={(e) =>
                          setNewUserForm((prev) => ({ ...prev, surname: e.target.value }))
                        }
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) =>
                        setNewUserForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="john.doe@company.com"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsNewUser(false)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleNewUserContinue}
                      disabled={!newUserForm.firstName || !newUserForm.surname || !newUserForm.email}
                      className="flex-1 bg-amber-500 hover:bg-amber-600"
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Main portal with sidebar
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30">
        <div className="flex h-full flex-col p-4">
          <div className="mb-6">
            <h1 className="text-xl font-bold">Ideas Portal</h1>
            <p className="text-sm text-muted-foreground">Black Glass</p>
          </div>

          {/* User info */}
          <div className="mb-6 rounded-lg border bg-background p-3">
            <p className="text-sm font-medium">
              {currentUser.firstName} {currentUser.surname}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentUser.email}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-amber-500/10 text-amber-600"
                  )}
                  onClick={() => setCurrentView(item.id as ViewType)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              )
            })}
          </nav>

          {/* Sign out */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Switch User
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full p-6"
        >
          {currentView === "submit" && (
            <IdeaSubmissionForm
              currentUser={currentUser}
              onSubmitted={handleIdeaSubmitted}
            />
          )}
          {currentView === "my-ideas" && (
            <MyIdeasView currentUser={currentUser} />
          )}
          {currentView === "all-ideas" && (
            <AllIdeasView currentUserEmail={currentUser.email} />
          )}
        </motion.div>
      </main>
    </div>
  )
}
