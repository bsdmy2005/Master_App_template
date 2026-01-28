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
import { Lightbulb, Send, CheckCircle2, Building2, FileText } from "lucide-react"
import { toast } from "sonner"
import { getClientsAction } from "@/actions/db/clients-actions"
import { createIdeaAction } from "@/actions/db/ideas-actions"
import { RichTextEditor } from "./rich-text-editor"
import type { SelectClient } from "@/db/schema"

interface IdeaSubmissionFormProps {
  currentUser: {
    firstName: string
    surname: string
    email: string
  }
  onSubmitted?: () => void
}

interface FormData {
  clientId: string
  proposedClientName: string
  title: string
  description: string
}

const INITIAL_FORM: FormData = {
  clientId: "",
  proposedClientName: "",
  title: "",
  description: ""
}

export function IdeaSubmissionForm({ currentUser, onSubmitted }: IdeaSubmissionFormProps) {
  const [clients, setClients] = useState<SelectClient[]>([])
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isNewClient, setIsNewClient] = useState(false)

  useEffect(() => {
    async function loadClients() {
      const result = await getClientsAction()
      if (result.isSuccess) {
        setClients(result.data)
      }
    }
    loadClients()
  }, [])

  const handleClientChange = (value: string) => {
    if (value === "__new__") {
      setIsNewClient(true)
      setFormData((prev) => ({ ...prev, clientId: "", proposedClientName: "" }))
    } else if (value === "__all__") {
      setIsNewClient(false)
      setFormData((prev) => ({ ...prev, clientId: "__all__", proposedClientName: "" }))
    } else {
      setIsNewClient(false)
      setFormData((prev) => ({ ...prev, clientId: value, proposedClientName: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createIdeaAction({
        id: crypto.randomUUID(),
        clientId: formData.clientId === "__all__" ? null : (formData.clientId || null),
        proposedClientName: isNewClient ? formData.proposedClientName : (formData.clientId === "__all__" ? "All Clients" : null),
        title: formData.title,
        description: formData.description,
        submittedByFirstName: currentUser.firstName,
        submittedBySurname: currentUser.surname,
        submittedByEmail: currentUser.email,
        submittedByOrganization: null,
        status: "submitted",
        priority: "not-set"
      })

      if (result.isSuccess) {
        setIsSubmitted(true)
        toast.success("Your idea has been submitted!")
        onSubmitted?.()
      } else {
        toast.error(result.message || "Failed to submit idea")
      }
    } catch (error) {
      toast.error("An error occurred while submitting your idea")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewIdea = () => {
    setFormData(INITIAL_FORM)
    setIsNewClient(false)
    setIsSubmitted(false)
  }

  // Check if description has content
  const hasDescription = formData.description && formData.description.replace(/<[^>]*>/g, "").trim().length > 0

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-[40vh] items-center justify-center"
      >
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Idea Submitted!</CardTitle>
            <CardDescription className="text-base">
              Your idea has been recorded. You can view and edit it in &quot;My Ideas&quot;.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleNewIdea} variant="outline" className="w-full">
              Submit Another Idea
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Example Card */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-amber-500" />
            Example Submission
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Title:</span>{" "}
            <span className="text-muted-foreground">Natural Language FX Spot Trade Entry</span>
          </div>
          <div>
            <span className="font-medium">Description:</span>
            <p className="mt-1 text-muted-foreground">
              Our FX desk needs a way to input spot trades using plain English instead of navigating through multiple Murex screens...
            </p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground text-xs">
              <li>What problem are you solving?</li>
              <li>What functionality do you need?</li>
              <li>Current pain points</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>New Idea</CardTitle>
          <CardDescription>
            Submitting as {currentUser.firstName} {currentUser.surname}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Client Selection */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                Client
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client">Select Client *</Label>
                  <Select
                    value={isNewClient ? "__new__" : formData.clientId}
                    onValueChange={handleClientChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">
                        <span className="font-medium">All Clients</span>
                      </SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__">
                        + Propose New Client
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isNewClient && (
                  <div className="space-y-2">
                    <Label htmlFor="proposedClientName">Client Name *</Label>
                    <Input
                      id="proposedClientName"
                      value={formData.proposedClientName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          proposedClientName: e.target.value
                        }))
                      }
                      placeholder="Enter client name"
                      required={isNewClient}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Idea Details */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="h-4 w-4" />
                Idea Details
              </h3>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Brief summary of your idea"
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <RichTextEditor
                  content={formData.description}
                  onChange={(content) =>
                    setFormData((prev) => ({ ...prev, description: content }))
                  }
                  placeholder="Describe your idea in detail. What problem does it solve? What functionality do you need?"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.title ||
                  !hasDescription ||
                  (!formData.clientId && !formData.proposedClientName) ||
                  (isNewClient && !formData.proposedClientName)
                }
                className="bg-amber-500 hover:bg-amber-600"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Idea
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
