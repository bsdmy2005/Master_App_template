"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { Lock } from "lucide-react"
import { toast } from "sonner"

interface PasswordProtectionProps {
  children: React.ReactNode
}

export function PasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if already authenticated
    const authStatus = sessionStorage.getItem("dashboard-authenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }
    setIsChecking(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/check-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (data.success) {
        sessionStorage.setItem("dashboard-authenticated", "true")
        setIsAuthenticated(true)
        toast.success("Access granted")
      } else {
        toast.error("Incorrect password")
        setPassword("")
      }
    } catch (error) {
      toast.error("Error verifying password")
      setPassword("")
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Dialog open={true}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-center text-2xl">
                  Dashboard Access
                </DialogTitle>
                <DialogDescription className="text-center">
                  Please enter the password to access the project management
                  dashboard
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoFocus
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !password}
                >
                  {isLoading ? "Verifying..." : "Access Dashboard"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}

