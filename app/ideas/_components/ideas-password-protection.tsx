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
import { Lightbulb } from "lucide-react"
import { toast } from "sonner"

interface IdeasPasswordProtectionProps {
  children: React.ReactNode
}

export function IdeasPasswordProtection({ children }: IdeasPasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if already authenticated
    const authStatus = sessionStorage.getItem("ideas-portal-authenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }
    setIsChecking(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/check-ideas-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (data.success) {
        sessionStorage.setItem("ideas-portal-authenticated", "true")
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
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                  <Lightbulb className="h-6 w-6 text-amber-500" />
                </div>
                <DialogTitle className="text-center text-2xl">
                  Ideas Portal
                </DialogTitle>
                <DialogDescription className="text-center">
                  Enter your access code to submit feature requests and ideas for Black Glass solutions
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Access Code</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter access code"
                    autoFocus
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  disabled={isLoading || !password}
                >
                  {isLoading ? "Verifying..." : "Access Ideas Portal"}
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
